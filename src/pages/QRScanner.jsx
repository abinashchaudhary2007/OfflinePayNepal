import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, QrCode, ArrowDownLeft,
  ArrowUpRight, ArrowLeft, Camera, Edit3, ShieldCheck, Image as ImageIcon,
  UploadCloud, Sparkles, RefreshCw, X, ChevronRight, FileText
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
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
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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

    requestAnimationFrame(() => {
      setTimeout(async () => {
        const qrReaderEl = document.getElementById('qr-reader');
        if (!qrReaderEl) {
          setErrorMsg('Camera viewfinder element not found. Please try again.');
          setScanState(SCAN_STATES.ERROR);
          return;
        }

        try {
          if (scannerRef.current) {
            try {
              if (scannerRef.current.isScanning) await scannerRef.current.stop();
              await scannerRef.current.clear();
            } catch (_) {}
            scannerRef.current = null;
          }

          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 20,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const boxSize = Math.floor(minEdge * 0.8);
                return { width: Math.max(220, boxSize), height: Math.max(220, boxSize) };
              },
              aspectRatio: 1.0,
              experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            },
            async (decodedText) => {
              try {
                if (html5QrCode.isScanning) await html5QrCode.stop();
                html5QrCode.clear();
              } catch (_) {}
              scannerRef.current = null;
              await handleScannedData(decodedText);
            },
            () => {}
          );
        } catch (err) {
          console.warn('[camera scanner init error]', err);
          scannerRef.current = null;
          setErrorMsg(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access or use "Upload Image" instead.'
              : 'Could not access camera. Please use "Upload Image" to scan a QR code screenshot.'
          );
          setScanState(SCAN_STATES.ERROR);
        }
      }, 150);
    });
  }, []);

  // Auto-start camera if navigated with autoStart: true
  useEffect(() => {
    if (location.state?.autoStart) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [location.state?.autoStart, startScanner, stopScanner]);

  // Main QR Data Parser and Router
  async function handleScannedData(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('Scanned QR code contains no readable data.');
      return;
    }

    setScanState(SCAN_STATES.VERIFYING);
    setErrorMsg('');

    try {
      let parsed;
      try {
        parsed = JSON.parse(rawText.trim());
      } catch {
        setScanState(SCAN_STATES.INVALID);
        setErrorMsg('Scanned QR does not contain valid OfflinePay JSON payload.');
        return;
      }

      // CASE 1: PAYMENT REQUEST (Scan to Send)
      if (parsed.type === 'PAYMENT_REQUEST') {
        if (!parsed.receiverId) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Invalid payment request: Missing recipient ID.');
          return;
        }

        if (parsed.receiverId === currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('You cannot pay your own wallet address.');
          return;
        }

        setPaymentRequest(parsed);
        setScanState(SCAN_STATES.REQUEST_DETECTED);
        return;
      }

      // CASE 2: OFFLINE PAYMENT (Receiver claims sender's voucher)
      if (parsed.type === 'OFFLINE_PAYMENT') {
        if (!parsed.id || !parsed.amount || !parsed.senderId || !parsed.signature) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Invalid offline payment: Missing essential transaction fields.');
          return;
        }

        if (parsed.receiverId && parsed.receiverId !== currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg(`Payment is addressed to "${parsed.receiverName || parsed.receiverId}", not your account.`);
          return;
        }

        if (parsed.senderId === currentUser?.id) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('You cannot accept a payment that you sent yourself.');
          return;
        }

        // Check 5-minute offline expiration
        const txTime = new Date(parsed.timestamp).getTime();
        if (!isNaN(txTime)) {
          const elapsedMs = Date.now() - txTime;
          if (elapsedMs > 5 * 60 * 1000) {
            setScanState(SCAN_STATES.INVALID);
            setErrorMsg('Offline payment QR expired: Created more than 5 minutes ago.');
            return;
          }
        }

        // Verify cryptographic signature
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

      // CASE 3: RECEIVER ACKNOWLEDGMENT
      if (parsed.type === 'OFFLINE_PAYMENT_ACK') {
        if (!parsed.transactionRef || !parsed.signature || !parsed.ackNonce) {
          setScanState(SCAN_STATES.INVALID);
          setErrorMsg('Malformed acknowledgment token: Required cryptographic fields are missing.');
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

      // Unknown payload
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('This QR code is not a valid OfflinePay payment or request.');
    } catch (err) {
      setScanState(SCAN_STATES.INVALID);
      setErrorMsg('Could not parse QR data format: ' + err.message);
    }
  }

  // Receiver generates signed acknowledgment QR
  const handleGenerateAcknowledgment = async () => {
    if (!scannedTx) return;
    setIsGeneratingAck(true);
    setErrorMsg('');
    try {
      const acceptedResult = await acceptIncomingPayment({
        ...scannedTx,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
      });

      if (acceptedResult) {
        setScannedTx(acceptedResult);
      }

      const ack = await createReceiverAcknowledgment(scannedTx);
      setAckPayload(ack);

      const dataUrl = await QRCode.toDataURL(JSON.stringify(ack), {
        width: 440,
        margin: 3,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
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
      <div
        className="max-w-2xl mx-auto animate-fade-in pb-16"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* ─── Page Header with High-Contrast Typography ─── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                color: isDark ? '#738EE4' : '#172B75',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                transition: 'all 0.15s ease',
              }}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Scan QR Code
              </h1>
              <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Scan to transfer funds or claim offline payment vouchers
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowManual(p => !p)}
            style={{
              padding: '6px 14px',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
              color: isDark ? '#738EE4' : '#3155B8',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Edit3 size={14} />
            <span>{showManual ? 'Hide Manual' : 'Paste Code'}</span>
          </button>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Manual Payload Fallback Drawer */}
        {showManual && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.25rem',
              padding: '20px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Paste Raw QR JSON Payload
              </span>
              <button
                onClick={() => setShowManual(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              rows={3}
              placeholder='{"type":"PAYMENT_REQUEST", "receiverId":"...", ...}'
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '0.75rem',
                padding: '10px 12px',
                width: '100%',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <Button
              size="sm"
              variant="primary"
              block
              disabled={!manualInput.trim()}
              onClick={() => handleScannedData(manualInput.trim())}
              className="font-bold"
            >
              Process Payload
            </Button>
          </div>
        )}

        {/* ─── STATE 1: IDLE / READY TO SCAN ─── */}
        {scanState === SCAN_STATES.IDLE && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 4px 14px rgba(23,43,117,0.06)',
            }}
            className="space-y-6"
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '1.25rem',
                background: isDark ? 'rgba(79,111,216,0.18)' : '#EAF0FF',
                color: isDark ? '#738EE4' : '#172B75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <Camera size={36} strokeWidth={2.2} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Ready to Scan
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '340px', margin: '6px auto 0', lineHeight: 1.45 }}>
                Scan using your device camera or upload a QR screenshot directly from your photos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
              <button
                type="button"
                id="btn-open-camera-scanner"
                onClick={startScanner}
                style={{
                  padding: '14px 20px',
                  borderRadius: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(23,43,117,0.25)',
                  transition: 'all 0.15s ease',
                }}
                className="hover:opacity-95 active:scale-95"
              >
                <QrCode size={18} />
                <span>Open Camera</span>
              </button>

              <button
                type="button"
                id="btn-upload-qr-image"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '14px 20px',
                  borderRadius: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  color: 'var(--text-primary)',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
                className="hover:border-[#3155B8] active:scale-95"
              >
                <ImageIcon size={18} />
                <span>Upload Photo</span>
              </button>
            </div>

            {/* Supported formats indicator */}
            <div
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#EAF0FF'}`,
                borderRadius: '0.875rem',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck size={14} className="text-[#16A66A]" />
                <span>Offline ECDSA Vouchers</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <Sparkles size={14} className="text-[#4F6FD8]" />
                <span>Digital Payment Requests</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── STATE 2: SCANNING (Active Camera Viewfinder) ─── */}
        {scanState === SCAN_STATES.SCANNING && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '24px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 4px 14px rgba(23,43,117,0.06)',
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Camera Viewfinder
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Position the QR code within the frame
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={stopScanner}>
                Cancel
              </Button>
            </div>

            <div
              id="qr-reader"
              style={{
                width: '100%',
                borderRadius: '1.25rem',
                overflow: 'hidden',
                background: '#0F172A',
                minHeight: '260px',
                border: '2px solid rgba(49,85,184,0.4)',
              }}
            />

            <div className="flex gap-2.5 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-xs"
                leftIcon={<ImageIcon size={14} />}
              >
                Upload Photo Instead
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stopScanner}
                className="flex-1 text-xs"
              >
                Close Viewfinder
              </Button>
            </div>
          </div>
        )}

        {/* ─── STATE 3: VERIFYING ─── */}
        {scanState === SCAN_STATES.VERIFYING && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '44px 28px',
              textAlign: 'center',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-4"
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                border: '4px solid #DCE3F2',
                borderTopColor: '#3155B8',
              }}
              className="animate-spin mx-auto"
            />
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isDecodingImage ? 'Decoding QR Photo...' : 'Verifying Cryptographic Voucher...'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isDecodingImage
                ? 'Applying multi-engine analysis'
                : 'Verifying ECDSA P-256 signature and device nonce'}
            </p>
          </div>
        )}

        {/* ─── STATE 4: PAYMENT REQUEST DETECTED ─── */}
        {scanState === SCAN_STATES.REQUEST_DETECTED && paymentRequest && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-5 animate-fade-in"
          >
            <div
              style={{
                background: isDark ? 'rgba(79,111,216,0.15)' : '#EAF0FF',
                border: `1px solid ${isDark ? 'rgba(79,111,216,0.25)' : '#DCE3F2'}`,
                borderRadius: '1rem',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowUpRight size={22} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: isDark ? '#738EE4' : '#3155B8' }}>
                  Payment Request Found
                </span>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                  Pay {paymentRequest.receiverName || 'Recipient'}
                </p>
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1rem',
                overflow: 'hidden',
                fontSize: '0.8125rem',
              }}
              className="divide-y"
            >
              <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recipient:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{paymentRequest.receiverName}</strong>
              </div>
              {paymentRequest.amount ? (
                <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Requested Amount:</span>
                  <strong style={{ color: '#16A66A', fontSize: '1.125rem' }}>
                    {formatCurrency(paymentRequest.amount)}
                  </strong>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                  <span style={{ color: 'var(--text-muted)' }}>Enter amount in next step</span>
                </div>
              )}
              {paymentRequest.note && (
                <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Note:</span>
                  <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{paymentRequest.note}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleReset} className="w-1/3">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProceedToPay}
                className="w-2/3 font-bold"
                leftIcon={<ArrowUpRight size={16} />}
                id="btn-proceed-to-pay"
              >
                Proceed to Pay
              </Button>
            </div>
          </div>
        )}

        {/* ─── STATE 5: OFFLINE PAYMENT VALIDATED ─── */}
        {scanState === SCAN_STATES.OFFLINE_VERIFIED && scannedTx && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-5 animate-fade-in"
          >
            <div
              style={{
                background: isDark ? 'rgba(22,166,106,0.12)' : '#E8F8F1',
                border: `1px solid ${isDark ? 'rgba(22,166,106,0.25)' : 'rgba(22,166,106,0.3)'}`,
                borderRadius: '1rem',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={26} className="text-[#16A66A] shrink-0" />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Offline Payment Verified
                </p>
                <p style={{ fontSize: '0.75rem', color: '#16A66A', fontWeight: 600, margin: '2px 0 0 0' }}>
                  {verifyResult?.sigNote || 'ECDSA P-256 Signature Verified ✓'}
                </p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Incoming Amount To Claim
              </span>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#16A66A', margin: '4px 0' }}>
                +{formatCurrency(scannedTx.amount)}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                From: <strong style={{ color: 'var(--text-primary)' }}>{scannedTx.senderName || 'Sender'}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
          </div>
        )}

        {/* ─── STATE 5B: RECEIVER ACKNOWLEDGMENT QR ─── */}
        {scanState === SCAN_STATES.SHOW_ACK_QR && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.5rem',
              padding: '30px',
              textAlign: 'center',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-5 animate-fade-in"
          >
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isDark ? 'rgba(79,111,216,0.18)' : '#EAF0FF',
                  color: isDark ? '#738EE4' : '#3155B8',
                  border: `1px solid ${isDark ? 'rgba(79,111,216,0.3)' : '#DCE3F2'}`,
                  marginBottom: '10px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Locally Claimed — Awaiting Sync</span>
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Receiver Acknowledgment QR
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '6px auto 0' }}>
                Show this QR to the sender so their device records your signed acknowledgment offline.
              </p>
            </div>

            {ackQrDataUrl && (
              <div
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '1.25rem',
                  padding: '20px',
                  maxWidth: '340px',
                  margin: '0 auto',
                }}
                className="space-y-3"
              >
                <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-[#DCE3F2]">
                  <img src={ackQrDataUrl} alt="Receiver Acknowledgment QR" className="w-56 h-56 mx-auto" />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Ref: {scannedTx?.id}</p>
                  <p style={{ margin: '2px 0 0 0' }}>Amount: <strong className="text-[#16A66A]">+{formatCurrency(scannedTx?.amount)}</strong></p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-xs mx-auto font-bold"
            >
              Done & Return to Dashboard
            </Button>
          </div>
        )}

        {/* ─── STATE 6: INVALID / ERROR ─── */}
        {(scanState === SCAN_STATES.INVALID || scanState === SCAN_STATES.ERROR) && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(214,69,69,0.3)' : 'rgba(214,69,69,0.3)'}`,
              borderRadius: '1.5rem',
              padding: '36px 24px',
              textAlign: 'center',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-4 animate-fade-in"
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '1rem',
                background: isDark ? 'rgba(214,69,69,0.18)' : '#FDECEC',
                color: '#D64545',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#F87171' : '#D64545', margin: 0 }}>
                Scan Failed
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '340px', margin: '6px auto 0', lineHeight: 1.45 }}>
                {errorMsg || 'Could not validate QR code. Please try again.'}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2 max-w-xs mx-auto">
              <Button
                variant="primary"
                onClick={startScanner}
                className="flex-1 font-bold"
                leftIcon={<RefreshCw size={14} />}
              >
                Retry Scanner
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default QRScanner;
