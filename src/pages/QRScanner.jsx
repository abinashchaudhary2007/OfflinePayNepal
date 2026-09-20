/**
 * QRScanner.jsx — Phase 7 (QR Scanning + Verification)
 * Receiver scans the sender's QR, verifies signature locally, and accepts payment.
 * Uses html5-qrcode for camera scanning.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, QrCode, ArrowDownLeft } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime } from '../utils/formatting';
import { verifyTransactionSignature } from '../services/crypto';
import { buildSignablePayload } from '../services/ledger';
import { loadDeviceKeys } from '../services/crypto';
import { getDevice } from '../services/db';

const SCAN_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  INVALID: 'invalid',
  ACCEPTED: 'accepted',
  ERROR: 'error',
};

function QRScanner() {
  const { currentUser } = useAuth();
  const { acceptIncomingPayment } = useWallet();

  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [scannedTx, setScannedTx] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  // Start scanner
  const startScanner = useCallback(() => {
    setScanState(SCAN_STATES.SCANNING);
    setScannedTx(null);
    setVerifyResult(null);

    setTimeout(() => {
      if (!document.getElementById('qr-reader')) return;

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
        (error) => {
          // scan errors are expected while scanning — ignore
        }
      );

      scannerRef.current = scanner;
    }, 200);
  }, []);

  // Stop scanner
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

  // Process scanned QR data
  async function handleScannedData(rawData) {
    setScanState(SCAN_STATES.VERIFYING);
    try {
      const parsed = JSON.parse(rawData);

      if (parsed.type !== 'OFFLINE_PAYMENT') {
        setScanState(SCAN_STATES.INVALID);
        setErrorMsg('This QR code is not an OfflinePay payment.');
        return;
      }

      // Validate that this payment is for the current user
      if (parsed.receiverId && parsed.receiverId !== currentUser?.id) {
        setScanState(SCAN_STATES.INVALID);
        setErrorMsg(`This payment is for ${parsed.receiverName || 'another user'}, not you.`);
        return;
      }

      // Check amount
      if (!parsed.amount || parsed.amount <= 0) {
        setScanState(SCAN_STATES.INVALID);
        setErrorMsg('Invalid payment amount.');
        return;
      }

      // Verify signature
      let sigValid = false;
      let sigNote = 'Signature verification skipped (no public key available)';

      // Try to get sender's public key from QR payload or registered device in local DB
      try {
        const senderDevice = await getDevice(parsed.deviceId);
        const publicKeyJwk = parsed.senderPublicKeyJwk || senderDevice?.publicKeyJwk;

        if (publicKeyJwk && parsed.signature && parsed.signature !== 'DEMO_SIG') {
          const signablePayload = buildSignablePayload(parsed);
          sigValid = await verifyTransactionSignature(
            publicKeyJwk,
            signablePayload,
            parsed.signature
          );
          sigNote = sigValid ? 'ECDSA P-256 Signature Verified ✓' : 'Signature INVALID — Payload was tampered with ✗';
        } else if (parsed.signature === 'DEMO_SIG') {
          sigValid = true; // demo mode
          sigNote = 'Demo signature (accepted for simulated demo)';
        } else {
          sigValid = false;
          sigNote = 'Sender public key not available — cannot verify signature';
        }
      } catch (e) {
        sigValid = false;
        sigNote = 'Verification error: ' + e.message;
      }

      setScannedTx(parsed);
      setVerifyResult({ sigValid, sigNote });
      setScanState(sigValid ? SCAN_STATES.VERIFIED : SCAN_STATES.INVALID);

      if (!sigValid) {
        setErrorMsg('Transaction signature is invalid. This payment may have been tampered with.');
      }
    } catch (err) {
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('Invalid QR code format: ' + err.message);
    }
  }

  // Accept payment
  const handleAccept = async () => {
    if (!scannedTx) return;
    setIsAccepting(true);
    try {
      await acceptIncomingPayment({
        ...scannedTx,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
      });
      setScanState(SCAN_STATES.ACCEPTED);
    } catch (e) {
      setErrorMsg(e.message);
      setScanState(SCAN_STATES.ERROR);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReset = () => {
    setScanState(SCAN_STATES.IDLE);
    setScannedTx(null);
    setVerifyResult(null);
    setErrorMsg('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Scan QR</h1>
        </div>

        {/* IDLE: Start scanning */}
        {scanState === SCAN_STATES.IDLE && (
          <Card>
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-indigo-100)' }}>
                <QrCode size={40} color="var(--color-indigo-600)" />
              </div>
              <h2 className="font-bold text-[var(--color-gray-900)] mb-1">Ready to Scan</h2>
              <p className="text-xs text-[var(--color-gray-500)] mb-4">
                Point your camera at the sender's payment QR code
              </p>
              <Button block size="lg" variant="primary" onClick={startScanner} leftIcon={<QrCode size={18} />}>
                Open Camera Scanner
              </Button>
            </div>
          </Card>
        )}

        {/* SCANNING: Camera active */}
        {scanState === SCAN_STATES.SCANNING && (
          <Card>
            <CardHeader title="Point Camera at QR Code" />
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
            <Button block variant="outline" className="mt-3" onClick={stopScanner}>
              Cancel
            </Button>
          </Card>
        )}

        {/* VERIFYING */}
        {scanState === SCAN_STATES.VERIFYING && (
          <Card>
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4" />
              <p className="font-semibold text-[var(--color-gray-700)]">Verifying signature...</p>
              <p className="text-xs text-[var(--color-gray-400)] mt-1">Checking cryptographic proof</p>
            </div>
          </Card>
        )}

        {/* VERIFIED: Show details, let receiver accept */}
        {scanState === SCAN_STATES.VERIFIED && scannedTx && (
          <Card>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--color-emerald-50)' }}>
              <CheckCircle2 size={24} color="var(--color-emerald-600)" />
              <div>
                <p className="font-bold text-[var(--color-emerald-700)]">Payment Verified</p>
                <p className="text-xs text-[var(--color-emerald-600)]">{verifyResult?.sigNote}</p>
              </div>
            </div>

            {/* Payment details */}
            <div className="space-y-2 mb-4">
              <DetailRow label="From"        value={scannedTx.senderName} />
              <DetailRow label="Amount"      value={formatCurrency(scannedTx.amount)} highlight />
              <DetailRow label="Method"      value={<Badge status="OFFLINE_PENDING">Offline QR</Badge>} />
              <DetailRow label="TX ID"       value={scannedTx.id} mono />
              <DetailRow label="Timestamp"   value={formatDateTime(scannedTx.timestamp)} />
              {scannedTx.note && <DetailRow label="Note" value={scannedTx.note} />}
            </div>

            {/* Signature indicator */}
            <div className="p-3 rounded-xl mb-4 flex items-center gap-2"
              style={{ background: verifyResult?.sigValid ? 'var(--color-emerald-50)' : 'var(--color-amber-50)' }}>
              {verifyResult?.sigValid
                ? <CheckCircle2 size={16} color="var(--color-emerald-600)" />
                : <AlertTriangle size={16} color="var(--color-amber-600)" />
              }
              <div>
                <p className="text-xs font-bold" style={{ color: verifyResult?.sigValid ? 'var(--color-emerald-700)' : 'var(--color-amber-700)' }}>
                  Signature: {verifyResult?.sigValid ? 'VALID' : 'UNVERIFIED (Demo)'}
                </p>
                <p className="text-[10px] text-[var(--color-gray-400)]">{verifyResult?.sigNote}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>Reject</Button>
              <Button
                block variant="primary"
                loading={isAccepting}
                onClick={handleAccept}
                leftIcon={<ArrowDownLeft size={16} />}
              >
                Accept Payment
              </Button>
            </div>
          </Card>
        )}

        {/* INVALID */}
        {scanState === SCAN_STATES.INVALID && (
          <Card>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-red-100)' }}>
                <XCircle size={32} color="var(--color-red-500)" />
              </div>
              <h2 className="font-bold text-[var(--color-red-600)] mb-2">Invalid Payment</h2>
              <p className="text-sm text-[var(--color-gray-500)] mb-5">{errorMsg}</p>
              <Button block variant="outline" onClick={handleReset}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* ACCEPTED */}
        {scanState === SCAN_STATES.ACCEPTED && scannedTx && (
          <Card>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-emerald-100)' }}>
                <ArrowDownLeft size={32} color="var(--color-emerald-600)" />
              </div>
              <h2 className="font-bold text-[var(--color-emerald-700)] text-xl mb-1">Payment Accepted!</h2>
              <p className="text-2xl font-black text-[var(--color-emerald-600)] my-3">
                +{formatCurrency(scannedTx.amount)}
              </p>
              <p className="text-sm text-[var(--color-gray-500)] mb-2">From {scannedTx.senderName}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}>
                <AlertTriangle size={11} />
                Stored offline — will sync when internet is available
              </div>
              <div className="flex gap-2">
                <Button block variant="outline" onClick={handleReset}>Scan Another</Button>
                <Button block variant="primary" onClick={() => window.location.href = '/transactions'}>
                  View Transactions
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ERROR */}
        {scanState === SCAN_STATES.ERROR && (
          <Card>
            <div className="text-center py-6">
              <XCircle size={40} color="var(--color-red-500)" className="mx-auto mb-3" />
              <p className="font-bold text-[var(--color-red-600)] mb-2">Error</p>
              <p className="text-sm text-[var(--color-gray-500)] mb-4">{errorMsg}</p>
              <Button block variant="outline" onClick={handleReset}>Try Again</Button>
            </div>
          </Card>
        )}

        {/* Info card */}
        {(scanState === SCAN_STATES.IDLE || scanState === SCAN_STATES.SCANNING) && (
          <Card>
            <CardHeader title="Offline Payment Verification" />
            <ul className="space-y-2">
              {[
                'The QR code contains a cryptographically signed transaction.',
                'Signature is verified locally without internet.',
                'Accepted payments are stored securely on your device.',
                'Balances update automatically when you sync.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-gray-600)]">
                  <CheckCircle2 size={12} color="var(--color-emerald-500)" className="mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function DetailRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-gray-50)] last:border-0">
      <span className="text-xs text-[var(--color-gray-500)]">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[var(--color-emerald-600)]' : 'text-[var(--color-gray-700)]'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default QRScanner;
