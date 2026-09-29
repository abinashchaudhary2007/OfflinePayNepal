/**
 * Security.jsx — Phase 10 (Security Center)
 * Shows live device status, authorization, protection features, and system health.
 * Styled with OfflinePay Nepali fintech design system:
 * Primary Navy (#172B75), Primary Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Smartphone, Key, RefreshCw,
  CheckCircle2, XCircle, ChevronRight, ShieldCheck,
  Trash2, Check
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatRelativeTime } from '../utils/formatting';

function formatEventTitle(type) {
  switch (type) {
    case 'DOUBLE_SPEND_ATTEMPT':
      return 'Offline Limit Guard';
    case 'ONLINE_PAYMENT_SETTLED':
      return 'Payment Settled';
    case 'OFFLINE_PAYMENT_EXPIRED':
      return 'Expired Voucher Refunded';
    case 'REPLAY_ATTEMPT':
      return 'Duplicate Token Blocked';
    case 'SIGNATURE_INVALID':
      return 'Invalid Signature Blocked';
    default:
      return type ? type.replace(/_/g, ' ') : 'Security Check';
  }
}

function formatEventDescription(event) {
  if (!event?.description) return 'Security verification logged.';
  // Double spend detected: pending Rs. 500 + new Rs. 34 > limit Rs. 400
  const match = event.description.match(/new Rs\.\s*([\d.]+)\s*>\s*limit Rs\.\s*([\d.]+)/i);
  if (match) {
    return `Payment of Rs. ${match[1]} blocked: exceeds safe limit of Rs. ${match[2]}.`;
  }
  // Offline payment TX-XXX for Rs. 500 expired...
  const expireMatch = event.description.match(/for Rs\.\s*([\d.]+)\s*expired/i);
  if (expireMatch) {
    return `Rs. ${expireMatch[1]} offline voucher expired and automatically refunded.`;
  }
  // Online transfer of Rs. 50 to Name settled
  const settledMatch = event.description.match(/transfer of Rs\.\s*([\d.]+)\s*to\s*([^.]+)\s*settled/i);
  if (settledMatch) {
    return `Rs. ${settledMatch[1]} transfer to ${settledMatch[2].trim()} settled.`;
  }
  return event.description;
}

function Security() {
  const { currentUser } = useAuth();
  const {
    device,
    authorization,
    securityEvents = [],
    transactions = [],
    pendingSyncCount = 0,
    clearAllSecurityEvents,
    refreshSecurityEvents,
  } = useWallet();

  const [isClearing, setIsClearing] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);

  const lastSync = transactions.find(tx => tx.settledAt || tx.syncedAt);
  const blockedCount = securityEvents.filter(e => e.status === 'BLOCKED').length;

  const handleClearLogs = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      if (clearAllSecurityEvents) {
        await clearAllSecurityEvents();
      }
      setClearedToast(true);
      setTimeout(() => setClearedToast(false), 2500);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <DashboardLayout maxWidth="max-w-5xl">
      <div className="w-full space-y-8 sm:space-y-9 animate-fade-in pb-12">
        {/* ─── Header & Status Pill ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DCE3F2]">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Security Center
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6B85]">
              Device authentication and offline payment safeguards
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#E8F8F1] text-[#16A66A] border border-[#BCECD7] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#16A66A] animate-pulse" />
              <span>Hardware Security Active</span>
            </span>
          </div>
        </div>

        {/* ─── Hero Overview Card ─── */}
        <div className="px-6 py-6 sm:px-8 sm:py-7 rounded-2xl bg-white border border-[#DCE3F2] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs bg-[#E8F8F1] text-[#16A66A] border border-[#BCECD7]">
                <ShieldCheck size={28} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                  All Systems Protected
                </h2>
                <p className="text-xs sm:text-sm text-[#5F6B85] leading-relaxed">
                  {blockedCount > 0
                    ? `${blockedCount} unauthorized anomaly attempt${blockedCount > 1 ? 's were' : ' was'} safely intercepted by offline safety limits.`
                    : 'Your device keys and offline limits are actively safeguarding your balance.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => refreshSecurityEvents && refreshSecurityEvents()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#3155B8] bg-[#EAF0FF] hover:bg-[#D6E3FF] border border-[#DCE3F2] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              title="Refresh security status"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ─── 4 Clean Status Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5.5 sm:gap-6">
          <SecurityStatusCard
            icon={<Smartphone size={18} />}
            label="Linked Device"
            value={device?.status === 'ACTIVE' ? 'Active & Paired' : (device?.status || 'Not Paired')}
            status={device?.status === 'ACTIVE' ? 'ok' : 'warn'}
            link="/devices"
          />
          <SecurityStatusCard
            icon={<Key size={18} />}
            label="Security Key"
            value={device?.publicKeyJwk ? 'Hardware Sealed' : 'None'}
            status={device?.publicKeyJwk ? 'ok' : 'warn'}
          />
          <SecurityStatusCard
            icon={<Shield size={18} />}
            label="Offline Limit"
            value={authorization?.status === 'ACTIVE' ? '24h Limit Active' : 'Not Active'}
            status={authorization?.status === 'ACTIVE' ? 'blue' : 'neutral'}
            link="/offline-authorization"
          />
          <SecurityStatusCard
            icon={<ShieldCheck size={18} />}
            label="Threats Blocked"
            value={`${blockedCount} Stopped`}
            status="ok"
          />
        </div>

        {/* ─── 2-Column Responsive Layout ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-9 items-start">
          {/* Column 1: Built-in Payment Protections */}
          <div className="xl:col-span-6 space-y-5">
            <div className="px-6 py-6 sm:px-8 sm:py-7 rounded-2xl bg-white border border-[#DCE3F2] shadow-2xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F1F4F9]">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                    Built-in Offline Protections
                  </h3>
                  <p className="text-xs text-[#5F6B85]">
                    How your money stays secure without internet access
                  </p>
                </div>
                <button
                  onClick={() => setShowTechnicalSpecs(p => !p)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md text-[#3155B8] hover:bg-[#EAF0FF] transition-colors cursor-pointer shrink-0 ml-2"
                >
                  {showTechnicalSpecs ? 'Simple' : 'Tech Specs'}
                </button>
              </div>

              <div className="space-y-4.5 sm:space-y-5">
                {[
                  [
                    'Hardware-Sealed Device Key',
                    'Payments are signed with your device\'s secure private key.',
                    'ECDSA P-256 with SHA-256 over canonical JSON payloads.'
                  ],
                  [
                    'Isolated Local Storage',
                    'Cryptographic keys cannot be exported, copied, or stolen.',
                    'Web Crypto API CryptoKey with extractable: false in IndexedDB.'
                  ],
                  [
                    'Anti-Replay Defense',
                    'Single-use security nonces stop duplicate charges.',
                    'UUIDv4 nonces, monotonic sequence counters, and nonce registry.'
                  ],
                  [
                    '24-Hour Safety Allowance',
                    'Offline authorizations expire daily to safeguard lost devices.',
                    'Server-signed time-bounded offline capability token (24h TTL).'
                  ],
                  [
                    'Automated Double-Spend Check',
                    'Ledger verifies balance sequence deductions upon reconnection.',
                    'Atomic multi-table SQLite transactions with replay rejection.'
                  ],
                  [
                    'Instant Device Revocation',
                    'Instantly revoke lost devices to freeze offline payments.',
                    'Server-side device revocation list with instant sync rejection.'
                  ],
                ].map(([title, desc, techSpec], i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4.5 sm:gap-5 px-5 py-4 sm:px-5.5 sm:py-4.5 rounded-xl bg-[#F8FAFD] hover:bg-[#F0F4FC] transition-colors border border-[#E2E8F0]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E8F8F1] text-[#16A66A] flex items-center justify-center shrink-0 mt-0.5 border border-[#BCECD7]">
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-xs sm:text-[13px] font-bold text-[#172033]">{title}</p>
                      <p className="text-xs text-[#5F6B85] leading-relaxed">
                        {showTechnicalSpecs ? techSpec : desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Protection & Security Activity Log */}
          <div className="xl:col-span-6 space-y-5">
            <div className="px-6 py-6 sm:px-8 sm:py-7 rounded-2xl bg-white border border-[#DCE3F2] shadow-2xs">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F1F4F9]">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                    Security & Activity Log
                  </h3>
                  <p className="text-xs text-[#5F6B85]">
                    Live record of verifications and prevented anomalies
                  </p>
                </div>

                {securityEvents.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    disabled={isClearing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#5F6B85] hover:text-[#D64545] hover:bg-[#FDECEC] border border-[#DCE3F2] transition-colors cursor-pointer shrink-0"
                    title="Clear activity log"
                  >
                    <Trash2 size={12} />
                    <span>{isClearing ? 'Clearing...' : 'Clear Log'}</span>
                  </button>
                )}
              </div>

              {clearedToast && (
                <div className="mb-4 p-3.5 rounded-xl bg-[#E8F8F1] border border-[#BCECD7] text-[#16A66A] text-xs font-semibold flex items-center gap-2">
                  <Check size={13} />
                  <span>Activity log cleared.</span>
                </div>
              )}

              {securityEvents.length === 0 ? (
                <div className="py-14 text-center space-y-2.5">
                  <div className="w-11 h-11 rounded-xl bg-[#E8F8F1] text-[#16A66A] flex items-center justify-center mx-auto border border-[#BCECD7]">
                    <CheckCircle2 size={22} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#172033]">All Clear · No Warnings</p>
                  <p className="text-xs text-[#5F6B85] max-w-xs mx-auto leading-relaxed">
                    No security events or anomalies have been detected on this device.
                  </p>
                </div>
              ) : (
                <div className="space-y-4.5 max-h-[460px] overflow-y-auto pr-2">
                  {securityEvents.map(event => {
                    const isBlocked = event.status === 'BLOCKED';
                    return (
                      <div
                        key={event.id}
                        className={`px-5 py-4.5 sm:px-5.5 sm:py-5 rounded-xl border transition-all ${
                          isBlocked
                            ? 'bg-[#FEF9F9] border-[#FACDCD]'
                            : 'bg-[#F8FAFD] border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {isBlocked ? (
                              <XCircle size={16} className="text-[#D64545] shrink-0" />
                            ) : (
                              <CheckCircle2 size={16} className="text-[#16A66A] shrink-0" />
                            )}
                            <p className="text-xs sm:text-[13px] font-bold text-[#172033] truncate">
                              {formatEventTitle(event.eventType)}
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${
                              isBlocked
                                ? 'bg-[#E8F8F1] text-[#16A66A] border-[#BCECD7]'
                                : 'bg-[#EAF0FF] text-[#3155B8] border-[#BAC6E0]'
                            }`}
                          >
                            {isBlocked ? 'Safely Blocked' : 'Verified'}
                          </span>
                        </div>

                        {/* Clean, simplified description without debug noise */}
                        <p className="text-xs text-[#444E66] leading-relaxed mb-3 ml-7">
                          {formatEventDescription(event)}
                        </p>

                        {/* Clean timestamp */}
                        <p className="text-[11px] text-[#8993A8] ml-7">
                          {formatRelativeTime(event.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Banner: Interactive Security Lab ─── */}
        <Link
          to="/cybersecurity-demo"
          className="block px-7 py-5.5 sm:px-8 sm:py-6 rounded-2xl no-underline group hover:shadow-xs transition-all border border-[#DCE3F2] bg-gradient-to-r from-white via-white to-[#F5F7FF]"
        >
          <div className="flex items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A66A] animate-pulse" />
                <p className="text-xs sm:text-sm font-bold text-[#172033] tracking-tight">
                  Interactive Security Simulation Lab
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EAF0FF] text-[#3155B8] border border-[#DCE3F2]">
                  Demo
                </span>
              </div>
              <p className="text-xs text-[#5F6B85] max-w-xl leading-relaxed">
                Test replay attacks, signature tampering, and double-spending detection in a real-time simulator.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2] flex items-center justify-center text-[#3155B8] group-hover:bg-[#3155B8] group-hover:text-white transition-all shrink-0">
              <ChevronRight size={18} />
            </div>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function SecurityStatusCard({ icon, label, value, status, link }) {
  const statusStyles = {
    ok:      { color: '#16A66A', bg: '#E8F8F1', border: '#BCECD7' },
    warn:    { color: '#B57F00', bg: '#FFF6DD', border: '#FCE7A6' },
    alert:   { color: '#D64545', bg: '#FDECEC', border: '#FACDCD' },
    blue:    { color: '#3155B8', bg: '#EAF0FF', border: '#BAC6E0' },
    neutral: { color: '#5F6B85', bg: '#F5F7FF', border: '#DCE3F2' },
  };
  const s = statusStyles[status] || statusStyles.neutral;

  const content = (
    <div className="px-5 py-4.5 sm:px-6 sm:py-5 rounded-2xl bg-white border border-[#DCE3F2] hover:border-[#3155B8]/40 hover:shadow-2xs transition-all cursor-pointer h-full min-h-[106px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: s.bg, borderColor: s.border }}
        >
          <div style={{ color: s.color }}>{icon}</div>
        </div>
        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] sm:text-[11px] text-[#8993A8] font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xs sm:text-[13px] font-bold leading-snug truncate" style={{ color: s.color }}>
          {value}
        </p>
      </div>
    </div>
  );

  return link ? <Link to={link} className="no-underline block h-full">{content}</Link> : content;
}

export default Security;


