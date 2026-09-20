import { Shield, Clock, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import QuickActions from '../components/wallet/QuickActions';
import RecentTransactionsPreview from '../components/wallet/RecentTransactionsPreview';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatRelativeTime, formatCurrency } from '../utils/formatting';

function Dashboard() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, securityEvents,
    pendingSyncCount, syncStatus, syncTransactions, isInitialized,
    registerDevice,
  } = useWallet();
  const { isOffline, isSimulating } = useOfflineSimulation();

  const handleSync = async () => {
    if (isOffline) return;
    try { await syncTransactions(currentUser); } catch (e) { console.error(e); }
  };

  const handleRegisterDevice = async () => {
    try { await registerDevice(currentUser.id); } catch (e) { console.error(e); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* ─── Greeting ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
              Welcome back, {currentUser?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-[var(--color-gray-500)] text-xs sm:text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Wallet Active
            </span>
          </div>
        </div>

        {/* ─── Balance Card ─── */}
        {isInitialized ? (
          <BalanceCard wallet={wallet} isOffline={isOffline} />
        ) : (
          <div className="card-navy p-6 animate-pulse">
            <div className="h-4 w-32 bg-white/20 rounded mb-3" />
            <div className="h-10 w-48 bg-white/20 rounded" />
          </div>
        )}

        {/* ─── Quick Actions ─── */}
        <section>
          <h2 className="text-xs font-bold text-[var(--color-gray-500)] uppercase tracking-widest mb-2">
            Quick Actions
          </h2>
          <QuickActions isOffline={isOffline} />
        </section>

        {/* ─── No device warning ─── */}
        {isInitialized && !device && (
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--color-amber-300)', background: 'var(--color-amber-100)' }}
          >
            <div>
              <p className="text-sm font-bold text-[var(--color-amber-800)]">Device not registered</p>
              <p className="text-xs text-[var(--color-amber-600)] mt-0.5">Register your device to enable offline payments</p>
            </div>
            <Button size="sm" variant="primary" onClick={handleRegisterDevice}>
              Register
            </Button>
          </div>
        )}

        {/* ─── Status Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 stagger-children">
          <StatusCard
            title="Device Status"
            value={device?.status || 'Not registered'}
            badge={device?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
            icon={<Shield size={18} color="var(--color-indigo-600)" />}
          />
          <StatusCard
            title="Offline Auth"
            value={authorization?.status || 'None'}
            badge={authorization?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
            icon={<CheckCircle2 size={18} color="var(--color-emerald-600)" />}
            sub={authorization ? `Expires ${formatRelativeTime(authorization.expiresAt)}` : 'Get authorization first'}
          />
          <StatusCard
            title="Pending Sync"
            value={`${pendingSyncCount} item${pendingSyncCount !== 1 ? 's' : ''}`}
            badge={pendingSyncCount > 0 ? 'PENDING' : 'ACTIVE'}
            icon={<Clock size={18} color={pendingSyncCount > 0 ? 'var(--color-amber-600)' : 'var(--color-emerald-600)'} />}
            sub={pendingSyncCount > 0 ? 'Awaiting internet' : 'All synced'}
          />
          <StatusCard
            title="Security Events"
            value={`${securityEvents.length} events`}
            badge={securityEvents.some(e => e.severity === 'HIGH') ? 'REJECTED' : 'ACTIVE'}
            icon={<AlertTriangle size={18} color={securityEvents.some(e => e.severity === 'HIGH') ? 'var(--color-red-500)' : 'var(--color-emerald-600)'} />}
          />
        </div>

        {/* ─── Main content grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2">
            <RecentTransactionsPreview />
          </div>

          <div className="space-y-4">
            {/* Offline Authorization widget */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--color-gray-700)]">Offline Authorization</h3>
                {authorization
                  ? <Badge status="ACTIVE" />
                  : <Badge status="PENDING" />
                }
              </div>

              {authorization ? (
                <div className="space-y-2.5">
                  <InfoRow label="Max Limit"    value={formatCurrency(authorization.maximumAmount)} />
                  <InfoRow label="Remaining"    value={formatCurrency(authorization.remainingAmount)} highlight />
                  <InfoRow label="Max Per Tx"   value={formatCurrency(authorization.maxSingleTransaction)} />
                  <InfoRow label="Expires"      value={formatRelativeTime(authorization.expiresAt)} />
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'var(--color-gray-100)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(((authorization.maximumAmount - authorization.remainingAmount) / authorization.maximumAmount) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--color-emerald-500), var(--color-indigo-500))',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-gray-400)] mb-3">
                  No active authorization. {!device ? 'Register a device first.' : 'Get offline authorization to make payments without internet.'}
                </p>
              )}

              <Link to="/offline-authorization" className="btn btn-outline btn-sm btn-block mt-3 no-underline">
                {authorization ? 'Manage Authorization' : 'Get Offline Access'}
                <ArrowRight size={13} />
              </Link>
            </Card>

            {/* Sync widget */}
            {pendingSyncCount > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[var(--color-gray-700)]">Sync Pending</h3>
                  <span className="text-xs font-bold text-[var(--color-amber-600)]">{pendingSyncCount}</span>
                </div>
                <p className="text-xs text-[var(--color-gray-400)] mb-3">
                  {pendingSyncCount} transaction{pendingSyncCount !== 1 ? 's' : ''} waiting to sync with the server.
                </p>
                <Button
                  size="sm" block
                  variant={isOffline ? 'outline' : 'primary'}
                  loading={syncStatus === 'syncing'}
                  disabled={isOffline}
                  onClick={handleSync}
                  leftIcon={<RefreshCw size={13} />}
                >
                  {isOffline ? 'Offline — Cannot Sync' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </Button>
                {syncStatus === 'done' && (
                  <p className="text-xs text-[var(--color-emerald-600)] font-semibold text-center mt-2">
                    ✓ Sync complete
                  </p>
                )}
              </Card>
            )}

            {/* Recent security events */}
            {securityEvents.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[var(--color-gray-700)]">Security Events</h3>
                  <Link to="/security" className="text-xs text-[var(--color-indigo-600)] font-semibold no-underline hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {securityEvents.slice(0, 2).map(event => (
                    <div key={event.id} className="flex items-start gap-2 py-1.5 border-b border-[var(--color-gray-50)] last:border-0">
                      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5"
                        color={event.severity === 'HIGH' ? 'var(--color-red-500)' : 'var(--color-amber-500)'} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[var(--color-gray-700)] truncate">
                          {event.eventType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-[var(--color-gray-400)]">{formatRelativeTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusCard({ title, value, badge, icon, sub }) {
  return (
    <Card padding className="animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-gray-100)' }}>
          {icon}
        </div>
        <Badge status={badge} />
      </div>
      <p className="text-[10px] sm:text-xs text-[var(--color-gray-500)] font-medium">{title}</p>
      <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)] mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[10px] text-[var(--color-gray-400)] mt-0.5 leading-tight">{sub}</p>}
    </Card>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--color-gray-500)]">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[var(--color-emerald-600)]' : 'text-[var(--color-gray-700)]'}`}>
        {value}
      </span>
    </div>
  );
}

export default Dashboard;
