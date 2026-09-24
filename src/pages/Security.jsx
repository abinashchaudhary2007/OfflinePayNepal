/**
 * Security.jsx — Phase 10 (Security Center)
 * Shows live device status, authorization, security events, and system health.
 * Styled with UPI-inspired Nepali fintech design system:
 * Primary Navy (#172B75), Primary Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Key, Clock, RefreshCw, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Lock } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatRelativeTime, formatDateTime } from '../utils/formatting';

const SEVERITY_COLOR = {
  HIGH:   { bg: '#FDECEC', text: '#D64545', border: '#FACDCD' },
  MEDIUM: { bg: '#FFF6DD', text: '#B57F00', border: '#FCE7A6' },
  LOW:    { bg: '#EAF0FF', text: '#3155B8', border: '#DCE3F2' },
};

function Security() {
  const { currentUser } = useAuth();
  const { device, authorization, securityEvents, transactions, pendingSyncCount, syncStatus } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const lastSync = transactions.find(tx => tx.settledAt || tx.syncedAt);
  const highSeverityCount = securityEvents.filter(e => e.severity === 'HIGH').length;
  const blockedCount = securityEvents.filter(e => e.status === 'BLOCKED').length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#172033] tracking-tight">
            Security Center
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B85] mt-1">
            Hardware keys, device authorization & zero-trust ledger protection
          </p>
        </div>

        {/* 2-Column Responsive Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Status overview & Status grid & Lab */}
          <div className="lg:col-span-6 space-y-5">
            {/* Security Score / Summary */}
            <Card padding className="bg-white border border-[#DCE3F2]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    highSeverityCount > 0 ? 'bg-[#FDECEC] text-[#D64545]' : 'bg-[#E8F8F1] text-[#16A66A]'
                  }`}
                >
                  <Shield size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#8993A8] font-bold uppercase tracking-wider mb-0.5">
                    Security Configuration & Device Status
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-black ${
                      highSeverityCount > 0 ? 'text-[#D64545]' : 'text-[#16A66A]'
                    }`}
                  >
                    {highSeverityCount > 0 ? `${highSeverityCount} High Alert${highSeverityCount > 1 ? 's' : ''}` : 'Operational & Healthy'}
                  </p>
                  <p className="text-xs text-[#5F6B85] mt-0.5">
                    {securityEvents.length} security checks logged · {blockedCount} anomaly attempts prevented
                  </p>
                </div>
              </div>
            </Card>

            {/* Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SecurityStatusCard
                icon={<Smartphone size={18} />}
                label="Device"
                value={device?.status || 'Not registered'}
                status={device?.status === 'ACTIVE' ? 'ok' : 'warn'}
                link="/devices"
              />
              <SecurityStatusCard
                icon={<Key size={18} />}
                label="Key Pair"
                value={device?.publicKeyJwk ? 'ECDSA P-256' : 'No keys'}
                status={device?.publicKeyJwk ? 'ok' : 'warn'}
              />
              <SecurityStatusCard
                icon={<Shield size={18} />}
                label="Offline Auth"
                value={authorization?.status || 'None'}
                status={authorization?.status === 'ACTIVE' ? 'blue' : 'neutral'}
                link="/offline-authorization"
              />
              <SecurityStatusCard
                icon={<RefreshCw size={18} />}
                label="Last Sync"
                value={lastSync ? formatRelativeTime(lastSync.settledAt || lastSync.syncedAt) : 'Never'}
                status={pendingSyncCount > 0 ? 'warn' : 'ok'}
              />
              <SecurityStatusCard
                icon={<Clock size={18} />}
                label="Pending"
                value={`${pendingSyncCount} items`}
                status={pendingSyncCount > 0 ? 'warn' : 'ok'}
                link="/offline"
              />
              <SecurityStatusCard
                icon={<AlertTriangle size={18} />}
                label="Alerts"
                value={`${highSeverityCount} High`}
                status={highSeverityCount > 0 ? 'alert' : 'ok'}
              />
            </div>

            {/* Link to cybersecurity demo */}
            <Link
              to="/cybersecurity-demo"
              className="block p-5 rounded-2xl no-underline group hover:shadow-md transition-all border border-[#DCE3F2] bg-gradient-to-br from-white to-[#F5F7FF]"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#16A66A] animate-pulse" />
                    <p className="text-sm font-bold text-[#172033] tracking-wide">Interactive Security Lab</p>
                  </div>
                  <p className="text-xs text-[#5F6B85] max-w-sm">
                    Simulate replay attacks, signature tampering, and double-spending detection in real time.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2] flex items-center justify-center text-[#3155B8] group-hover:bg-[#3155B8] group-hover:text-white group-hover:scale-105 transition-all flex-shrink-0 ml-3">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          </div>

          {/* Right Column: Security Architecture & Event Log */}
          <div className="lg:col-span-6 space-y-5">
            {/* Security Architecture */}
            <Card padding className="bg-white border border-[#DCE3F2]">
              <CardHeader
                title="Cryptographic Architecture"
                subtitle="End-to-end asymmetric cryptography specifications"
              />
              <div className="space-y-2">
                {[
                  ['ECDSA P-256 Signatures', 'Every offline transaction is signed with your device\'s hardware-backed private key.'],
                  ['Non-Extractable CryptoKey', 'Private keys are stored in IndexedDB with extractable: false to prevent export or theft.'],
                  ['Replay Attack Prevention', 'Unique nonces, UUIDs, and strictly monotonic counters stop transaction replays.'],
                  ['24-Hour Authorization Window', 'Offline spending authorizations expire automatically after 24 hours.'],
                  ['Server Double-Spend Check', 'The central ledger verifies all sequence numbers and pending amounts upon reconnection.'],
                  ['Device Revocation List', 'Compromised devices can be instantly revoked and rejected during synchronization.'],
                ].map(([title, desc], i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#F5F7FF] transition-colors">
                    <CheckCircle2 size={15} className="text-[#16A66A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#172033]">{title}</p>
                      <p className="text-[11px] text-[#5F6B85] mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Security Events Log */}
            <Card padding className="bg-white border border-[#DCE3F2]">
              <CardHeader
                title="Security Event Log"
                subtitle="Live audit trail of cryptographic verification checks"
              />

              {securityEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 size={32} className="text-[#16A66A] mx-auto mb-2" />
                  <p className="text-sm text-[#5F6B85]">No security events recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {securityEvents.map(event => {
                    const colors = SEVERITY_COLOR[event.severity] || SEVERITY_COLOR.LOW;
                    return (
                      <div
                        key={event.id}
                        className="p-3 rounded-xl border transition-all"
                        style={{ background: colors.bg, borderColor: colors.border }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {event.status === 'BLOCKED'
                              ? <XCircle size={14} style={{ color: colors.text }} className="flex-shrink-0" />
                              : <CheckCircle2 size={14} className="text-[#16A66A] flex-shrink-0" />
                            }
                            <p className="text-xs font-bold truncate" style={{ color: colors.text }}>
                              {event.eventType.replace(/_/g, ' ')}
                            </p>
                          </div>
                          {/* Distinct tags with generous spacing */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                            >
                              {event.severity}
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#DCE3F2] bg-white text-[#5F6B85]"
                            >
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#172033] ml-5 leading-normal">{event.description}</p>
                        <p className="text-[10px] text-[#8993A8] ml-5 mt-1 font-mono">
                          {formatRelativeTime(event.createdAt)} · {event.deviceId}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SecurityStatusCard({ icon, label, value, status, link }) {
  const statusStyles = {
    ok:      { color: '#16A66A', bg: '#E8F8F1' },
    warn:    { color: '#B57F00', bg: '#FFF6DD' },
    alert:   { color: '#D64545', bg: '#FDECEC' },
    blue:    { color: '#3155B8', bg: '#EAF0FF' },
    neutral: { color: '#5F6B85', bg: '#F5F7FF' },
  };
  const s = statusStyles[status] || statusStyles.neutral;

  const content = (
    <div className="p-3.5 rounded-xl bg-white border border-[#DCE3F2] hover:border-[#3155B8]/40 hover:shadow-sm transition-all cursor-pointer">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}>
        <div style={{ color: s.color }}>{icon}</div>
      </div>
      <p className="text-[10px] text-[#8993A8] font-bold uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold mt-0.5 truncate" style={{ color: s.color }}>{value}</p>
    </div>
  );

  return link ? <Link to={link} className="no-underline">{content}</Link> : content;
}

export default Security;
