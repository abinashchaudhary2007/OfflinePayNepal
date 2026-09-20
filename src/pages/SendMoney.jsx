/**
 * SendMoney.jsx — Phase 5
 * Full send money flow: select receiver → enter amount → online or offline payment.
 * Offline path: sign transaction → generate QR payload → navigate to QR display.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FileText, Wifi, WifiOff, ChevronRight, Search } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { DEMO_USERS } from '../data/mockData';
import { getAllUsers } from '../services/db';
import { formatCurrency } from '../utils/formatting';

const STEPS = { SELECT: 'select', AMOUNT: 'amount', CONFIRM: 'confirm', SUCCESS: 'success' };

function SendMoney() {
  const { currentUser } = useAuth();
  const { wallet, device, authorization, createOfflineTransaction, createOnlineTransaction, refreshTransactions, TX_STATUS } = useWallet();
  const { isOffline } = useOfflineSimulation();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.SELECT);
  const [receiver, setReceiver] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'offline'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [createdTx, setCreatedTx] = useState(null);
  const [search, setSearch] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState([]);

  // Load real registered users from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadDirectory() {
      try {
        const users = await getAllUsers();
        if (isMounted) setDirectoryUsers(users);
      } catch (err) {
        console.warn('[send] Could not load users from DB, falling back to mock:', err);
        if (isMounted) setDirectoryUsers(DEMO_USERS);
      }
    }
    loadDirectory();
    return () => { isMounted = false; };
  }, []);

  // Available receivers: all registered users except self and admin
  const receiversList = directoryUsers.length > 0 ? directoryUsers : DEMO_USERS;
  const receivers = receiversList.filter(u => u.id !== currentUser?.id && u.role !== 'admin');
  const filteredReceivers = receivers.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  const handleSelectReceiver = (user) => {
    setReceiver(user);
    setStep(STEPS.AMOUNT);
  };

  const handleAmountNext = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError('Enter a valid amount.'); return; }
    if (num > (wallet?.availableBalance || 0)) { setError('Insufficient balance.'); return; }
    if (paymentMethod === 'offline') {
      if (!authorization) { setError('No offline authorization. Get one first from Offline Authorization page.'); return; }
      if (num > authorization.remainingAmount) { setError(`Exceeds offline limit. Remaining: ${formatCurrency(authorization.remainingAmount)}`); return; }
      if (num > authorization.maxSingleTransaction) { setError(`Exceeds max per transaction (${formatCurrency(authorization.maxSingleTransaction)}).`); return; }
    }
    setError('');
    setStep(STEPS.CONFIRM);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError('');

    try {
      if (paymentMethod === 'offline' || isOffline) {
        // Offline path — sign and generate QR
        const newCounter = (device?.transactionCounter || 0) + 1;
        const tx = await createOfflineTransaction({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          amount: parseFloat(amount),
          note,
          deviceId: device?.id || 'DEVICE-UNKNOWN',
          authorizationId: authorization?.id,
          counter: newCounter,
        });
        setCreatedTx(tx);
        setStep(STEPS.SUCCESS);
      } else {
        // Online path — immediate settlement with balance deduction & ledger update
        const tx = await createOnlineTransaction({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          amount: parseFloat(amount),
          note,
          deviceId: device?.id || null,
        });
        setCreatedTx(tx);
        setStep(STEPS.SUCCESS);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Send Money</h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">Transfer to another user</p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* STEP 1: Select Receiver */}
        {step === STEPS.SELECT && (
          <Card>
            <CardHeader title="Select Receiver" />
            <Input
              id="receiver-search"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
            />
            <div className="space-y-2 mt-3">
              {filteredReceivers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectReceiver(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--color-gray-100)] hover:border-[var(--color-indigo-300)] hover:bg-indigo-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: user.avatarColor }}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-gray-800)]">{user.name}</p>
                    <p className="text-xs text-[var(--color-gray-400)] truncate">{user.email}</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-gray-300)] group-hover:text-[var(--color-indigo-500)]" />
                </button>
              ))}
              {filteredReceivers.length === 0 && (
                <p className="text-center text-sm text-[var(--color-gray-400)] py-4">No users found</p>
              )}
            </div>
          </Card>
        )}

        {/* STEP 2: Amount & Method */}
        {step === STEPS.AMOUNT && receiver && (
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: receiver.avatarColor }}>
                {receiver.avatar}
              </div>
              <div>
                <p className="font-bold text-[var(--color-gray-900)]">{receiver.name}</p>
                <p className="text-xs text-[var(--color-gray-400)]">{receiver.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                id="send-amount"
                label="Amount (NPR)"
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                placeholder="Enter amount"
                hint={`Available: ${formatCurrency(wallet?.availableBalance || 0)}`}
                leftIcon={<span className="text-xs font-bold">Rs.</span>}
                min="1"
              />

              <Input
                id="send-note"
                label="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Lunch payment"
                leftIcon={<FileText size={15} />}
              />

              {/* Payment method */}
              <div>
                <p className="text-xs font-bold text-[var(--color-gray-600)] uppercase tracking-wide mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'online'
                        ? 'border-[var(--color-indigo-500)] bg-indigo-50'
                        : 'border-[var(--color-gray-200)] hover:border-[var(--color-indigo-200)]'
                    }`}
                  >
                    <Wifi size={16} color={paymentMethod === 'online' ? 'var(--color-indigo-600)' : 'var(--color-gray-400)'} />
                    <p className="text-xs font-bold mt-1" style={{ color: paymentMethod === 'online' ? 'var(--color-indigo-700)' : 'var(--color-gray-600)' }}>Online</p>
                    <p className="text-[10px] text-[var(--color-gray-400)]">Instant settlement</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('offline')}
                    disabled={!authorization}
                    className={`p-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      paymentMethod === 'offline'
                        ? 'border-[var(--color-amber-500)] bg-amber-50'
                        : 'border-[var(--color-gray-200)] hover:border-[var(--color-amber-200)]'
                    }`}
                  >
                    <WifiOff size={16} color={paymentMethod === 'offline' ? 'var(--color-amber-600)' : 'var(--color-gray-400)'} />
                    <p className="text-xs font-bold mt-1" style={{ color: paymentMethod === 'offline' ? 'var(--color-amber-700)' : 'var(--color-gray-600)' }}>Offline QR</p>
                    <p className="text-[10px] text-[var(--color-gray-400)]">
                      {authorization ? `Limit: ${formatCurrency(authorization.remainingAmount)}` : 'No auth available'}
                    </p>
                  </button>
                </div>
              </div>

              {isOffline && paymentMethod === 'online' && (
                <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}>
                  ⚠ You're offline. Online payments require internet. Switch to Offline QR.
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl text-xs font-semibold" style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(STEPS.SELECT)}>Back</Button>
                <Button block variant="primary" onClick={handleAmountNext}>Review Payment</Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Confirm */}
        {step === STEPS.CONFIRM && receiver && (
          <Card>
            <CardHeader title="Confirm Payment" />
            <div className="space-y-3 mb-5">
              <ConfirmRow label="To" value={receiver.name} />
              <ConfirmRow label="Amount" value={formatCurrency(parseFloat(amount))} highlight />
              <ConfirmRow label="Method" value={
                <Badge status={paymentMethod === 'offline' ? 'OFFLINE_PENDING' : 'SETTLED'}>
                  {paymentMethod === 'offline' ? 'Offline QR' : 'Online'}
                </Badge>
              } />
              {note && <ConfirmRow label="Note" value={note} />}
              {paymentMethod === 'offline' && (
                <ConfirmRow label="Device" value={device?.id || '—'} mono />
              )}
            </div>

            {paymentMethod === 'offline' && (
              <div className="p-3 rounded-xl text-xs mb-4" style={{ background: 'rgba(99,102,241,0.06)' }}>
                <p className="font-semibold text-[var(--color-indigo-700)]">🔐 Cryptographic Signing</p>
                <p className="text-[var(--color-gray-500)] mt-0.5">
                  This transaction will be signed with your device's private key. The QR code will be generated for the receiver to scan and verify.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl text-xs font-semibold mb-3" style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(STEPS.AMOUNT)}>Back</Button>
              <Button
                block
                variant={paymentMethod === 'offline' ? 'primary' : 'primary'}
                loading={isProcessing}
                onClick={handleConfirm}
                leftIcon={paymentMethod === 'offline' ? <WifiOff size={15} /> : <ArrowUpRight size={15} />}
              >
                {paymentMethod === 'offline' ? 'Sign & Generate QR' : 'Send Money'}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: Success */}
        {step === STEPS.SUCCESS && createdTx && (
          <Card>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-emerald-100)' }}>
                <ArrowUpRight size={32} color="var(--color-emerald-600)" />
              </div>
              <h2 className="text-xl font-black text-[var(--color-gray-900)] mb-1">
                {createdTx.method === 'OFFLINE_QR' ? 'Transaction Signed!' : 'Payment Sent!'}
              </h2>
              <p className="text-sm text-[var(--color-gray-500)] mb-4">
                {createdTx.method === 'OFFLINE_QR'
                  ? 'Show the QR code to the receiver to complete the payment.'
                  : 'Your payment has been sent successfully.'}
              </p>

              <div className="text-2xl font-black text-[var(--color-emerald-600)] mb-4">
                {formatCurrency(createdTx.amount)}
              </div>

              <div className="space-y-2 text-left mb-5">
                <ConfirmRow label="To" value={createdTx.receiverName} />
                <ConfirmRow label="Status" value={<Badge status={createdTx.status} />} />
                <ConfirmRow label="TX ID" value={createdTx.id} mono />
              </div>

              <div className="flex gap-2 flex-col sm:flex-row">
                {createdTx.method === 'OFFLINE_QR' && (
                  <Button
                    block variant="primary"
                    onClick={() => navigate('/receive', { state: { tx: createdTx, mode: 'show_qr' } })}
                    leftIcon={<ArrowUpRight size={15} />}
                  >
                    Show QR Code
                  </Button>
                )}
                <Button block variant="outline" onClick={() => navigate('/transactions')}>
                  View Transactions
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StepIndicator({ current }) {
  const steps = [
    { key: STEPS.SELECT, label: 'Receiver' },
    { key: STEPS.AMOUNT, label: 'Amount' },
    { key: STEPS.CONFIRM, label: 'Confirm' },
    { key: STEPS.SUCCESS, label: 'Done' },
  ];
  const currentIndex = steps.findIndex(s => s.key === current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all"
              style={{
                background: i <= currentIndex ? 'var(--color-indigo-600)' : 'var(--color-gray-200)',
                color: i <= currentIndex ? 'white' : 'var(--color-gray-400)',
              }}
            >
              {i + 1}
            </div>
            <p className="text-[10px] mt-1 font-medium" style={{ color: i <= currentIndex ? 'var(--color-indigo-600)' : 'var(--color-gray-400)' }}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 mt-[-12px]"
              style={{ background: i < currentIndex ? 'var(--color-indigo-400)' : 'var(--color-gray-200)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ConfirmRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-gray-50)] last:border-0">
      <span className="text-xs text-[var(--color-gray-500)]">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[var(--color-emerald-600)]' : 'text-[var(--color-gray-700)]'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default SendMoney;
