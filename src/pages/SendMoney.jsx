import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowUpRight, Wifi, WifiOff, ChevronRight, Search, QrCode,
  CheckCircle2, AlertTriangle, ShieldCheck, Copy, ArrowLeft, RefreshCw,
  Wallet, User, FileText, Store, Eye, ChevronDown, Clock, Camera, Image as ImageIcon,
  Sparkles, X
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PaymentReceipt from '../components/wallet/PaymentReceipt';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { useTheme } from '../context/ThemeContext';
import { getAllUsers } from '../services/db';
import { decodeQRFromImage } from '../utils/qrImageDecoder';
import { formatCurrency, formatTxIdShort, formatDateTime } from '../utils/formatting';

const STEPS = {
  RECIPIENT: 'recipient',
  AMOUNT: 'amount',
  METHOD: 'method',
  REVIEW: 'review',
  STATUS: 'status',
};

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

function SendMoney() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, transactions,
    createOfflineTransaction, createOnlineTransaction,
    recordSenderAcknowledgment,
    expirePendingTransactions,
    refreshTransactions,
    registerDevice, TX_STATUS
  } = useWallet();
  const { isOffline } = useOfflineSimulation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation / pre-fill state from QR scanner or recent contact
  const prefill = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const isShopMode = searchParams.get('mode') === 'shop' || prefill.mode === 'shop';

  const [step, setStep] = useState(prefill.receiver ? STEPS.AMOUNT : STEPS.RECIPIENT);
  const [receiver, setReceiver] = useState(prefill.receiver || null);
  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : '');
  const [note, setNote] = useState(prefill.note || '');
  const [paymentMethod, setPaymentMethod] = useState(isOffline ? 'offline' : 'online');
  const [search, setSearch] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [createdTx, setCreatedTx] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showTechnicalPayload, setShowTechnicalPayload] = useState(false);
  const [showReceiptView, setShowReceiptView] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(300);
  const [isTxExpired, setIsTxExpired] = useState(false);
  const [showAckScanner, setShowAckScanner] = useState(false);
  const [ackScanError, setAckScanError] = useState('');
  const [manualAckInput, setManualAckInput] = useState('');
  const [isVerifyingAck, setIsVerifyingAck] = useState(false);
  const [payOption, setPayOption] = useState(isShopMode ? 'merchant' : 'user');
  const ackScannerRef = useRef(null);
  const ackFileInputRef = useRef(null);

  const handleAckImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsVerifyingAck(true);
    setAckScanError('');
    try {
      const decodedText = await decodeQRFromImage(file);
      await handleProcessAckPayload(decodedText);
    } catch (err) {
      setAckScanError(err.message || 'Could not detect an acknowledgment QR in this image.');
    } finally {
      setIsVerifyingAck(false);
    }
  };

  // Load all registered users
  useEffect(() => {
    let active = true;
    async function fetchUsers() {
      try {
        const users = await getAllUsers();
        if (active) setDirectoryUsers(users);
      } catch (err) {
        console.warn('[send] Failed to fetch users:', err);
      }
    }
    fetchUsers();
    return () => { active = false; };
  }, []);

  // Update payment method when offline simulation toggles
  useEffect(() => {
    if (isOffline) {
      setPaymentMethod('offline');
    }
  }, [isOffline]);

  // Pre-fill receiver from location state if passed after mount
  useEffect(() => {
    if (prefill.receiver && !receiver) {
      setReceiver(prefill.receiver);
      if (prefill.amount) setAmount(String(prefill.amount));
      setStep(STEPS.AMOUNT);
    }
  }, [prefill]);

  // Generate QR for offline created transaction
  useEffect(() => {
    if (createdTx && createdTx.method === 'OFFLINE_QR') {
      const payload = JSON.stringify({
        type: 'OFFLINE_PAYMENT',
        version: '1.0',
        id: createdTx.id,
        senderId: createdTx.senderId,
        senderName: createdTx.senderName,
        receiverId: createdTx.receiverId,
        receiverName: createdTx.receiverName,
        amount: createdTx.amount,
        currency: createdTx.currency,
        timestamp: createdTx.timestamp,
        nonce: createdTx.nonce,
        counter: createdTx.counter,
        authorizationId: createdTx.authorizationId,
        deviceId: createdTx.deviceId,
        senderPublicKeyJwk: createdTx.senderPublicKeyJwk || null,
        signature: createdTx.signature,
        note: createdTx.note || '',
      });

      QRCode.toDataURL(payload, {
        width: 420,
        margin: 4,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [createdTx]);

  // 5-minute timeout countdown for offline QR payments
  useEffect(() => {
    if (!createdTx || createdTx.method !== 'OFFLINE_QR' || step !== STEPS.STATUS) return;

    const latestTx = (transactions || []).find(t => t.id === createdTx.id) || createdTx;
    if (latestTx.status === 'SETTLED' || latestTx.status === 'RECEIVER_ACKNOWLEDGED' || latestTx.receiverAcknowledged) {
      setIsTxExpired(false);
      return;
    }

    const txTime = new Date(createdTx.createdAt || createdTx.timestamp).getTime();
    let pollCount = 0;

    const checkExpiration = async () => {
      const currentTx = (transactions || []).find(t => t.id === createdTx.id) || createdTx;
      if (currentTx.status === 'SETTLED' || currentTx.status === 'RECEIVER_ACKNOWLEDGED' || currentTx.receiverAcknowledged) {
        setIsTxExpired(false);
        return;
      }

      pollCount++;
      if (pollCount % 3 === 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const { fetchRemoteTransactionById } = await import('../services/supabaseSync');
          const remoteTx = await fetchRemoteTransactionById(createdTx.id);
          if (remoteTx && (remoteTx.status === 'SETTLED' || remoteTx.status === 'RECEIVER_ACKNOWLEDGED')) {
            if (refreshTransactions) await refreshTransactions();
            return;
          }
        } catch (_) {}
      }

      const elapsedMs = Date.now() - txTime;
      const left = Math.max(0, 300 - Math.floor(elapsedMs / 1000));
      setRemainingSecs(left);

      if (left === 0) {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          try {
            const { fetchRemoteTransactionById } = await import('../services/supabaseSync');
            const remoteTx = await fetchRemoteTransactionById(createdTx.id);
            if (remoteTx && (remoteTx.status === 'SETTLED' || remoteTx.status === 'RECEIVER_ACKNOWLEDGED')) {
              if (refreshTransactions) await refreshTransactions();
              return;
            }
          } catch (_) {}
        }

        if (currentTx.status === 'OFFLINE_PENDING' && !currentTx.receiverAcknowledged) {
          setIsTxExpired(true);
          if (expirePendingTransactions) {
            await expirePendingTransactions();
          }
        }
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 1000);
    return () => clearInterval(timer);
  }, [createdTx, step, transactions, expirePendingTransactions, refreshTransactions]);

  // Available recipients
  const availableReceivers = directoryUsers.filter(
    u => u.id !== currentUser?.id && u.role !== 'admin'
  );

  const transactedUserIds = new Set(
    (transactions || []).map(tx =>
      tx.senderId === currentUser?.id ? tx.receiverId : tx.senderId
    ).filter(Boolean)
  );

  const query = search.trim().toLowerCase();
  const searchResults = query ? availableReceivers.filter(u => {
    const hasTransacted = transactedUserIds.has(u.id);
    if (hasTransacted) {
      return (
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query)) ||
        (u.id && u.id.toLowerCase().includes(query))
      );
    }
    return (
      (u.email && u.email.toLowerCase() === query) ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query))
    );
  }) : [];

  // Recent recipients from transaction history
  const recentRecipients = [];
  const seenIds = new Set();
  (transactions || []).forEach(tx => {
    const isOut = tx.senderId === currentUser?.id;
    const otherId = isOut ? tx.receiverId : tx.senderId;
    if (otherId && otherId !== currentUser?.id && !seenIds.has(otherId)) {
      seenIds.add(otherId);
      const matched = directoryUsers.find(u => u.id === otherId);
      recentRecipients.push({
        id: otherId,
        name: (isOut ? tx.receiverName : tx.senderName) || matched?.name || 'Contact',
        email: matched?.email || otherId,
        phone: matched?.phone || '',
        avatarColor: matched?.avatarColor || '#4F6FD8',
      });
    }
  });

  const isAuthActive = !!authorization && authorization.status === 'ACTIVE' && new Date(authorization.expiresAt) > new Date();
  const remainingOfflineLimit = authorization?.remainingAmount || 0;
  const parsedAmount = parseFloat(amount) || 0;
  const currentAvailableBalance = wallet?.availableBalance || 0;

  // ─── Step Transitions & Validations ───
  const handleSelectReceiver = (user) => {
    setReceiver(user);
    setError('');
    setStep(STEPS.AMOUNT);
  };

  const handleAmountContinue = () => {
    if (parsedAmount <= 0) {
      setError('Please enter a payment amount greater than Rs. 0.');
      return;
    }
    if (parsedAmount > currentAvailableBalance) {
      setError(`Insufficient wallet balance. You have ${formatCurrency(currentAvailableBalance)} available.`);
      return;
    }
    setError('');
    setStep(STEPS.METHOD);
  };

  const handleMethodContinue = () => {
    if (paymentMethod === 'offline') {
      if (!device) {
        setError('Device registration is required before making offline payments.');
        return;
      }
      if (!isAuthActive) {
        setError('No active offline authorization found. Please authorize offline funds before paying without internet.');
        return;
      }
      if (parsedAmount > remainingOfflineLimit) {
        setError(`Your remaining offline limit allows you to pay up to ${formatCurrency(remainingOfflineLimit)} offline right now.`);
        return;
      }
      if (authorization?.maxSingleTransaction && parsedAmount > authorization.maxSingleTransaction) {
        setError(`Your offline limit allows you to pay up to ${formatCurrency(authorization.maxSingleTransaction)} per transaction.`);
        return;
      }
    }
    setError('');
    setStep(STEPS.REVIEW);
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      if (paymentMethod === 'offline' || isOffline) {
        const newCounter = (device?.transactionCounter || 0) + 1;
        const tx = await createOfflineTransaction({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          amount: parsedAmount,
          note,
          deviceId: device?.id || 'DEVICE-OFFLINE',
          authorizationId: authorization?.id,
          counter: newCounter,
        });
        setCreatedTx(tx);
        setStep(STEPS.STATUS);
      } else {
        const tx = await createOnlineTransaction({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          amount: parsedAmount,
          note,
          deviceId: device?.id || null,
        });
        setCreatedTx(tx);
        setStep(STEPS.STATUS);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAckPayload = async (payloadStr) => {
    setIsVerifyingAck(true);
    setAckScanError('');
    try {
      let parsed;
      try {
        parsed = JSON.parse(payloadStr);
      } catch {
        throw new Error('Invalid QR payload format.');
      }

      if (parsed.type !== 'OFFLINE_ACKNOWLEDGMENT') {
        throw new Error('This QR is not a valid receiver acknowledgment.');
      }

      if (parsed.transactionId !== createdTx?.id) {
        throw new Error(`Acknowledgment is for transaction ${parsed.transactionId}, but expected ${createdTx?.id}`);
      }

      await recordSenderAcknowledgment(parsed);
      setIsVerifyingAck(false);
      setShowAckScanner(false);
      if (refreshTransactions) await refreshTransactions();
    } catch (err) {
      setIsVerifyingAck(false);
      setAckScanError(err.message || 'Failed to verify acknowledgment payload.');
    }
  };

  const handleStartAckScanner = () => {
    setShowAckScanner(true);
    setAckScanError('');
    setManualAckInput('');
    setTimeout(async () => {
      if (!document.getElementById('ack-qr-reader')) return;
      try {
        if (ackScannerRef.current) {
          try {
            if (ackScannerRef.current.isScanning) await ackScannerRef.current.stop();
            await ackScannerRef.current.clear();
          } catch (_) {}
        }
        const html5QrCode = new Html5Qrcode('ack-qr-reader');
        ackScannerRef.current = html5QrCode;

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
              return { width: Math.max(200, boxSize), height: Math.max(200, boxSize) };
            },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            try {
              if (html5QrCode.isScanning) await html5QrCode.stop();
              html5QrCode.clear();
            } catch (_) {}
            await handleProcessAckPayload(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.warn('[ack-scanner camera error]', err);
        setAckScanError('Camera access unavailable. Use "Upload Image" below to select an acknowledgment QR photo.');
      }
    }, 200);
  };

  const handleStopAckScanner = async () => {
    if (ackScannerRef.current) {
      try {
        if (ackScannerRef.current.isScanning) await ackScannerRef.current.stop();
        await ackScannerRef.current.clear();
      } catch (_) {}
    }
    setShowAckScanner(false);
  };

  return (
    <DashboardLayout>
      <div
        className="max-w-3xl mx-auto animate-fade-in pb-16"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* ─── Page Header with Step Title & Balance Pill ─── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {step !== STEPS.RECIPIENT && step !== STEPS.STATUS && (
              <button
                onClick={() => {
                  setError('');
                  if (step === STEPS.AMOUNT) setStep(STEPS.RECIPIENT);
                  else if (step === STEPS.METHOD) setStep(STEPS.AMOUNT);
                  else if (step === STEPS.REVIEW) setStep(STEPS.METHOD);
                }}
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
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {isShopMode && step !== STEPS.STATUS && <Store size={24} className="text-[#4F6FD8]" />}
                <span>
                  {step === STEPS.STATUS
                    ? 'Payment Confirmation'
                    : isShopMode
                    ? 'Pay Merchant'
                    : 'Send Money'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {step === STEPS.RECIPIENT && 'Choose who to pay or scan a payment QR code'}
                {step === STEPS.AMOUNT && `Enter transfer amount for ${receiver?.name || 'recipient'}`}
                {step === STEPS.METHOD && 'Select transfer protocol (Online or ECDSA Offline QR)'}
                {step === STEPS.REVIEW && 'Verify details and confirm payment'}
                {step === STEPS.STATUS && 'Transaction state and cryptographic proof'}
              </p>
            </div>
          </div>

          {step !== STEPS.STATUS && (
            <div
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1rem',
                padding: '8px 16px',
                textAlign: 'right',
              }}
              className="shrink-0"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                Available Balance
              </span>
              <span className="text-sm font-black text-[#3155B8]">
                {formatCurrency(currentAvailableBalance)}
              </span>
            </div>
          )}
        </div>

        {/* ─── Step Progress Bar ─── */}
        {step !== STEPS.STATUS && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1rem',
              padding: '12px 18px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.04)',
            }}
          >
            <div className="flex items-center gap-2">
              {[
                { id: STEPS.RECIPIENT, label: '1. Recipient' },
                { id: STEPS.AMOUNT, label: '2. Amount' },
                { id: STEPS.METHOD, label: '3. Method' },
                { id: STEPS.REVIEW, label: '4. Review' },
              ].map((s, idx) => {
                const stepKeys = [STEPS.RECIPIENT, STEPS.AMOUNT, STEPS.METHOD, STEPS.REVIEW];
                const currentIndex = stepKeys.indexOf(step);
                const isActive = s.id === step;
                const isPast = currentIndex > idx;

                return (
                  <div key={s.id} className="flex-1">
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '9999px',
                        background: isActive
                          ? 'linear-gradient(90deg, #172B75 0%, #3155B8 100%)'
                          : isPast
                          ? '#16A66A'
                          : (isDark ? 'rgba(255,255,255,0.1)' : '#EAF0FF'),
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: isActive ? 800 : isPast ? 700 : 500,
                        color: isActive
                          ? (isDark ? '#738EE4' : '#172B75')
                          : isPast
                          ? '#16A66A'
                          : 'var(--text-muted)',
                        marginTop: '6px',
                        display: 'block',
                      }}
                      className="truncate"
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Error Alert ─── */}
        {error && (
          <div
            style={{
              background: isDark ? 'rgba(214,69,69,0.15)' : '#FEF6F6',
              border: `1px solid ${isDark ? 'rgba(214,69,69,0.3)' : 'rgba(214,69,69,0.3)'}`,
              borderRadius: '1rem',
              padding: '14px 18px',
              color: isDark ? '#F87171' : '#D64545',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
            className="flex items-start gap-3 animate-fade-in"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 1: CHOOSE RECIPIENT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.RECIPIENT && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.25rem',
              padding: '26px 28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-6"
          >
            {/* Mode Option Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--text-secondary)' }}>
                Choose Payment Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Send to User */}
                <button
                  type="button"
                  onClick={() => setPayOption('user')}
                  style={{
                    padding: '18px 14px',
                    borderRadius: '1rem',
                    border: `2px solid ${payOption === 'user' ? '#3155B8' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                    background: payOption === 'user'
                      ? (isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF')
                      : (isDark ? 'var(--bg-elevated)' : '#F5F7FF'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 text-center group"
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '0.875rem',
                      background: payOption === 'user' ? '#3155B8' : (isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'),
                      color: payOption === 'user' ? '#FFFFFF' : '#3155B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="group-hover:scale-105 transition-transform"
                  >
                    <User size={22} strokeWidth={2.2} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: payOption === 'user' ? (isDark ? '#FFFFFF' : '#172B75') : 'var(--text-primary)',
                    }}
                  >
                    Send to User
                  </span>
                </button>

                {/* 2. Scan QR */}
                <button
                  type="button"
                  onClick={() => navigate('/scan', { state: { autoStart: true } })}
                  style={{
                    padding: '18px 14px',
                    borderRadius: '1rem',
                    border: `2px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 text-center group hover:border-[#3155B8]/50"
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '0.875rem',
                      background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                      color: '#4F6FD8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="group-hover:scale-105 transition-transform"
                  >
                    <QrCode size={22} strokeWidth={2.2} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Scan QR
                  </span>
                </button>

                {/* 3. Pay Merchant */}
                <button
                  type="button"
                  onClick={() => navigate('/send?mode=shop')}
                  style={{
                    padding: '18px 14px',
                    borderRadius: '1rem',
                    border: `2px solid ${isShopMode ? '#3155B8' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                    background: isShopMode
                      ? (isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF')
                      : (isDark ? 'var(--bg-elevated)' : '#F5F7FF'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 text-center group hover:border-[#3155B8]/50"
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '0.875rem',
                      background: isShopMode ? '#3155B8' : (isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'),
                      color: isShopMode ? '#FFFFFF' : '#4F6FD8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="group-hover:scale-105 transition-transform"
                  >
                    <Store size={22} strokeWidth={2.2} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: isShopMode ? (isDark ? '#FFFFFF' : '#172B75') : 'var(--text-primary)',
                    }}
                  >
                    Pay Merchant
                  </span>
                </button>
              </div>
            </div>

            {/* Recipient Search Input */}
            <div className="space-y-2">
              <label htmlFor="recipient-search" className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                Search Recipient or Contact
              </label>
              <div
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '0.875rem',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Search size={18} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                <input
                  id="recipient-search"
                  type="text"
                  placeholder="Enter name, phone number, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '9999px',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Display or Recent Contacts */}
            {query.length > 0 ? (
              <div className="space-y-2.5 animate-fade-in">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Matching Contacts ({searchResults.length})
                </span>
                {searchResults.length > 0 ? (
                  <div
                    style={{
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      borderRadius: '1rem',
                      overflow: 'hidden',
                    }}
                    className="divide-y"
                  >
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectReceiver(user)}
                        style={{
                          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                          borderColor: isDark ? 'var(--border-color)' : '#EAF0FF',
                          padding: '14px 16px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          textAlign: 'left',
                          border: 'none',
                        }}
                        className="group"
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'var(--bg-surface)' : '#FFFFFF'; }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '0.75rem',
                              background: user.avatarColor || '#4F6FD8',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                              {user.name}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }} className="truncate">
                              {user.phone || user.email || user.id}
                            </p>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#738EE4' : '#3155B8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                          }}
                          className="group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Select</span>
                          <ChevronRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      borderRadius: '1rem',
                      border: `1px dashed ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      No contact found for "{search}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      You can pay by entering an exact registered email or scanning their QR.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Recent Contacts List */
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Recent Payees & Contacts
                </span>
                {recentRecipients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recentRecipients.map(contact => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectReceiver(contact)}
                        style={{
                          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                          border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                          borderRadius: '0.875rem',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        className="group"
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = isDark ? 'var(--border-hover)' : '#3155B8';
                          e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = isDark ? 'var(--border-color)' : '#DCE3F2';
                          e.currentTarget.style.background = isDark ? 'var(--bg-surface)' : '#FFFFFF';
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '0.625rem',
                              background: contact.avatarColor || '#4F6FD8',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.8125rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {contact.name ? contact.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                              {contact.name}
                            </p>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }} className="truncate">
                              {contact.phone || contact.email || contact.id}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-0.5 group-hover:text-[#3155B8] shrink-0 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      borderRadius: '1rem',
                      border: `1px dashed ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                      No recent contacts found.
                    </p>
                    {availableReceivers.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {availableReceivers.slice(0, 4).map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectReceiver(u)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '0.625rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                              color: isDark ? '#738EE4' : '#172B75',
                              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                              cursor: 'pointer',
                            }}
                          >
                            + {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Offline Readiness Notice */}
            <div
              style={{
                background: isDark ? 'rgba(79,111,216,0.1)' : '#EEF4FF',
                border: `1px solid ${isDark ? 'rgba(79,111,216,0.25)' : '#C5D5F8'}`,
                borderRadius: '1rem',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.625rem',
                  background: isDark ? 'rgba(79,111,216,0.2)' : 'rgba(49,85,184,0.15)',
                  color: isDark ? '#738EE4' : '#3155B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <WifiOff size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: isDark ? '#FFFFFF' : '#172B75', margin: 0 }}>
                  Offline payment ready
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                  Create cryptographically signed payment vouchers even with zero internet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2: ENTER AMOUNT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.AMOUNT && receiver && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.25rem',
              padding: '28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-6"
          >
            {/* Selected Recipient Card */}
            <div
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1rem',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '0.875rem',
                    background: receiver.avatarColor || '#4F6FD8',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {receiver.name ? receiver.name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Paying Recipient
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                    {receiver.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }} className="truncate font-mono">
                    {receiver.email || receiver.phone || receiver.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(STEPS.RECIPIENT)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: isDark ? '#738EE4' : '#3155B8',
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '0.625rem',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Change
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="payment-amount" className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                  Transfer Amount
                </label>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Available: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(currentAvailableBalance)}</strong>
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: isDark ? 'var(--bg-elevated)' : '#FFFFFF',
                  border: `2px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '1rem',
                  padding: '4px 16px',
                  transition: 'border-color 0.2s',
                }}
                className="focus-within:border-[#3155B8]"
              >
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'var(--text-muted)',
                    marginRight: '8px',
                    userSelect: 'none',
                  }}
                >
                  Rs.
                </span>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    padding: '8px 0',
                  }}
                  autoFocus
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Quick add:</span>
                {QUICK_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      setError('');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: parsedAmount === preset
                        ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)'
                        : (isDark ? 'var(--bg-elevated)' : '#FFFFFF'),
                      color: parsedAmount === preset ? '#FFFFFF' : 'var(--text-secondary)',
                      border: `1px solid ${parsedAmount === preset ? '#172B75' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    +Rs. {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label htmlFor="payment-note" className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                Note / Description (Optional)
              </label>
              <div
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '0.875rem',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FileText size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                <input
                  id="payment-note"
                  type="text"
                  placeholder="e.g. Lunch split, taxi fare, groceries"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={140}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(STEPS.RECIPIENT)}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleAmountContinue}
                className="w-2/3 font-bold"
                id="btn-amount-continue"
              >
                Continue to Method
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3: CHOOSE PAYMENT METHOD
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.METHOD && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.25rem',
              padding: '28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                Select Payment Protocol
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Transfer Amount: <strong className="text-[#16A66A] font-bold">{formatCurrency(parsedAmount)}</strong>
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Option 1: Instant Online Transfer */}
              <label
                style={{
                  background: paymentMethod === 'online'
                    ? (isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF')
                    : (isDark ? 'var(--bg-elevated)' : '#FFFFFF'),
                  border: `2px solid ${paymentMethod === 'online' ? '#3155B8' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                  borderRadius: '1rem',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  cursor: isOffline ? 'not-allowed' : 'pointer',
                  opacity: isOffline ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  disabled={isOffline}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Wifi size={18} className="text-[#3155B8]" />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      Instant Online Transfer
                    </span>
                    <span className="badge badge-settled text-[10px]">Real-time</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Immediate central database commitment. Requires active internet connectivity.
                  </p>
                  {isOffline && (
                    <span className="text-[11px] font-semibold text-[#D64545] mt-1 block">
                      ⚠ Currently offline. Use Cryptographic Offline Payment below.
                    </span>
                  )}
                </div>
              </label>

              {/* Option 2: Cryptographic Offline Payment */}
              <label
                style={{
                  background: paymentMethod === 'offline'
                    ? (isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF')
                    : (isDark ? 'var(--bg-elevated)' : '#FFFFFF'),
                  border: `2px solid ${paymentMethod === 'offline' ? '#3155B8' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                  borderRadius: '1rem',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="offline"
                  checked={paymentMethod === 'offline'}
                  onChange={() => setPaymentMethod('offline')}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <WifiOff size={18} className="text-[#3155B8]" />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      Cryptographic Offline QR Voucher
                    </span>
                    <span className="badge badge-offline text-[10px]">ECDSA P-256</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Digitally signed with local device hardware keys. Displays dynamic QR verified and settled without internet.
                  </p>

                  <div className="mt-3 pt-2.5 border-t text-xs space-y-1" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                    <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                      <span>Authorized Offline Limit:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {isAuthActive ? formatCurrency(remainingOfflineLimit) : 'No active limit'}
                      </strong>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(STEPS.AMOUNT)}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleMethodContinue}
                className="w-2/3 font-bold"
                id="btn-method-continue"
              >
                Review Payment
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 4: REVIEW PAYMENT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.REVIEW && receiver && (
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.25rem',
              padding: '28px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            }}
            className="space-y-6"
          >
            <div className="text-center py-2">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Total Transfer Amount
              </span>
              <p className="text-4xl sm:text-5xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(parsedAmount)}
              </p>
              <p className="text-xs mt-0.5 font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                NPR
              </p>
            </div>

            {/* Review breakdown details */}
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
                <strong style={{ color: 'var(--text-primary)' }}>{receiver.name}</strong>
              </div>
              <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <span className="font-bold flex items-center gap-1.5">
                  {paymentMethod === 'offline' ? (
                    <>
                      <WifiOff size={15} className="text-[#3155B8]" />
                      <span className="text-[#3155B8]">Offline QR (ECDSA P-256)</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={15} className="text-[#16A66A]" />
                      <span className="text-[#16A66A]">Online Instant Transfer</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transfer Fee:</span>
                <span className="text-[#16A66A] font-bold">Free (Rs. 0.00)</span>
              </div>
              {note && (
                <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Note:</span>
                  <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{note}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3.5" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Remaining Balance After:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(Math.max(0, currentAvailableBalance - parsedAmount))}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(STEPS.METHOD)}
                disabled={isProcessing}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleExecutePayment}
                loading={isProcessing}
                disabled={isProcessing}
                className="w-2/3 font-bold"
                id="btn-confirm-pay"
              >
                {paymentMethod === 'offline' ? 'Confirm & Generate Payment QR' : 'Confirm & Pay Now'}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 5: PAYMENT STATUS & QR PRESENTATION
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.STATUS && createdTx && (() => {
          const currentTx = (transactions || []).find(t => t.id === createdTx.id) || createdTx;
          const isSettled = currentTx.status === 'SETTLED';
          const isAck = currentTx.status === 'RECEIVER_ACKNOWLEDGED' || currentTx.receiverAcknowledged;

          return showReceiptView ? (
            <PaymentReceipt
              transaction={currentTx}
              isSender={true}
              onDone={() => navigate('/dashboard')}
            />
          ) : (
            <div
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1.25rem',
                padding: '30px',
                boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
                textAlign: 'center',
              }}
              className="space-y-6"
            >
              {/* Header Title */}
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
                    marginBottom: '12px',
                    background: isTxExpired
                      ? 'rgba(214,69,69,0.15)'
                      : isSettled
                      ? 'rgba(22,166,106,0.15)'
                      : isAck
                      ? 'rgba(79,111,216,0.15)'
                      : '#EEF4FF',
                    color: isTxExpired
                      ? '#D64545'
                      : isSettled
                      ? '#16A66A'
                      : isAck
                      ? '#3155B8'
                      : '#3155B8',
                    border: `1px solid ${isTxExpired ? '#D64545' : isSettled ? '#16A66A' : '#3155B8'}`,
                  }}
                >
                  {isTxExpired ? <Clock size={13} /> : isSettled ? <CheckCircle2 size={13} /> : isAck ? <CheckCircle2 size={13} /> : <WifiOff size={13} />}
                  <span>
                    {isTxExpired
                      ? 'Payment Expired & Refunded'
                      : isSettled
                      ? 'Payment Settled Successfully'
                      : isAck
                      ? 'Receiver Acknowledged Offline'
                      : 'Waiting for Receiver'}
                  </span>
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {isTxExpired
                    ? 'Payment Expired & Cancelled'
                    : isSettled
                    ? 'Payment Settled Successfully'
                    : isAck
                    ? 'Receiver Acknowledged Offline'
                    : 'Show Payment QR'}
                </h2>
                <p className="text-xs sm:text-sm max-w-md mx-auto mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isTxExpired
                    ? `Not claimed within 5 minutes. ${formatCurrency(createdTx.amount)} has been refunded to your wallet.`
                    : isSettled
                    ? 'Your payment was authoritatively verified and settled on the ledger.'
                    : isAck
                    ? 'The receiver has verified and claimed this payment. Awaiting automatic online synchronization.'
                    : 'Show this QR to the receiver to scan. After they accept it, scan their acknowledgment QR.'}
                </p>
              </div>

              {/* Countdown badge for unclaimed offline payments */}
              {createdTx.method === 'OFFLINE_QR' && !isTxExpired && !isAck && !isSettled && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isDark ? 'rgba(79,111,216,0.15)' : '#EEF4FF',
                    color: isDark ? '#738EE4' : '#3155B8',
                    border: `1px solid ${isDark ? 'rgba(79,111,216,0.3)' : '#C5D5F8'}`,
                  }}
                  className="mx-auto"
                >
                  <Clock size={14} className="animate-pulse" />
                  <span>
                    Valid for {Math.floor(remainingSecs / 60)}:{(remainingSecs % 60).toString().padStart(2, '0')} · Auto-refunds if unclaimed
                  </span>
                </div>
              )}

              {/* Amount Display Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '1rem',
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  maxWidth: '360px',
                  margin: '0 auto',
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Amount
                </span>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: isTxExpired ? 'var(--text-muted)' : (isDark ? '#738EE4' : '#3155B8'),
                    margin: '4px 0',
                    textDecoration: isTxExpired ? 'line-through' : 'none',
                  }}
                >
                  {formatCurrency(createdTx.amount)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Recipient: <strong style={{ color: 'var(--text-primary)' }}>{createdTx.receiverName}</strong>
                </p>
              </div>

              {/* Offline QR Presentation or Expired Box */}
              {createdTx.method === 'OFFLINE_QR' && (
                isTxExpired ? (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '1rem',
                      background: 'rgba(214,69,69,0.1)',
                      border: '1px solid rgba(214,69,69,0.3)',
                      maxWidth: '360px',
                      margin: '0 auto',
                    }}
                  >
                    <Clock size={28} className="text-[#D64545] mx-auto mb-2" />
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#D64545', margin: 0 }}>
                      5-Minute Window Expired
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Funds have been released and restored to your spendable balance.
                    </p>
                  </div>
                ) : (
                  qrDataUrl && (
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '1.25rem',
                        background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                        maxWidth: '360px',
                        margin: '0 auto',
                      }}
                      className="space-y-3"
                    >
                      <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-[#DCE3F2]">
                        <img src={qrDataUrl} alt="Signed Offline Payment QR" className="w-56 h-56 sm:w-60 sm:h-60 mx-auto" />
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                        Signed with ECDSA P-256 device key · Anti-replay protected
                      </p>
                    </div>
                  )
                )
              )}

              {/* Two-Way Offline Acknowledgment Scanning Block */}
              {createdTx.method === 'OFFLINE_QR' && !isTxExpired && !isAck && !isSettled && (
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '1.25rem',
                    background: isDark ? 'rgba(79,111,216,0.12)' : '#EEF4FF',
                    border: `1px solid ${isDark ? 'rgba(79,111,216,0.25)' : '#C5D5F8'}`,
                    maxWidth: '360px',
                    margin: '0 auto',
                    textAlign: 'left',
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.75rem',
                        background: isDark ? 'rgba(79,111,216,0.25)' : 'rgba(49,85,184,0.15)',
                        color: isDark ? '#738EE4' : '#3155B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Camera size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#172B75', margin: 0 }}>
                        Scan Receiver Acknowledgment
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>
                        Scan receiver's signed acknowledgment QR to confirm offline receipt
                      </p>
                    </div>
                  </div>

                  {showAckScanner ? (
                    <div className="space-y-3">
                      <div
                        id="ack-qr-reader"
                        className="w-full rounded-xl overflow-hidden border border-[#DCE3F2] bg-slate-900 min-h-[220px]"
                      />
                      {ackScanError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                          {ackScanError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => ackFileInputRef.current?.click()}
                          leftIcon={<ImageIcon size={14} />}
                        >
                          Upload Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={handleStopAckScanner}
                        >
                          Close Scanner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Button
                        variant="primary"
                        onClick={handleStartAckScanner}
                        leftIcon={<Camera size={16} />}
                        id="btn-scan-receiver-ack"
                        className="flex-1 font-bold text-xs"
                      >
                        Camera Scanner
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => ackFileInputRef.current?.click()}
                        leftIcon={<ImageIcon size={16} />}
                        id="btn-upload-receiver-ack-img"
                        className="flex-1 text-xs font-semibold"
                      >
                        Upload Photo
                      </Button>
                    </div>
                  )}

                  <input
                    ref={ackFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAckImageUpload}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowReceiptView(true)}
                  className="w-full sm:w-1/2"
                >
                  View Receipt
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-1/2 font-bold"
                >
                  Done
                </Button>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}

export default SendMoney;
