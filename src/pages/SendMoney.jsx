import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowUpRight, Wifi, WifiOff, ChevronRight, Search, QrCode,
  CheckCircle2, AlertTriangle, ShieldCheck, Copy, ArrowLeft, RefreshCw,
  Wallet, User, FileText, Store, Eye, ChevronDown, Clock
} from 'lucide-react';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import PaymentReceipt from '../components/wallet/PaymentReceipt';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { getAllUsers } from '../services/db';
import { formatCurrency, formatTxIdShort, formatDateTime } from '../utils/formatting';

const STEPS = {
  RECIPIENT: 'recipient',
  AMOUNT: 'amount',
  METHOD: 'method',
  REVIEW: 'review',
  STATUS: 'status',
};

const QUICK_AMOUNTS = [50, 100, 200, 500];

function SendMoney() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, transactions,
    createOfflineTransaction, createOnlineTransaction,
    expirePendingTransactions,
    registerDevice, TX_STATUS
  } = useWallet();
  const { isOffline } = useOfflineSimulation();
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
        width: 260,
        margin: 2,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [createdTx]);

  // 5-minute timeout countdown for offline QR payments
  useEffect(() => {
    if (!createdTx || createdTx.method !== 'OFFLINE_QR' || step !== STEPS.STATUS) return;

    const txTime = new Date(createdTx.createdAt || createdTx.timestamp).getTime();
    const checkExpiration = async () => {
      const elapsed = Math.floor((Date.now() - txTime) / 1000);
      const left = Math.max(0, 300 - elapsed);
      setRemainingSecs(left);

      if (left <= 0) {
        setIsTxExpired(true);
        if (expirePendingTransactions) {
          await expirePendingTransactions();
        }
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 1000);
    return () => clearInterval(timer);
  }, [createdTx, step, expirePendingTransactions]);

  // Available recipients: registered users except self and admin
  const availableReceivers = directoryUsers.filter(
    u => u.id !== currentUser?.id && u.role !== 'admin'
  );

  // Search filter
  const query = search.trim().toLowerCase();
  const searchResults = query ? availableReceivers.filter(u =>
    (u.name && u.name.toLowerCase().includes(query)) ||
    (u.email && u.email.toLowerCase().includes(query)) ||
    (u.phone && u.phone.includes(query)) ||
    (u.id && u.id.toLowerCase().includes(query))
  ) : [];

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
        avatarColor: matched?.avatarColor || '#4F46E5',
      });
    }
  });

  // Authorization validity
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
        setError('Device registration is required before making offline payments. Please register your device in Device Management.');
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

  const handleCopyTxId = () => {
    if (createdTx?.id) {
      navigator.clipboard.writeText(createdTx.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== STEPS.RECIPIENT && step !== STEPS.STATUS && (
              <button
                onClick={() => {
                  setError('');
                  if (step === STEPS.AMOUNT) setStep(STEPS.RECIPIENT);
                  else if (step === STEPS.METHOD) setStep(STEPS.AMOUNT);
                  else if (step === STEPS.REVIEW) setStep(STEPS.METHOD);
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--color-gray-100)] text-[var(--color-gray-600)] transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)] tracking-tight flex items-center gap-2">
                {isShopMode && step !== STEPS.STATUS && <Store size={22} className="text-indigo-600" />}
                <span>{step === STEPS.STATUS ? 'Payment Receipt' : isShopMode ? 'Pay Shopkeeper' : 'Send Money'}</span>
              </h1>
              <p className="text-xs text-[var(--color-gray-500)]">
                {step === STEPS.RECIPIENT && (isShopMode ? 'Scan shopkeeper QR or pick merchant to pay' : 'Choose who to pay or scan a payment QR')}
                {step === STEPS.AMOUNT && `Enter amount for ${receiver?.name || 'recipient'}`}
                {step === STEPS.METHOD && 'Choose transfer mechanism'}
                {step === STEPS.REVIEW && 'Verify details before payment'}
                {step === STEPS.STATUS && 'Transaction state and local verification'}
              </p>
            </div>
          </div>

          {step !== STEPS.STATUS && (
            <div className="text-right">
              <span className="text-[11px] text-[var(--color-gray-400)] block">Balance</span>
              <span className="text-sm font-bold text-[var(--color-indigo-600)]">
                {formatCurrency(currentAvailableBalance)}
              </span>
            </div>
          )}
        </div>

        {/* Step Progress Bar */}
        {step !== STEPS.STATUS && (
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
                    className={`h-1.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-[var(--color-indigo-600)]'
                        : isPast
                        ? 'bg-emerald-500'
                        : 'bg-[var(--color-gray-200)]'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold mt-1 block truncate ${
                      isActive ? 'text-[var(--color-indigo-600)]' : 'text-[var(--color-gray-400)]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-shake">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 1: CHOOSE RECIPIENT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.RECIPIENT && (
          <Card padding className="space-y-5">
            {/* Payment Hub Entry Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/scan"
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-gray-200)] hover:border-[var(--color-indigo-400)] hover:bg-indigo-50/50 transition-all no-underline group"
                id="btn-send-scan-qr"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Scan Payment QR</h3>
                  <p className="text-[11px] text-[var(--color-gray-500)]">Scan another user's QR to autofill</p>
                </div>
              </Link>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Directory Search</h3>
                  <p className="text-[11px] text-[var(--color-gray-500)]">Pick a registered account below</p>
                </div>
              </div>
            </div>

            {/* Recipient Search Box */}
            <div className="space-y-1.5">
              <label htmlFor="recipient-search" className="text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider">
                Who do you want to pay?
              </label>
              <Input
                id="recipient-search"
                placeholder="Search registered recipient by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search size={16} />}
                autoFocus
              />
            </div>

            {/* Search Results Display */}
            {query.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                  Search Results ({searchResults.length})
                </p>
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-[var(--color-gray-100)] border border-[var(--color-gray-200)] rounded-xl overflow-hidden">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectReceiver(user)}
                        className="w-full flex items-center gap-3 p-3.5 bg-white hover:bg-indigo-50/60 transition-colors text-left group"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ background: user.avatarColor || '#4F46E5' }}
                        >
                          {user.avatar || (user.name ? user.name[0] : 'U')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--color-gray-900)] truncate">{user.name}</p>
                          <p className="text-xs text-[var(--color-gray-400)] truncate">{user.email || user.phone || user.id}</p>
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-indigo-600)] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Select <ChevronRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 p-4 border border-dashed border-[var(--color-gray-200)] rounded-xl">
                    <p className="text-sm font-bold text-[var(--color-gray-700)]">No recipient found</p>
                    <p className="text-xs text-[var(--color-gray-400)] mt-1 max-w-sm mx-auto">
                      No registered user matches "{search}". You can scan their QR code or try searching by full email address.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Link to="/scan" className="btn btn-outline btn-sm no-underline">
                        <QrCode size={14} /> Scan QR Instead
                      </Link>
                      <button
                        onClick={() => setSearch('')}
                        className="btn btn-secondary btn-sm"
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Recent Contacts List */
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                  Recent Recipients ({recentRecipients.length})
                </p>
                {recentRecipients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentRecipients.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectReceiver(contact)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-gray-200)] hover:border-[var(--color-indigo-400)] hover:bg-indigo-50/40 transition-all text-left group"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ background: contact.avatarColor || '#4F46E5' }}
                        >
                          {contact.name ? contact.name[0] : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)] truncate">
                            {contact.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-gray-400)] truncate">
                            {contact.email || contact.id}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-[var(--color-gray-300)] group-hover:text-[var(--color-indigo-600)]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[var(--color-gray-200)] rounded-xl">
                    <p className="text-xs text-[var(--color-gray-500)]">No previous recipients yet.</p>
                    <p className="text-[11px] text-[var(--color-gray-400)] mt-0.5">
                      Search by recipient name above or pick from registered demo accounts.
                    </p>
                    {availableReceivers.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-2 px-3">
                        {availableReceivers.slice(0, 3).map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleSelectReceiver(u)}
                            className="btn btn-outline btn-sm text-xs py-1 px-2.5"
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
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2: ENTER AMOUNT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.AMOUNT && receiver && (
          <Card padding className="space-y-5">
            {/* Selected Recipient Card */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-gray-50)] border border-[var(--color-gray-200)]">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: receiver.avatarColor || '#4F46E5' }}
                >
                  {receiver.name ? receiver.name[0] : 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                    Paying Recipient
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[var(--color-gray-900)] truncate">
                    {receiver.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-gray-500)] truncate font-mono">
                    {receiver.email || receiver.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(STEPS.RECIPIENT)}
                className="text-xs font-semibold text-[var(--color-indigo-600)] hover:underline flex-shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="payment-amount" className="text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider">
                  Payment Amount
                </label>
                <span className="text-xs text-[var(--color-gray-500)]">
                  Available: <strong className="text-[var(--color-gray-800)]">{formatCurrency(currentAvailableBalance)}</strong>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[var(--color-gray-400)]">
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
                  className="w-full pl-14 pr-4 py-3.5 text-2xl font-black text-[var(--color-gray-900)] border-2 border-[var(--color-gray-200)] focus:border-[var(--color-indigo-600)] rounded-xl outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-[var(--color-gray-400)] font-medium">Quick add:</span>
                {QUICK_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      setError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      parsedAmount === preset
                        ? 'bg-[var(--color-indigo-600)] text-white border-[var(--color-indigo-600)]'
                        : 'bg-white hover:bg-slate-50 text-[var(--color-gray-700)] border-[var(--color-gray-200)]'
                    }`}
                  >
                    +Rs. {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label htmlFor="payment-note" className="text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider">
                Note / Description (Optional)
              </label>
              <Input
                id="payment-note"
                placeholder="e.g. Lunch split, taxi fare, groceries"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={140}
                leftIcon={<FileText size={16} />}
              />
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
                className="w-2/3"
                id="btn-amount-continue"
              >
                Continue to Method
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3: CHOOSE PAYMENT METHOD
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.METHOD && (
          <Card padding className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-gray-800)] uppercase tracking-wider">
                Select Payment Method
              </h2>
              <p className="text-xs text-[var(--color-gray-500)] mt-0.5">
                Amount to send: <strong className="text-emerald-600 font-bold">{formatCurrency(parsedAmount)}</strong>
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Online Payment */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'online'
                    ? 'border-[var(--color-indigo-600)] bg-indigo-50/30'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                } ${isOffline ? 'opacity-50 pointer-events-none' : ''}`}
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
                    <Wifi size={16} className="text-[var(--color-indigo-600)]" />
                    <span className="text-sm font-bold text-[var(--color-gray-900)]">
                      Instant Online Transfer
                    </span>
                    <span className="badge badge-settled text-[10px]">Real-time</span>
                  </div>
                  <p className="text-xs text-[var(--color-gray-500)] mt-1 leading-relaxed">
                    Settles immediately with database confirmation. Requires active internet connection.
                  </p>
                  {isOffline && (
                    <span className="text-[11px] font-semibold text-amber-700 mt-1 block">
                      ⚠ Unavailable while offline.
                    </span>
                  )}
                </div>
              </label>

              {/* Option 2: Offline Signed Payment */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'offline'
                    ? 'border-[var(--color-indigo-600)] bg-indigo-50/30'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}
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
                    <WifiOff size={16} className="text-amber-600" />
                    <span className="text-sm font-bold text-[var(--color-gray-900)]">
                      Cryptographic Offline Payment
                    </span>
                    <span className="badge badge-pending text-[10px]">Local P-256</span>
                  </div>
                  <p className="text-xs text-[var(--color-gray-500)] mt-1 leading-relaxed">
                    Cryptographically signs the payment using your device key and displays a QR code. Stored locally until synchronized.
                  </p>

                  {/* Offline eligibility callouts */}
                  <div className="mt-2.5 pt-2 border-t border-[var(--color-gray-100)] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-gray-500)]">Authorized offline limit:</span>
                      <span className="font-semibold text-[var(--color-gray-800)]">
                        {isAuthActive ? formatCurrency(remainingOfflineLimit) : 'No active limit'}
                      </span>
                    </div>

                    {!device && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mt-2">
                        Device not registered yet. Please register your device first.
                      </div>
                    )}
                    {device && !isAuthActive && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mt-2 flex items-center justify-between">
                        <span>Offline authorization required</span>
                        <Link to="/offline-authorization" className="font-bold underline text-amber-900">
                          Authorize Now
                        </Link>
                      </div>
                    )}
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
                className="w-2/3"
                id="btn-method-continue"
              >
                Review Payment
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 4: REVIEW PAYMENT
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.REVIEW && receiver && (
          <Card padding className="space-y-5">
            <div className="text-center py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                Total Amount To Transfer
              </span>
              <p className="text-3xl sm:text-4xl font-black text-[var(--color-gray-900)] mt-1">
                {formatCurrency(parsedAmount)}
              </p>
              <p className="text-xs text-[var(--color-gray-500)] mt-0.5">NPR (Nepalese Rupee)</p>
            </div>

            {/* Review breakdown details */}
            <div className="divide-y divide-[var(--color-gray-100)] border border-[var(--color-gray-200)] rounded-2xl overflow-hidden bg-white text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--color-gray-500)]">Recipient / Shopkeeper:</span>
                <span className="font-bold text-[var(--color-gray-900)]">{receiver.name}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--color-gray-500)]">Recipient ID:</span>
                <span className="font-mono text-[11px] text-[var(--color-gray-600)]">{formatTxIdShort(receiver.id)}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--color-gray-500)]">Payment Method:</span>
                <span className="font-bold text-[var(--color-indigo-600)] flex items-center gap-1">
                  {paymentMethod === 'offline' ? (
                    <>
                      <WifiOff size={14} className="text-amber-600" />
                      <span>Offline QR (P-256 Signed)</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={14} className="text-emerald-600" />
                      <span>Online Immediate</span>
                    </>
                  )}
                </span>
              </div>
              {note && (
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-[var(--color-gray-500)]">Note:</span>
                  <span className="text-[var(--color-gray-700)] italic">{note}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50">
                <span className="text-[var(--color-gray-500)]">Available Balance After:</span>
                <span className="font-bold text-[var(--color-gray-800)]">
                  {formatCurrency(Math.max(0, currentAvailableBalance - parsedAmount))}
                </span>
              </div>
              {paymentMethod === 'offline' && (
                <div className="flex items-center justify-between p-3.5 bg-amber-50/50">
                  <span className="text-amber-900 font-medium">Remaining Offline Allowance After:</span>
                  <span className="font-black text-amber-900">
                    {formatCurrency(Math.max(0, remainingOfflineLimit - parsedAmount))}
                  </span>
                </div>
              )}
            </div>

            {/* Offline Settlement Warning & Reassurance */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck size={15} className="text-amber-700" />
                <span>Device Authorization & Reconciliation Notice</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {paymentMethod === 'offline'
                  ? `After this payment, your remaining offline allowance will be ${formatCurrency(Math.max(0, remainingOfflineLimit - parsedAmount))}. Payment will be accepted and verified locally on the receiver's device. Final server reconciliation occurs when either device reconnects.`
                  : 'Instant online transfer verified and settled authoritatively on the server.'}
              </p>
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
                {paymentMethod === 'offline' ? 'Confirm & Generate Payment QR' : 'Confirm & Pay'}
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 5: PAYMENT STATUS & QR PRESENTATION
        ════════════════════════════════════════════════════════════ */}
        {step === STEPS.STATUS && createdTx && (
          showReceiptView ? (
            <PaymentReceipt
              transaction={createdTx}
              isSender={true}
              onDone={() => navigate('/dashboard')}
            />
          ) : (
            <Card padding className="space-y-5 text-center">
              {/* Header Title */}
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isTxExpired ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                } mb-2`}>
                  {isTxExpired ? <Clock size={12} /> : createdTx.method === 'OFFLINE_QR' ? <WifiOff size={12} /> : <CheckCircle2 size={12} />}
                  <span>{isTxExpired ? 'Payment Expired & Cancelled' : createdTx.method === 'OFFLINE_QR' ? 'Offline Payment QR' : 'Payment Settled'}</span>
                </span>
                <h2 className="text-2xl font-black text-[var(--color-gray-900)] tracking-tight">
                  {isTxExpired
                    ? 'Payment Expired & Cancelled'
                    : createdTx.method === 'OFFLINE_QR'
                    ? 'Ask the shopkeeper to scan this QR'
                    : 'Payment Settled Successfully'}
                </h2>
                <p className="text-xs text-[var(--color-gray-500)] max-w-sm mx-auto mt-1">
                  {isTxExpired
                    ? `Not scanned within 5 minutes. ${formatCurrency(createdTx.amount)} has been automatically refunded to your wallet balance.`
                    : createdTx.method === 'OFFLINE_QR'
                    ? 'Keep this screen open until the receiver scans and accepts the signed token.'
                    : 'Your payment was settled and confirmed immediately.'}
                </p>
              </div>

              {/* Countdown badge if active offline payment */}
              {createdTx.method === 'OFFLINE_QR' && !isTxExpired && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 mx-auto">
                  <Clock size={13} className="text-amber-600 animate-pulse" />
                  <span>
                    Valid for {Math.floor(remainingSecs / 60)}:{(remainingSecs % 60).toString().padStart(2, '0')} · Auto-cancels if not scanned
                  </span>
                </div>
              )}

              {/* Amount Display */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                  Payment Amount
                </span>
                <p className={`text-3xl font-black mt-0.5 ${isTxExpired ? 'text-slate-400 line-through' : 'text-[var(--color-indigo-600)]'}`}>
                  {formatCurrency(createdTx.amount)}
                </p>
                <p className="text-xs text-[var(--color-gray-600)] mt-1">
                  Paying: <strong>{createdTx.receiverName}</strong>
                </p>
              </div>

              {/* Offline QR Presentation or Expired Box */}
              {createdTx.method === 'OFFLINE_QR' && (
                isTxExpired ? (
                  <div className="p-5 rounded-2xl border-2 border-red-200 bg-red-50/60 max-w-sm mx-auto space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                      <Clock size={24} />
                    </div>
                    <p className="text-sm font-bold text-red-900">5-Minute Time Limit Exceeded</p>
                    <p className="text-xs text-red-700 leading-relaxed">
                      This payment was not received or scanned within 5 minutes. The QR token has been automatically cancelled and your funds ({formatCurrency(createdTx.amount)}) are refunded.
                    </p>
                  </div>
                ) : (
                  qrDataUrl && (
                    <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 max-w-sm mx-auto space-y-3">
                      <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-slate-200">
                        <img src={qrDataUrl} alt="Signed Offline Payment QR" className="w-60 h-60 mx-auto" />
                      </div>
                      <p className="text-[11px] text-[var(--color-gray-500)] font-medium">
                        Signed with local ECDSA P-256 device key · Anti-replay protected
                      </p>
                    </div>
                  )
                )
              )}

              {/* Collapsible Technical Payload Drawer */}
              <div className="max-w-sm mx-auto text-left">
                <button
                  type="button"
                  onClick={() => setShowTechnicalPayload(s => !s)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)] p-2 rounded-lg hover:bg-slate-50 border border-transparent transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <span>Technical Cryptographic Details</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showTechnicalPayload ? 'rotate-180' : ''}`}
                  />
                </button>

                {showTechnicalPayload && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1.5 overflow-x-auto shadow-inner">
                    <div><span className="text-slate-500">tx_id:</span> {createdTx.id}</div>
                    <div><span className="text-slate-500">nonce:</span> {createdTx.nonce}</div>
                    <div><span className="text-slate-500">counter:</span> {createdTx.counter}</div>
                    <div><span className="text-slate-500">device:</span> {createdTx.deviceId}</div>
                    <div><span className="text-slate-500">signature:</span> {createdTx.signature?.slice(0, 32)}...</div>
                  </div>
                )}
              </div>

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
            </Card>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

export default SendMoney;
