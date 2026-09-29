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
    <DashboardLayout maxWidth="max-w-4xl">
      <div className="w-full space-y-7 sm:space-y-8 animate-fade-in pb-12">
        {/* Top Header */}
        <div
          className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
              >
                <Key size={18} />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Offline Authorization
                </h1>
                <p className="text-xs text-[#5F6B85]">
                  Pre-authorize an offline spending reserve for payments when disconnected.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F0FDF4',
                color: isDark ? '#4ADE80' : '#166534',
                borderColor: isDark ? 'var(--border-color)' : '#BBF7D0'
              }}
            >
              <ShieldCheck size={13} className="text-[#16A66A]" />
              Hardware Protected
            </span>
          </div>
        </div>

        {/* Info callout */}
        <div
          className="rounded-xl text-xs sm:text-[13px] flex items-center gap-3.5 border shadow-2xs"
          style={{
            padding: '14px 18px',
            background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
            borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
            color: isDark ? '#FFFFFF' : '#172B75',
          }}
        >
          <Shield size={18} className="text-[#3155B8] flex-shrink-0" />
          <span className="font-medium leading-relaxed">
            Set an offline reserve limit while connected. Authorizations are signed locally by your device key and valid for 30 rolling days.
          </span>
        </div>

        {/* Device check */}
        {!device && (
          <div
            className="rounded-xl border space-y-1.5 shadow-2xs"
            style={{
              padding: '16px 20px',
              background: isDark ? 'var(--bg-elevated)' : '#FFF6DD',
              borderColor: isDark ? 'var(--border-color)' : '#FCE7A6',
            }}
          >
            <p className="text-xs sm:text-sm font-bold text-[#B57F00] flex items-center gap-1.5">
              <AlertTriangle size={15} /> Device Registration Required
            </p>
            <p className="text-xs text-[#5F6B85] leading-relaxed">
              You need to register this device before creating an offline authorization token.
              Visit <a href="/devices" className="text-[#3155B8] underline font-bold">Device Management</a> to register with one click.
            </p>
          </div>
        )}

        {/* Current Authorization Card */}
        {authorization && (
          <div
            className="rounded-2xl border shadow-2xs space-y-6"
            style={{
              padding: '24px 26px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div className="border-b pb-3.5" style={{ borderColor: isDark ? 'var(--border-color)' : '#F1F4F9' }}>
              <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Current Authorization Token
              </h2>
              <p className="text-xs text-[#5F6B85] mt-1">
                Active offline spending allowance reserved on this device.
              </p>
            </div>

            {/* Total vs Remaining Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 sm:gap-5">
              <div
                className="border rounded-xl flex flex-col justify-between"
                style={{
                  padding: '18px 22px',
                  background: isDark ? 'var(--bg-elevated)' : '#F8FAFD',
                  borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                }}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8993A8] mb-1">
                    TOTAL AUTHORIZED LIMIT
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-[#172033] my-0.5">
                    {formatCurrency(authorization.maximumAmount)}
                  </p>
                </div>
                <p className="text-[11px] text-[#8993A8] mt-2">Original offline reserve cap</p>
              </div>

              <div
                className="border rounded-xl flex flex-col justify-between"
                style={{
                  padding: '18px 22px',
                  background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                  borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
                }}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#3155B8] mb-1">
                    REMAINING OFFLINE ALLOWANCE
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-[#3155B8] my-0.5">
                    {formatCurrency(authorization.remainingAmount)}
                  </p>
                </div>
                <p className="text-[11px] text-[#5F6B85] mt-2">Spendable without network access</p>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div
              className="border rounded-xl space-y-3"
              style={{
                padding: '16px 20px',
                background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                borderColor: isDark ? 'var(--border-color)' : '#E9EFFD',
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#5F6B85]">
                  Used: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(authorization.maximumAmount - authorization.remainingAmount)}</strong>
                </span>
                <span className="font-bold text-[#3155B8]">{usedPercent}% Utilized</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/60 p-0.5">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
              <InfoBox label="MAX SINGLE TX" value={formatCurrency(authorization.maxSingleTransaction)} isDark={isDark} />
              <InfoBox label="AUTH STATUS" value={<Badge status={authorization.status} />} isDark={isDark} />
              <InfoBox label="ISSUED AT" value={formatDateTime(authorization.issuedAt)} isDark={isDark} />
              <InfoBox label="EXPIRES" value={formatRelativeTime(authorization.expiresAt)} isDark={isDark} />
            </div>

            {/* Expiry warning */}
            {new Date(authorization.expiresAt) - new Date() < 3 * 60 * 60 * 1000 && (
              <div
                className="flex items-center gap-2.5 rounded-xl text-xs font-semibold border"
                style={{
                  padding: '12px 16px',
                  background: '#FFF6DD',
                  color: '#B57F00',
                  borderColor: '#F2A900/30',
                }}
              >
                <Clock size={16} />
                <span>Authorization token expires {formatRelativeTime(authorization.expiresAt)} — please renew while online.</span>
              </div>
            )}
          </div>
        )}

        {/* Create / Renew Authorization Form */}
        {device && (
          <div
            className="rounded-2xl border shadow-2xs space-y-5"
            style={{
              padding: '22px 24px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: isDark ? 'var(--border-color)' : '#F1F4F9' }}>
              <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {authorization ? 'Renew or Adjust Offline Limits' : 'Initialize Offline Spending Authorization'}
              </h2>
              <p className="text-xs text-[#5F6B85] mt-0.5">
                Set spending ceilings secured with your registered device key.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
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
                  className="rounded-xl text-xs font-semibold border"
                  style={{
                    padding: '12px 16px',
                    background: '#FDECEC',
                    borderColor: 'rgba(214, 69, 69, 0.3)',
                    color: '#D64545',
                  }}
                >
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div
                  className="rounded-xl text-xs font-semibold flex items-center gap-2.5 border"
                  style={{
                    padding: '12px 16px',
                    background: '#E8F8F1',
                    borderColor: 'rgba(22, 166, 106, 0.3)',
                    color: '#16A66A',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Authorization committed successfully! Valid for 30 days of offline peer-to-peer spending.</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  disabled={isOffline || !device || isCreating}
                  onClick={handleCreate}
                  className="w-full font-bold text-xs sm:text-sm text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  }}
                >
                  <Shield size={16} />
                  <span>{isOffline ? 'Must be Online to Authorize' : (authorization ? 'Update Offline Authorization' : 'Authorize Device Now')}</span>
                </button>
              </div>

              {isOffline && (
                <p className="text-[11px] text-center text-[#B57F00] font-medium pt-0.5">
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
      className="border rounded-xl flex flex-col justify-between"
      style={{
        padding: '12px 14px',
        background: isDark ? 'var(--bg-elevated)' : '#F8FAFD',
        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
        minHeight: '64px',
      }}
    >
      <p className="text-[10px] uppercase font-bold tracking-wider text-[#8993A8] mb-1">{label}</p>
      <div className="text-xs sm:text-[13px] font-bold text-[#172033]">{value}</div>
    </div>
  );
}

export default OfflineAuthorization;
