import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, QrCode, ArrowDownLeft,
  ArrowUpRight, ArrowLeft, Camera, Edit3, ShieldCheck, Image as ImageIcon,
  UploadCloud
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
import { decodeQRFromImage } from '../utils/qrImageDecoder';
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
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle QR decode from uploaded screenshot or image file
  const handleImageFileChange = async (fileOrEvent) => {
    const file = fileOrEvent?.target?.files ? fileOrEvent.target.files[0] : fileOrEvent;
    if (!file) return;
    if (fileOrEvent?.target) fileOrEvent.target.value = '';

    stopScanner();
    setScanState(SCAN_STATES.VERIFYING);
    setIsDecodingImage(true);
    setErrorMsg('');

    try {
      const decodedText = await decodeQRFromImage(file);
      await handleScannedData(decodedText);
    } catch (err) {
      console.warn('[image decode error]', err);
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg(err.message || 'Could not detect a valid QR code in this image. Ensure the code is clear and not blurry.');
    } finally {
      setIsDecodingImage(false);
    }
  };

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanState(SCAN_STATES.IDLE);
  }, []);

  // Start HTML5 camera scanner
  const startScanner = useCallback(() => {
    setScanState(SCAN_STATES.SCANNING);
    setScannedTx(null);
    setPaymentRequest(null);
    setVerifyResult(null);
    setErrorMsg('');

    setTimeout(async () => {
      const qrReaderEl = document.getElementById('qr-reader');
      if (!qrReaderEl) return;

      try {
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch (_) {}
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          {
            fps: 25,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const boxSize = Math.floor(minEdge * 0.85);
              return { width: Math.max(220, boxSize), height: Math.max(220, boxSize) };
            },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          async (decodedText) => {
            try {
              if (html5QrCode.isScanning) await html5QrCode.stop();
              html5QrCode.clear();
            } catch (_) {}
            await handleScannedData(decodedText);
          },
          () => {} // frame scan errors expected while scanning
        );
      } catch (err) {
        console.warn('[camera scanner init error]', err);
        setErrorMsg('Camera access unavailable. Please click "Upload Image" below to select your QR code photo or screenshot.');
      }
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) {}
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

        {/* Hidden File Input for Image & Screenshot Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Manual Payload Fallback (Convenient for quick testing or camera restriction) */}
        {showManual && (
          <Card padding className="bg-white border border-[#DCE3F2] space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B75]">
              Manual QR Code Payload
            </h2>
            <textarea
              rows={3}
              placeholder='Paste JSON payload or QR string here...'
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-[#F5F7FF] text-[#172033] border border-[#DCE3F2] focus:border-[#3155B8] rounded-lg outline-none"
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

        {/* ─── STATE 1: IDLE / ENTRY ─── */}
        {scanState === SCAN_STATES.IDLE && (
          <Card padding className="text-center py-8 space-y-4 bg-white border border-[#DCE3F2] shadow-xs">
            <div className="w-20 h-20 rounded-2xl bg-[#EAF0FF] border border-[#DCE3F2] text-[#3155B8] flex items-center justify-center mx-auto shadow-xs">
              <Camera size={40} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033]">Ready to Scan</h2>
              <p className="text-xs text-[#5F6B85] max-w-xs mx-auto mt-1">
                Scan using camera or upload a payment screenshot/photo directly from your gallery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                size="lg"
                variant="accent"
                className="flex-1 font-bold"
                onClick={startScanner}
                leftIcon={<QrCode size={18} />}
                id="btn-open-camera-scanner"
              >
                Camera Scanner
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 font-semibold border-[#DCE3F2] text-[#172033] hover:bg-[#F5F7FF]"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<ImageIcon size={18} />}
                id="btn-upload-qr-image"
              >
                Upload Image
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 2: SCANNING (Camera Active) ─── */}
        {scanState === SCAN_STATES.SCANNING && (
          <Card padding className="space-y-4 bg-white border border-[#DCE3F2] shadow-xs">
            <CardHeader
              title="Camera Viewfinder"
              subtitle="Hold steady over the QR code or select an image"
            />
            <div
              id="qr-reader"
              className="w-full rounded-2xl overflow-hidden border-2 border-[#3155B8]/40 shadow-inner bg-black"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-xs border-[#DCE3F2] text-[#172033]"
                leftIcon={<ImageIcon size={14} />}
              >
                Upload Image
              </Button>
              <Button size="sm" variant="outline" onClick={stopScanner} className="flex-1 text-xs">
                Cancel Scanner
              </Button>
            </div>
          </Card>
        )}

        {/* ─── STATE 3: VERIFYING ─── */}
        {scanState === SCAN_STATES.VERIFYING && (
          <Card padding className="text-center py-10 space-y-3 bg-white border border-[#DCE3F2] shadow-xs">
            <div className="w-12 h-12 rounded-full border-4 border-[#DCE3F2] border-t-[#3155B8] animate-spin mx-auto" />
            <p className="font-bold text-sm text-[#172033]">
              {isDecodingImage ? 'Decoding QR from Image...' : 'Verifying QR Data...'}
            </p>
            <p className="text-xs text-[#5F6B85]">
              {isDecodingImage
                ? 'Applying multi-engine analysis (BarcodeDetector & jsQR)'
                : 'Checking cryptographic signature & payload structure'}
            </p>
          </Card>
        )}

        {/* ─── STATE 4: PAYMENT REQUEST DETECTED ─── */}
        {scanState === SCAN_STATES.REQUEST_DETECTED && paymentRequest && (
          <Card padding className="space-y-5 bg-white border border-[#DCE3F2] shadow-xs">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2]">
              <div className="w-10 h-10 rounded-xl bg-[#172B75] text-white flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3155B8]">
                  Payment Request
                </span>
                <p className="text-sm font-bold text-[#172033] truncate">
                  Pay {paymentRequest.receiverName || 'Recipient'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FF]">
                <span className="text-[#5F6B85]">Recipient:</span>
                <span className="font-bold text-[#172033]">{paymentRequest.receiverName}</span>
              </div>
              {paymentRequest.amount ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FF]">
                  <span className="text-[#5F6B85]">Requested Amount:</span>
                  <span className="font-black text-[#172B75] text-sm">
                    {formatCurrency(paymentRequest.amount)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FF]">
                  <span className="text-[#5F6B85]">Amount:</span>
                  <span className="font-medium text-[#172033]">Enter upon payment</span>
                </div>
              )}
              {paymentRequest.note && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FF]">
                  <span className="text-[#5F6B85]">Note:</span>
                  <span className="text-[#172033] italic">{paymentRequest.note}</span>
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
          <Card padding className="space-y-5 bg-white border border-[#DCE3F2] shadow-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E8F8F1] border border-[#16A66A]/30">
              <ShieldCheck size={26} className="text-[#16A66A] flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#172033]">Payment Validated Offline</p>
                <p className="text-[11px] text-[#16A66A] font-semibold">{verifyResult?.sigNote || 'ECDSA P-256 Signature Verified ✓'}</p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8993A8]">
                Incoming Amount To Claim
              </span>
              <p className="text-3xl font-black text-[#16A66A] mt-0.5">
                +{formatCurrency(scannedTx.amount)}
              </p>
              <p className="text-xs text-[#5F6B85]">Sender: <strong className="text-[#172033]">{scannedTx.senderName || 'Sender'}</strong></p>
            </div>

            <div className="divide-y divide-[#DCE3F2] border border-[#DCE3F2] rounded-xl overflow-hidden bg-[#F5F7FF] text-xs">
              <div className="flex items-center justify-between p-3 bg-white">
                <span className="text-[#5F6B85]">Sender:</span>
                <span className="font-bold text-[#172033]">{scannedTx.senderName || 'Sender'}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-[#5F6B85]">Transaction Ref:</span>
                <span className="font-mono text-[11px] text-[#3155B8] font-bold">{scannedTx.id}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white">
                <span className="text-[#5F6B85]">Validation Status:</span>
                <span className="font-bold text-[#16A66A] text-[11px]">Valid Offline Payment</span>
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
          <Card padding className="space-y-5 text-center bg-white border border-[#DCE3F2] shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF0FF] border border-[#3155B8]/30 text-[#3155B8] mb-2">
                <CheckCircle2 size={13} className="text-[#3155B8]" />
                <span>Locally Acknowledged — Awaiting Settlement</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
                Receiver Acknowledgment QR
              </h2>
              <p className="text-xs text-[#5F6B85] max-w-sm mx-auto mt-1">
                Show this QR to the sender so their device records that you have validated and claimed the payment offline.
              </p>
            </div>

            {/* Acknowledgment QR Display */}
            {ackQrDataUrl && (
              <div className="p-4 rounded-2xl border border-[#DCE3F2] bg-[#F5F7FF] max-w-xs mx-auto space-y-2.5">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-xs border border-[#DCE3F2]">
                  <img src={ackQrDataUrl} alt="Receiver Acknowledgment QR" className="w-56 h-56 mx-auto" />
                </div>
                <div className="text-[11px] text-[#5F6B85] space-y-0.5">
                  <p className="font-semibold text-[#172033]">Ref: {scannedTx?.id}</p>
                  <p>Amount: <strong className="text-[#16A66A]">+{formatCurrency(scannedTx?.amount)}</strong></p>
                  <p className="text-[10px] text-[#3155B8]">Signed with your ECDSA P-256 receiver key</p>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2] text-xs text-left max-w-xs mx-auto space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#172B75]">
                <ShieldCheck size={14} className="text-[#3155B8]" />
                <span>Notice: Not Authoritatively Settled Yet</span>
              </div>
              <p className="text-[11px] text-[#5F6B85] leading-relaxed">
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
          <Card padding className="space-y-5 text-center bg-white border border-[#DCE3F2] shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8F1] border border-[#16A66A]/30 text-[#16A66A] mb-2">
                <CheckCircle2 size={13} className="text-[#16A66A]" />
                <span>Receiver Acknowledged Offline</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
                Payment Acknowledged Offline
              </h2>
              <p className="text-xs text-[#5F6B85] max-w-sm mx-auto mt-1">
                Awaiting Synchronization — The receiver has cryptographically verified and acknowledged this offline transaction.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#DCE3F2] max-w-sm mx-auto space-y-3 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5F6B85]">Payment Ref:</span>
                <span className="font-mono text-[#172033] font-bold">{ackPayload?.transactionRef || scannedTx?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6B85]">Receiver:</span>
                <span className="font-bold text-[#172033]">{ackPayload?.receiverName || scannedTx?.receiverName || 'Receiver'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6B85]">Amount:</span>
                <span className="font-black text-[#172B75] text-sm">{formatCurrency(ackPayload?.amount || scannedTx?.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6B85]">Ack Status:</span>
                <span className="text-[#3155B8] font-bold">RECEIVER_ACKNOWLEDGED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6B85]">Timer Protection:</span>
                <span className="text-[#16A66A] font-semibold">Exempt from 5m unclaimed timeout</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2] text-xs text-left max-w-sm mx-auto space-y-1">
              <p className="text-[11px] text-[#5F6B85] leading-relaxed">
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
          <Card padding className="text-center py-8 space-y-4 bg-white border border-[#D64545]/40 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FDECEC] text-[#D64545] flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>

            <h2 className="text-base font-bold text-[#D64545]">Invalid Payment QR</h2>
            <p className="text-xs text-[#5F6B85] max-w-xs mx-auto leading-relaxed">
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
