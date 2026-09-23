import { useState } from 'react';
import {
  Shield, Clock, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw,
  Wifi, WifiOff, KeyRound, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import PaymentActions from '../components/wallet/QuickActions';
import OfflineReadinessCard from '../components/wallet/OfflineReadinessCard';
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
    pendingSyncCount, retryWaitingCount, lastSyncTime, syncStatus, syncTransactions, isInitialized,
    registerDevice,
  } = useWallet();
  const { isOffline, isSimulating, toggleOfflineSimulation } = useOfflineSimulation();

  const [isRegistering, setIsRegistering] = useState(false);

  const totalUnsynced = (pendingSyncCount || 0) + (retryWaitingCount || 0);

  const handleSync = async () => {
    if (isOffline) return;
    try {
      await syncTransactions(currentUser);
    } catch (e) {
      console.error('[dashboard sync error]', e);
    }
  };

  const handleRegisterDevice = async () => {
    setIsRegistering(true);
    try {
      await registerDevice(currentUser.id);
    } catch (e) {
      console.error('[register device error]', e);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        {/* ─── 1. Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--color-gray-100)]">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-[var(--color-gray-500)] text-xs sm:text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Wallet Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Demo Account
            </span>
          </div>
        </div>

        {/* ─── 2. Main 2-Column Responsive Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ─── Left Primary Column (7 cols on lg, 8 on xl) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Balance Card */}
            {isInitialized ? (
              <BalanceCard wallet={wallet} isOffline={isOffline} />
            ) : (
              <div className="card-navy p-6 md:p-8 rounded-2xl animate-pulse">
                <div className="h-4 w-32 bg-white/20 rounded mb-3" />
                <div className="h-10 w-48 bg-white/20 rounded mb-4" />
                <div className="h-16 w-full bg-white/10 rounded-xl" />
              </div>
            )}

            {/* Payment Actions Hub */}
            <section aria-label="Payment Actions">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h2 className="text-xs font-bold text-[var(--color-gray-500)] uppercase tracking-wider">
                  Payment Hub
                </h2>
                <span className="text-[11px] text-[var(--color-gray-400)]">
                  {isOffline ? 'Offline Mode Active' : 'Online & Connected'}
                </span>
              </div>
              <PaymentActions isOffline={isOffline} />
            </section>

            {/* Recent Activity */}
            <section aria-label="Recent Transactions">
              <RecentTransactionsPreview />
            </section>
          </div>

          {/* ─── Right Operational Sidebar (5 cols on lg, 4 on xl) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Offline Readiness Card */}
            <OfflineReadinessCard
              device={device}
              authorization={authorization}
              isOffline={isOffline}
              onRegisterDevice={handleRegisterDevice}
              isRegistering={isRegistering}
            />

            {/* Synchronization & Queue Widget */}
            <Card padding className="border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${totalUnsynced > 0 ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-[var(--color-indigo-600)]'}`}>
                    <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Ledger Sync</h3>
                    <p className="text-[10px] text-[var(--color-gray-400)]">Authoritative reconciliation</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {retryWaitingCount > 0 && (
                    <span className="badge badge-warning text-[10px]" title="Retrying with backoff">
                      {retryWaitingCount} Retrying
                    </span>
                  )}
                  <span className={`badge ${totalUnsynced > 0 ? 'badge-pending' : 'badge-settled'} text-[10px]`}>
                    {totalUnsynced > 0 ? `${totalUnsynced} Pending` : 'Up to date'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-gray-500)] my-3 leading-relaxed space-y-1">
                {totalUnsynced > 0 ? (
                  <>
                    <p>
                      {pendingSyncCount > 0 && `${pendingSyncCount} payment${pendingSyncCount > 1 ? 's' : ''} waiting for internet connection.`}
                      {retryWaitingCount > 0 && ` ${retryWaitingCount} payment${retryWaitingCount > 1 ? 's' : ''} in retry backoff queue.`}
                    </p>
                    <p className="text-[11px] text-[var(--color-gray-400)]">
                      Authoritative server settlement occurs automatically once connection is confirmed.
                    </p>
                  </>
                ) : (
                  <p>All local payments and authorization records are synchronized and settled with the server.</p>
                )}
                {lastSyncTime && (
                  <p className="text-[10px] text-[var(--color-gray-400)] font-medium pt-1">
                    Last sync: {formatRelativeTime(lastSyncTime)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  size="sm"
                  block
                  variant={isOffline ? 'outline' : 'primary'}
                  loading={syncStatus === 'syncing'}
                  disabled={isOffline || totalUnsynced === 0}
                  onClick={handleSync}
                  leftIcon={<RefreshCw size={14} />}
                  id="btn-dashboard-sync"
                >
                  {isOffline
                    ? 'Offline — Reconnect to Sync'
                    : syncStatus === 'syncing'
                    ? 'Authorizing Server Settlement...'
                    : totalUnsynced > 0
                    ? `Sync ${totalUnsynced} Pending Item${totalUnsynced > 1 ? 's' : ''}`
                    : 'Ledger Synchronized'}
                </Button>

                {isOffline && (
                  <p className="text-[11px] text-amber-700 text-center font-medium bg-amber-50 py-1.5 px-2 rounded-lg border border-amber-200">
                    Offline mode simulated. Go online to reconcile transactions.
                  </p>
                )}
              </div>
            </Card>

            {/* Security Snapshot Card */}
            <Card padding className="border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Security Snapshot</h3>
                    <p className="text-[10px] text-[var(--color-gray-400)]">ECDSA P-256 Hardware Key</p>
                  </div>
                </div>

                <Link
                  to="/security"
                  className="text-xs font-semibold text-[var(--color-indigo-600)] hover:underline flex items-center gap-0.5 no-underline"
                >
                  Center <ExternalLink size={11} />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-100)]">
                  <span className="text-[var(--color-gray-500)]">Device Key:</span>
                  <span className="font-mono text-[11px] font-semibold text-[var(--color-gray-700)]">
                    {device ? `${device.id.slice(0, 10)}...` : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--color-gray-100)]">
                  <span className="text-[var(--color-gray-500)]">Tx Counter:</span>
                  <span className="font-mono text-[11px] font-bold text-[var(--color-gray-800)]">
                    #{device?.transactionCounter || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--color-gray-500)]">Anti-Replay Nonce:</span>
                  <span className="font-semibold text-emerald-600 text-[11px]">Enforced</span>
                </div>
              </div>

              {securityEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-gray-100)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-1.5">
                    Latest Security Event
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-[var(--color-gray-600)]">
                    <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{securityEvents[0].eventType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
