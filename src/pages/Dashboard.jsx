import { useState } from 'react';
import {
  Shield, Clock, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw,
  Wifi, WifiOff, KeyRound, ExternalLink, Sparkles, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import PaymentActions from '../components/wallet/QuickActions';
import OfflineReadinessCard from '../components/wallet/OfflineReadinessCard';
import RecentTransactionsPreview from '../components/wallet/RecentTransactionsPreview';
import { Card } from '../components/ui/Card';
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
  const [deviceCopied, setDeviceCopied] = useState(false);

  const totalUnsynced = (pendingSyncCount || 0) + (retryWaitingCount || 0);

  // Time-aware greeting
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name?.split(' ')[0] || 'User';

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

  const handleCopyDeviceId = () => {
    if (device?.id) {
      navigator.clipboard.writeText(device.id);
      setDeviceCopied(true);
      setTimeout(() => setDeviceCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-7 animate-fade-in max-w-7xl mx-auto">
        {/* ─── 1. Header & Welcome Area ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {timeGreeting}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Welcome back, {firstName} 👋
            </h1>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Wallet Active
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Simulated Sandbox
            </span>
          </div>
        </div>

        {/* ─── 2. Responsive 2-Column Command Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ─── Left Main Column (7 cols on lg, 8 on xl) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Hero Balance Card */}
            {isInitialized ? (
              <BalanceCard wallet={wallet} isOffline={isOffline} />
            ) : (
              <div className="rounded-3xl p-8 bg-slate-900 border border-slate-800 animate-pulse h-64" />
            )}

            {/* Payment Actions Hub */}
            <section aria-label="Payment Actions Hub">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quick Payment Hub
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                    Fast Checkout
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {isOffline ? 'Offline Stored' : 'Online Reconciled'}
                </span>
              </div>
              <PaymentActions isOffline={isOffline} />
            </section>

            {/* Recent Activity Feed */}
            <section aria-label="Recent Transactions Activity">
              <RecentTransactionsPreview />
            </section>
          </div>

          {/* ─── Right Operational Sidebar (5 cols on lg, 4 on xl) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
            {/* 1. Offline Readiness & Capacity */}
            <OfflineReadinessCard
              device={device}
              authorization={authorization}
              isOffline={isOffline}
              onRegisterDevice={handleRegisterDevice}
              isRegistering={isRegistering}
            />

            {/* 2. Authoritative Ledger Sync Card */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    totalUnsynced > 0
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Server Reconciliation
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Ledger Sync
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {retryWaitingCount > 0 && (
                    <span className="badge badge-warning text-[10px]">
                      {retryWaitingCount} Retrying
                    </span>
                  )}
                  <span className={`badge ${totalUnsynced > 0 ? 'badge-pending' : 'badge-settled'} text-[10px]`}>
                    {totalUnsynced > 0 ? `${totalUnsynced} Pending` : 'Synchronized'}
                  </span>
                </div>
              </div>

              {/* Status explanation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs mb-4">
                {totalUnsynced > 0 ? (
                  <>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {pendingSyncCount > 0 && `${pendingSyncCount} payment${pendingSyncCount > 1 ? 's' : ''} waiting for network.`}
                      {retryWaitingCount > 0 && ` ${retryWaitingCount} payment${retryWaitingCount > 1 ? 's' : ''} in retry backoff queue.`}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Server verification and settlement will execute automatically once connection is confirmed.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      All local offline transactions are fully settled on the server ledger.
                    </p>
                  </div>
                )}

                {lastSyncTime && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    Last sync attempt: {formatRelativeTime(lastSyncTime)}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="space-y-2">
                <Button
                  size="sm"
                  block
                  variant={isOffline ? 'outline' : 'primary'}
                  loading={syncStatus === 'syncing'}
                  disabled={isOffline || totalUnsynced === 0}
                  onClick={handleSync}
                  leftIcon={<RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />}
                  id="btn-dashboard-sync"
                >
                  {isOffline
                    ? 'Offline — Connect to Reconcile'
                    : syncStatus === 'syncing'
                    ? 'Verifying with Server...'
                    : totalUnsynced > 0
                    ? `Reconcile ${totalUnsynced} Pending Item${totalUnsynced > 1 ? 's' : ''}`
                    : 'Ledger Up to Date'}
                </Button>

                {isOffline && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 text-center font-medium bg-amber-50 dark:bg-amber-950/40 py-1.5 px-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    Offline mode simulated. Go online to reconcile transactions.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Cryptographic Hardware Security Snapshot */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Security Engine
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Security Snapshot
                    </h3>
                  </div>
                </div>

                <Link
                  to="/security"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 no-underline"
                >
                  <span>Center</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Security parameters */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Device Public Key:</span>
                  <button
                    onClick={handleCopyDeviceId}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Click to copy full device ID"
                  >
                    <span>{device ? `${device.id.slice(0, 12)}...` : 'Unregistered'}</span>
                    {deviceCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Monotonic Counter:</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    #{device?.transactionCounter || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Anti-Replay Nonce:</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} /> Enforced
                  </span>
                </div>
              </div>

              {/* Latest Security Event */}
              {securityEvents.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Latest Security Audit
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="truncate font-medium">
                      {securityEvents[0]?.eventType ? securityEvents[0].eventType.replace(/_/g, ' ') : 'Security Audit Verified'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
