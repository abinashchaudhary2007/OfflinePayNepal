/**
 * OfflineAuthorization.jsx — Phase 4
 * Allows users to request, view, and manage their offline spending authorization.
 * Styled with OfflinePay Nepali fintech design system:
 * Deep Navy (#172B75), Royal Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useState } from 'react';
import { Shield, Wifi, WifiOff, Clock, CheckCircle2, AlertTriangle, Key, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatDateTime, formatRelativeTime, calcPercentage } from '../utils/formatting';

function OfflineAuthorization() {
  const { currentUser } = useAuth();
  const { wallet, device, authorization, createOfflineAuthorization } = useWallet();
  const { isOffline } = useOfflineSimulation();
  const { isDark } = useTheme();

  const [amount, setAmount] = useState('1000');
  const [maxSingle, setMaxSingle] = useState('500');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCreate = async () => {
    setCreateError('');
    setCreateSuccess(false);
    const numAmount = parseFloat(amount);
    const numMax = parseFloat(maxSingle);

    if (!numAmount || numAmount <= 0) { setCreateError('Enter a valid amount.'); return; }
    if (numAmount > 10000) { setCreateError('Maximum offline limit is Rs. 10,000.'); return; }
    if (!numMax || numMax <= 0 || numMax > numAmount) { setCreateError('Max per transaction must be > 0 and ≤ total limit.'); return; }
    if (!device) { setCreateError('You must register a device first.'); return; }
    if (!wallet || wallet.availableBalance < numAmount) { setCreateError('Insufficient balance for this authorization.'); return; }

    setIsCreating(true);
    try {
      await createOfflineAuthorization(currentUser.id, device.id, numAmount, numMax);
      setCreateSuccess(true);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const usedPercent = authorization
    ? calcPercentage(authorization.maximumAmount - authorization.remainingAmount, authorization.maximumAmount)
    : 0;

  return (
    <DashboardLayout maxWidth="max-w-5xl">
      <div className="w-full space-y-8 animate-fade-in pb-16">
        {/* Top Header */}
        <div
          className="border-b pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
        >
          <div>
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
              >
                <Key size={22} />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Offline Authorization
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Pre-authorize cryptographic spending allowances on this hardware node.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-xs"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F0FDF4',
                color: isDark ? '#4ADE80' : '#166534',
                borderColor: isDark ? 'var(--border-color)' : '#BBF7D0'
              }}
            >
              <ShieldCheck size={14} className="text-[#16A66A]" />
              ECDSA P-256 Armed
            </span>
          </div>
        </div>

        {/* Info callout */}
        <div
          className="rounded-2xl text-xs sm:text-sm flex items-center gap-4 border shadow-xs"
          style={{
            padding: '20px 24px',
            background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
            borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
            color: isDark ? '#FFFFFF' : '#172B75',
            borderRadius: '18px',
          }}
        >
          <Shield size={22} className="text-[#3155B8] flex-shrink-0" />
          <span className="font-medium leading-relaxed">
            Set an offline reserve limit while connected. Authorizations are signed locally by your hardware key and valid for 30 rolling days.
          </span>
        </div>

        {/* Device check */}
        {!device && (
          <div
            className="rounded-2xl border space-y-2 shadow-xs"
            style={{
              padding: '24px 28px',
              background: isDark ? 'var(--bg-elevated)' : '#FFF6DD',
              borderColor: isDark ? 'var(--border-color)' : '#FCE7A6',
              borderRadius: '20px',
            }}
          >
            <p className="text-sm font-bold text-[#B57F00] flex items-center gap-2">
              <AlertTriangle size={16} /> Device Registration Required
            </p>
            <p className="text-xs sm:text-sm text-[#5F6B85] leading-relaxed">
              You need to register this device before creating an offline authorization token.
              Visit <a href="/devices" className="text-[#3155B8] underline font-bold">Device Management</a> to register with one click.
            </p>
          </div>
        )}

        {/* Current Authorization Card */}
        {authorization && (
          <div
            className="rounded-3xl border shadow-sm space-y-7"
            style={{
              padding: '30px 32px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              borderRadius: '24px',
            }}
          >
            <div className="border-b pb-4" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
              <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Current Authorization Token
              </h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Active cryptographic spending allowance reserved on this device.
              </p>
            </div>

            {/* Total vs Remaining Metric Cards with Guaranteed Deep Padding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className="border rounded-2xl flex flex-col justify-between"
                style={{
                  padding: '28px 30px',
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  borderRadius: '20px',
                  minHeight: '140px',
                }}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    TOTAL AUTHORIZED LIMIT
                  </p>
                  <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)', margin: '6px 0' }}>
                    {formatCurrency(authorization.maximumAmount)}
                  </p>
                </div>
                <p className="text-xs text-[#8993A8]" style={{ marginTop: '10px' }}>Original offline reserve cap</p>
              </div>

              <div
                className="border rounded-2xl flex flex-col justify-between"
                style={{
                  padding: '28px 30px',
                  background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                  borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
                  borderRadius: '20px',
                  minHeight: '140px',
                }}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#3155B8]" style={{ marginBottom: '8px' }}>
                    REMAINING OFFLINE ALLOWANCE
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-[#3155B8]" style={{ margin: '6px 0' }}>
                    {formatCurrency(authorization.remainingAmount)}
                  </p>
                </div>
                <p className="text-xs text-[#5F6B85]" style={{ marginTop: '10px' }}>Spendable without network access</p>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div
              className="border rounded-2xl space-y-4"
              style={{
                padding: '22px 26px',
                background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                borderRadius: '18px',
              }}
            >
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Used: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(authorization.maximumAmount - authorization.remainingAmount)}</strong>
                </span>
                <span className="font-extrabold text-[#3155B8]">{usedPercent}% Utilized</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(usedPercent, 3)}%`,
                    background: usedPercent > 80
                      ? 'linear-gradient(90deg, #F2A900 0%, #D64545 100%)'
                      : 'linear-gradient(90deg, #172B75 0%, #3155B8 100%)',
                  }}
                />
              </div>
            </div>

            {/* Parameter Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm pt-2">
              <InfoBox label="MAX SINGLE TX" value={formatCurrency(authorization.maxSingleTransaction)} isDark={isDark} />
              <InfoBox label="AUTH STATUS" value={<Badge status={authorization.status} />} isDark={isDark} />
              <InfoBox label="ISSUED AT" value={formatDateTime(authorization.issuedAt)} isDark={isDark} />
              <InfoBox label="EXPIRES" value={formatRelativeTime(authorization.expiresAt)} isDark={isDark} />
            </div>

            {/* Expiry warning */}
            {new Date(authorization.expiresAt) - new Date() < 3 * 60 * 60 * 1000 && (
              <div
                className="flex items-center gap-3 rounded-2xl text-xs sm:text-sm font-semibold border"
                style={{
                  padding: '18px 24px',
                  background: '#FFF6DD',
                  color: '#B57F00',
                  borderColor: '#F2A900/30',
                  borderRadius: '16px',
                }}
              >
                <Clock size={18} />
                <span>Authorization token expires {formatRelativeTime(authorization.expiresAt)} — please renew while online.</span>
              </div>
            )}
          </div>
        )}

        {/* Create / Renew Authorization Form */}
        {device && (
          <div
            className="border shadow-sm space-y-7"
            style={{
              padding: '30px 32px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              borderRadius: '24px',
            }}
          >
            <div className="border-b pb-4" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
              <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {authorization ? 'Renew or Adjust Offline Limits' : 'Initialize Offline Spending Authorization'}
              </h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Set spending ceilings locked with your device's asymmetric key.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Input
                  id="auth-amount"
                  label="Offline Spending Limit (NPR)"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  hint={`Available Online Balance: ${formatCurrency(wallet?.availableBalance || 0)}`}
                  placeholder="1000"
                  min="1"
                  max="10000"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="auth-max-single"
                  label="Max Per Single Transaction (NPR)"
                  type="number"
                  value={maxSingle}
                  onChange={e => setMaxSingle(e.target.value)}
                  hint="Maximum amount allowed for any single offline QR payment voucher."
                  placeholder="500"
                  min="1"
                />
              </div>

              {createError && (
                <div
                  className="rounded-2xl text-xs sm:text-sm font-semibold border"
                  style={{
                    padding: '16px 20px',
                    background: '#FDECEC',
                    borderColor: 'rgba(214, 69, 69, 0.3)',
                    color: '#D64545',
                    borderRadius: '16px',
                  }}
                >
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div
                  className="rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border"
                  style={{
                    padding: '16px 20px',
                    background: '#E8F8F1',
                    borderColor: 'rgba(22, 166, 106, 0.3)',
                    color: '#16A66A',
                    borderRadius: '16px',
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>Authorization committed successfully! Valid for 30 days of offline peer-to-peer spending.</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  disabled={isOffline || !device || isCreating}
                  onClick={handleCreate}
                  className="w-full font-bold text-sm sm:text-base text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    padding: '16px 28px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  }}
                >
                  <Shield size={18} />
                  <span>{isOffline ? 'Must be Online to Authorize' : (authorization ? 'Update Offline Authorization' : 'Authorize Device Now')}</span>
                </button>
              </div>

              {isOffline && (
                <p className="text-xs text-center text-[#B57F00] font-medium pt-1">
                  ⚠ You must be online to request or adjust offline authorization tokens.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoBox({ label, value, isDark }) {
  return (
    <div
      className="border flex flex-col justify-between"
      style={{
        padding: '20px 22px',
        background: isDark ? 'var(--bg-elevated)' : '#F8FAFF',
        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
        borderRadius: '16px',
        minHeight: '86px',
      }}
    >
      <p className="text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</p>
      <div className="text-xs sm:text-sm font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

export default OfflineAuthorization;
