import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, QrCode, ArrowDownLeft,
  ArrowUpRight, ArrowLeft, Camera, Edit3, ShieldCheck
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime } from '../utils/formatting';
import { verifyTransactionSignature } from '../services/crypto';
import { buildSignablePayload } from '../services/ledger';
import { getDevice, getTransaction, getDB } from '../services/db';
import PaymentReceipt from '../components/wallet/PaymentReceipt';

const SCAN_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  VERIFYING: 'verifying',
  OFFLINE_VERIFIED: 'offline_verified',
  SHOW_ACK_QR: 'show_ack_qr',
  ACK_RECORDED: 'ack_recorded',
  REQUEST_DETECTED: 'request_detected',
  INVALID: 'invalid',
  ACCEPTED: 'accepted',
  ERROR: 'error',
};

function QRScanner() {
  const { currentUser } = useAuth();
  const { acceptIncomingPayment, createReceiverAcknowledgment, recordSenderAcknowledgment } = useWallet();
  const navigate = useNavigate();

  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [scannedTx, setScannedTx] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [ackPayload, setAckPayload] = useState(null);
  const [ackQrDataUrl, setAckQrDataUrl] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isGeneratingAck, setIsGeneratingAck] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  const scannerRef = useRef(null);

  // Start HTML5 camera scanner
  const startScanner = useCallback(() => {
    setScanState(SCAN_STATES.SCANNING);
    setScannedTx(null);
    setPaymentRequest(null);
    setVerifyResult(null);
    setErrorMsg('');

    setTimeout(() => {
      if (!document.getElementById('qr-reader')) return;

      try {
        const scanner = new Html5QrcodeScanner('qr-reader', {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        }, false);

        scanner.render(
          async (decodedText) => {
            scanner.clear().catch(() => {});
            await handleScannedData(decodedText);
          },
          () => {} // scan errors are expected while scanning
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.warn('[scanner init error]', err);
      }
    }, 200);
  }, []);

  // Stop scanner safely
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanState(SCAN_STATES.IDLE);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Process decoded QR payload
  async function handleScannedData(rawData) {
    setScanState(SCAN_STATES.VERIFYING);
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      // ─── CASE 1: PAYMENT REQUEST (User scanned someone's receive/request QR) ───
      if (parsed.type === 'PAYMENT_REQUEST') {
        if (parsed.receiverId === currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('You scanned your own payment request QR. You cannot send money to yourself.');
          return;
        }

        setPaymentRequest(parsed);
        setScanState(SCAN_STATES.REQUEST_DETECTED);
        return;
      }

      // ─── CASE 2: OFFLINE PAYMENT (Receiver claims signed money sent by sender) ───
      if (parsed.type === 'OFFLINE_PAYMENT') {
        // Validate required cryptographic fields
        if (!parsed.id || !parsed.senderId || !parsed.amount || !parsed.nonce) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Malformed payment token: Required cryptographic fields are missing from QR code.');
          return;
        }

        // Validate receiver match
        if (parsed.receiverId && parsed.receiverId !== currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg(`This payment was created specifically for ${parsed.receiverName || 'another user'}, not your account.`);
          return;
        }

        if (Number(parsed.amount) <= 0) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Invalid payment amount detected (must be greater than 0).');
          return;
        }

        // Validate 5-minute expiration window
        const txTimestamp = new Date(parsed.timestamp || parsed.createdAt).getTime();
        if (!isNaN(txTimestamp) && (Date.now() - txTimestamp) >= 5 * 60 * 1000) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Payment expired: This offline payment QR was generated more than 5 minutes ago and has been automatically cancelled & refunded on the sender\'s device.');
          return;
        }

        // 1. Check if transaction was already received / claimed on this device
        try {
          const existingTx = await getTransaction(parsed.id);
          if (existingTx) {
            setScanState(SCAN_STATES.INVALID);
            setErrorMsg(`Transaction ${parsed.id} has already been claimed on this device.`);
            return;
          }
        } catch (_) {}

        // 2. Check if nonce was already registered
        try {
          const db = await getDB();
          const existingNonce = await db.get('nonces', parsed.nonce);
          if (existingNonce) {
            setScanState(SCAN_STATES.INVALID);
            setErrorMsg('Replay attack detected: This payment nonce has already been claimed.');
            return;
          }
        } catch (_) {}

        // 3. Verify cryptographic P-256 signature locally
        let sigValid = false;
        let sigNote = 'Signature verification skipped';

        try {
          const senderDevice = await getDevice(parsed.deviceId);
          const publicKeyJwk = parsed.senderPublicKeyJwk || senderDevice?.publicKeyJwk;

          if (publicKeyJwk && parsed.signature && parsed.signature !== 'DEMO_SIG') {
            const signablePayload = buildSignablePayload(parsed);
            sigValid = await verifyTransactionSignature(publicKeyJwk, signablePayload, parsed.signature);
            sigNote = sigValid ? 'ECDSA P-256 Signature Verified ✓' : 'Signature INVALID — Payload was tampered with ✗';
          } else if (parsed.signature === 'DEMO_SIG') {
            sigValid = true;
            sigNote = 'Demo signature (accepted for educational prototype)';
          }
        } catch (e) {
          sigValid = false;
          sigNote = 'Verification exception: ' + e.message;
        }

        if (!sigValid) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Cryptographic signature verification failed: Payload was altered or device key is invalid.');
          return;
        }

        setScannedTx(parsed);
        setVerifyResult({ sigValid, sigNote });
        setScanState(SCAN_STATES.OFFLINE_VERIFIED);
        return;
      }

      // ─── CASE 3: RECEIVER ACKNOWLEDGMENT (Sender scans receiver's signed acknowledgment) ───
      if (parsed.type === 'OFFLINE_PAYMENT_ACK') {
        if (!parsed.transactionRef || !parsed.signature || !parsed.ackNonce) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Malformed acknowledgment token: Required cryptographic fields are missing from QR code.');
          return;
        }

        if (parsed.senderId && parsed.senderId !== currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('This acknowledgment was generated for a different sender account.');
          return;
        }

        try {
          const updatedTx = await recordSenderAcknowledgment(parsed);
          setScannedTx(updatedTx);
          setAckPayload(parsed);
          setScanState(SCAN_STATES.ACK_RECORDED);
          return;
        } catch (ackErr) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg(ackErr.message || 'Failed to verify and record receiver acknowledgment.');
          return;
        }
      }

      // ─── CASE 4: Unknown QR payload ───
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('This QR code is not a valid OfflinePay payment or request.');
    } catch (err) {
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('Could not parse QR data format: ' + err.message);
    }
  }

  // Receiver generates signed acknowledgment QR for sender to scan
  const handleGenerateAcknowledgment = async () => {
    if (!scannedTx) return;
    setIsGeneratingAck(true);
    setErrorMsg('');
    try {
      // 1. Accept and record incoming payment locally on receiver device
      const acceptedResult = await acceptIncomingPayment({
        ...scannedTx,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
      });

      if (acceptedResult) {
        setScannedTx(acceptedResult);
      }

      // 2. Cryptographically sign the acknowledgment payload with receiver's device key
      const ack = await createReceiverAcknowledgment(scannedTx);
      setAckPayload(ack);

      // 3. Render Acknowledgment QR
      const dataUrl = await QRCode.toDataURL(JSON.stringify(ack), {
        width: 260,
        margin: 2,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });
      setAckQrDataUrl(dataUrl);
      setScanState(SCAN_STATES.SHOW_ACK_QR);
    } catch (err) {
      console.error('[scanner] Error generating acknowledgment:', err);
      setErrorMsg(err.message || 'Could not generate signed acknowledgment.');
      setScanState(SCAN_STATES.ERROR);
    } finally {
      setIsGeneratingAck(false);
    }
  };

  // Accept incoming offline payment into local wallet directly (legacy claim fallback)
  const handleAcceptOfflinePayment = async () => {
    if (!scannedTx) return;
    setIsAccepting(true);
    try {
      const acceptedResult = await acceptIncomingPayment({
        ...scannedTx,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
      });
      if (acceptedResult) {
        setScannedTx(acceptedResult);
      }
      setScanState(SCAN_STATES.ACCEPTED);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to accept payment');
      setScanState(SCAN_STATES.ERROR);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleProceedToPay = () => {
    if (!paymentRequest) return;
    navigate('/send', {
      state: {
        receiver: {
          id: paymentRequest.receiverId,
          name: paymentRequest.receiverName || 'Recipient',
        },
        amount: paymentRequest.amount || '',
        note: paymentRequest.note || '',
      }
    });
  };

  const handleReset = () => {
    setScanState(SCAN_STATES.IDLE);
    setScannedTx(null);
    setPaymentRequest(null);
    setVerifyResult(null);
    setErrorMsg('');
    setManualInput('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg hover:bg-[#172337] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors no-underline"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Scan Payment QR
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Scan to pay someone or claim an offline transfer
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowManual(p => !p)}
            className="text-xs font-semibold text-[#38BDF8] hover:text-[#14B8A6] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Edit3 size={13} /> {showManual ? 'Hide Manual' : 'Paste Code'}
          </button>
        </div>

        {/* Manual Payload Fallback (Convenient for quick testing or camera restriction) */}
        {showManual && (
          <Card padding className="bg-[#172337] border border-[#263449] space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
              Manual QR Code Payload
            </h2>
            <textarea
              rows={3}
              placeholder='Paste JSON payload or QR string here...'
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-[#111C2E] text-[#F8FAFC] border border-[#263449] focus:border-[#14B8A6] rounded-lg outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              block
              disabled={!manualInput.trim()}
              onClick={() => handleScannedData(manualInput.trim())}
            >
              Process Payload
            </Button>
          </Card>
        )}

        {/* ─── STATE 1: IDLE ─── */}
        {scanState === SCAN_STATES.IDLE && (
          <Card padding className="text-center py-8 space-y-4 bg-[#111C2E] border border-[#263449]">
            <div className="w-20 h-20 rounded-2xl bg-[#172337] border border-[#263449] text-[#14B8A6] flex items-center justify-center mx-auto shadow-xs">
              <Camera size={40} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Ready to Scan</h2>
              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mt-1">
                Scan another user's identity QR to send them money, or scan a signed payment QR to claim offline funds.
              </p>
            </div>

            <Button
              block
              size="lg"
              variant="primary"
              onClick={startScanner}
              leftIcon={<QrCode size={18} />}
              id="btn-open-camera-scanner"
            >
              Open Camera Scanner
            </Button>
          </Card>
        )}

        {/* ─── STATE 2: SCANNING (Camera Active) ─── */}
        {scanState === SCAN_STATES.SCANNING && (
          <Card padding className="space-y-4 bg-[#111C2E] border border-[#263449]">
            <CardHeader
              title="Camera Viewfinder"
              subtitle="Hold steady over the QR code"
            />
            <div
              id="qr-reader"
              className="w-full rounded-2xl overflow-hidden border-2 border-[#14B8A6]/40 shadow-inner bg-black"
            />
            <Button block variant="outline" onClick={stopScanner}>
              Cancel Scanner
            </Button>
          </Card>
        )}

        {/* ─── STATE 3: VERIFYING ─── */}
        {scanState === SCAN_STATES.VERIFYING && (
          <Card padding className="text-center py-10 space-y-3 bg-[#111C2E] border border-[#263449]">
            <div className="w-12 h-12 rounded-full border-4 border-[#263449] border-t-[#14B8A6] animate-spin mx-auto" />
            <p className="font-bold text-sm text-[#F8FAFC]">Verifying QR Data...</p>
            <p className="text-xs text-[#94A3B8]">Checking cryptographic signature & payload structure</p>
          </Card>
        )}

        {/* ─── STATE 4: PAYMENT REQUEST DETECTED ─── */}
        {scanState === SCAN_STATES.REQUEST_DETECTED && paymentRequest && (
          <Card padding className="space-y-5 bg-[#111C2E] border border-[#263449]">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#172337] border border-[#263449]">
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-[#0B1220] flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                  Payment Request
                </span>
                <p className="text-sm font-bold text-[#F8FAFC] truncate">
                  Pay {paymentRequest.receiverName || 'Recipient'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#172337]">
                <span className="text-[#94A3B8]">Recipient:</span>
                <span className="font-bold text-[#F8FAFC]">{paymentRequest.receiverName}</span>
              </div>
              {paymentRequest.amount ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#172337]">
                  <span className="text-[#94A3B8]">Requested Amount:</span>
                  <span className="font-black text-[#14B8A6] text-sm">
                    {formatCurrency(paymentRequest.amount)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#172337]">
                  <span className="text-[#94A3B8]">Amount:</span>
                  <span className="font-medium text-[#F8FAFC]">Enter upon payment</span>
                </div>
              )}
              {paymentRequest.note && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#172337]">
                  <span className="text-[#94A3B8]">Note:</span>
                  <span className="text-[#F8FAFC] italic">{paymentRequest.note}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button variant="outline" onClick={handleReset} className="w-1/3">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProceedToPay}
                className="w-2/3"
                leftIcon={<ArrowUpRight size={16} />}
                id="btn-proceed-to-pay"
              >
                Proceed to Pay
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 5: OFFLINE PAYMENT VALIDATED — GENERATE ACKNOWLEDGMENT ─── */}
        {scanState === SCAN_STATES.OFFLINE_VERIFIED && scannedTx && (
          <Card padding className="space-y-5 bg-[#111C2E] border border-[#263449]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30">
              <ShieldCheck size={26} className="text-[#22C55E] flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#F8FAFC]">Payment Validated Offline</p>
                <p className="text-[11px] text-[#22C55E]">{verifyResult?.sigNote || 'ECDSA P-256 Signature Verified ✓'}</p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Incoming Amount To Claim
              </span>
              <p className="text-3xl font-black text-[#22C55E] mt-0.5">
                +{formatCurrency(scannedTx.amount)}
              </p>
              <p className="text-xs text-[#94A3B8]">Sender: <strong className="text-[#F8FAFC]">{scannedTx.senderName || 'Sender'}</strong></p>
            </div>

            <div className="divide-y divide-[#263449] border border-[#263449] rounded-xl overflow-hidden bg-[#172337] text-xs">
              <div className="flex items-center justify-between p-3 bg-[#111C2E]">
                <span className="text-[#94A3B8]">Sender:</span>
                <span className="font-bold text-[#F8FAFC]">{scannedTx.senderName || 'Sender'}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-[#94A3B8]">Transaction Ref:</span>
                <span className="font-mono text-[11px] text-[#38BDF8]">{scannedTx.id}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#111C2E]">
                <span className="text-[#94A3B8]">Validation Status:</span>
                <span className="font-bold text-[#22C55E] text-[11px]">Valid Offline Payment</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button variant="outline" onClick={handleReset} className="w-full sm:w-1/3">
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateAcknowledgment}
                loading={isGeneratingAck}
                disabled={isGeneratingAck}
                className="w-full sm:w-2/3 font-bold"
                leftIcon={<QrCode size={16} />}
                id="btn-generate-ack-qr"
              >
                Generate Acknowledgment QR
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 5B: RECEIVER ACKNOWLEDGMENT QR (Show to Sender) ─── */}
        {scanState === SCAN_STATES.SHOW_ACK_QR && (
          <Card padding className="space-y-5 text-center bg-[#111C2E] border border-[#263449]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] mb-2">
                <CheckCircle2 size={13} className="text-[#38BDF8]" />
                <span>Locally Acknowledged — Awaiting Settlement</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Receiver Acknowledgment QR
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                Show this QR to the sender so their device records that you have validated and claimed the payment offline.
              </p>
            </div>

            {/* Acknowledgment QR Display */}
            {ackQrDataUrl && (
              <div className="p-4 rounded-2xl border border-[#263449] bg-[#172337] max-w-xs mx-auto space-y-2.5">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-[#263449]">
                  <img src={ackQrDataUrl} alt="Receiver Acknowledgment QR" className="w-56 h-56 mx-auto" />
                </div>
                <div className="text-[11px] text-[#94A3B8] space-y-0.5">
                  <p className="font-semibold text-[#F8FAFC]">Ref: {scannedTx?.id}</p>
                  <p>Amount: <strong className="text-[#22C55E]">+{formatCurrency(scannedTx?.amount)}</strong></p>
                  <p className="text-[10px] text-[#38BDF8]">Signed with your ECDSA P-256 receiver key</p>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#172337] border border-[#263449] text-xs text-left max-w-xs mx-auto space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <ShieldCheck size={14} className="text-[#38BDF8]" />
                <span>Notice: Not Authoritatively Settled Yet</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Funds are held and credited locally. Final ledger settlement will occur automatically once either device reconnects to the network.
              </p>
            </div>

            <div className="pt-1 max-w-xs mx-auto">
              <Button
                block
                variant="primary"
                onClick={() => navigate('/dashboard')}
                id="btn-done-ack"
              >
                Done
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 5C: SENDER SCANNED ACKNOWLEDGMENT CONFIRMATION ─── */}
        {scanState === SCAN_STATES.ACK_RECORDED && (
          <Card padding className="space-y-5 text-center bg-[#111C2E] border border-[#263449]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] mb-2">
                <CheckCircle2 size={13} className="text-[#22C55E]" />
                <span>Receiver Acknowledged Offline</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Payment Acknowledged Offline
              </h2>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
                Awaiting Synchronization — The receiver has cryptographically verified and acknowledged this offline transaction.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#172337] border border-[#263449] max-w-sm mx-auto space-y-3 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Payment Ref:</span>
                <span className="font-mono text-[#F8FAFC] font-bold">{ackPayload?.transactionRef || scannedTx?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Receiver:</span>
                <span className="font-bold text-[#F8FAFC]">{ackPayload?.receiverName || scannedTx?.receiverName || 'Receiver'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Amount:</span>
                <span className="font-black text-[#14B8A6] text-sm">{formatCurrency(ackPayload?.amount || scannedTx?.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Ack Status:</span>
                <span className="text-[#38BDF8] font-bold">RECEIVER_ACKNOWLEDGED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Timer Protection:</span>
                <span className="text-[#22C55E] font-semibold">Exempt from 5m unclaimed timeout</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#172337] border border-[#263449] text-xs text-left max-w-sm mx-auto space-y-1">
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Both devices now hold a signed record of this transaction. Central authoritative settlement will occur when internet connectivity returns.
              </p>
            </div>

            <div className="pt-1 max-w-sm mx-auto flex gap-2.5">
              <Button
                variant="outline"
                onClick={() => navigate('/transactions')}
                className="w-1/2"
              >
                View History
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
                className="w-1/2 font-bold"
                id="btn-sender-ack-done"
              >
                Done
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 6: PAYMENT ACCEPTED RESULT (Direct claim fallback) ─── */}
        {scanState === SCAN_STATES.ACCEPTED && scannedTx && (
          <PaymentReceipt
            transaction={{
              ...scannedTx,
              status: scannedTx.status || 'RECEIVER_ACKNOWLEDGED',
              method: 'OFFLINE_QR',
              receiverName: currentUser?.name || 'Receiver',
            }}
            isSender={false}
            onDone={() => navigate('/dashboard')}
          />
        )}

        {/* ─── STATE 7: INVALID / ERROR ─── */}
        {(scanState === SCAN_STATES.INVALID || scanState === SCAN_STATES.ERROR) && (
          <Card padding className="text-center py-8 space-y-4 bg-[#111C2E] border border-[#EF4444]/40">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>

            <h2 className="text-base font-bold text-[#EF4444]">Invalid Payment QR</h2>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
              {errorMsg || 'Could not verify or process this QR code.'}
            </p>

            <Button block variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default QRScanner;
