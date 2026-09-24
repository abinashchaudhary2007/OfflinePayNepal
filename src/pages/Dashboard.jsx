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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#263449]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#14B8A6]">
                {timeGreeting}
              </span>
              <span className="text-[#263449]">·</span>
              <span className="text-xs sm:text-sm font-medium text-[#94A3B8]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#F8FAFC] tracking-tight mt-1">
              Welcome back, {firstName} 👋
            </h1>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              Wallet Active
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#111C2E] text-[#94A3B8] border border-[#263449]">
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
              <div className="rounded-2xl p-8 bg-[#111C2E] border border-[#263449] animate-pulse h-64" />
            )}

            {/* Payment Actions Hub */}
            <section aria-label="Payment Actions Hub">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-[#94A3B8] uppercase tracking-wider">
                    Quick Payment Hub
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-bold">
                    Fast Checkout
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#94A3B8]">
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
            <div className="p-5 sm:p-6 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm hover:border-[#38BDF8]/40 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    totalUnsynced > 0
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                      : 'bg-[#38BDF8]/15 text-[#38BDF8]'
                  }`}>
                    <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      Server Reconciliation
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight">
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
              <div className="p-3.5 rounded-xl bg-[#172337] border border-[#263449] space-y-1.5 text-xs mb-4">
                {totalUnsynced > 0 ? (
                  <>
                    <p className="font-semibold text-[#F8FAFC]">
                      {pendingSyncCount > 0 && `${pendingSyncCount} payment${pendingSyncCount > 1 ? 's' : ''} waiting for network.`}
                      {retryWaitingCount > 0 && ` ${retryWaitingCount} payment${retryWaitingCount > 1 ? 's' : ''} in retry backoff queue.`}
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      Server verification and settlement will execute automatically once connection is confirmed.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                    <p className="text-[#94A3B8] font-medium">
                      All local offline transactions are fully settled on the server ledger.
                    </p>
                  </div>
                )}

                {lastSyncTime && (
                  <p className="text-[10px] text-[#94A3B8] font-medium pt-1 border-t border-[#263449]">
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
                  <p className="text-[11px] text-[#A78BFA] text-center font-medium bg-[#A78BFA]/10 py-1.5 px-2 rounded-xl border border-[#A78BFA]/30">
                    Offline mode simulated. Go online to reconcile transactions.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Cryptographic Hardware Security Snapshot */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm hover:border-[#14B8A6]/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#172337] border border-[#263449] text-[#14B8A6] flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      Security Engine
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight">
                      Security Snapshot
                    </h3>
                  </div>
                </div>

                <Link
                  to="/security"
                  className="text-xs font-bold text-[#38BDF8] hover:text-[#14B8A6] hover:underline flex items-center gap-1 no-underline transition-colors"
                >
                  <span>Center</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Security parameters */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#263449]">
                  <span className="text-[#94A3B8]">Device Public Key:</span>
                  <button
                    onClick={handleCopyDeviceId}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#F8FAFC] hover:text-[#14B8A6] transition-colors cursor-pointer"
                    title="Click to copy full device ID"
                  >
                    <span>{device ? `${device.id.slice(0, 12)}...` : 'Unregistered'}</span>
                    {deviceCopied ? <Check size={12} className="text-[#22C55E]" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#263449]">
                  <span className="text-[#94A3B8]">Monotonic Counter:</span>
                  <span className="font-mono text-xs font-bold text-[#14B8A6] px-2 py-0.5 rounded bg-[#172337] border border-[#263449]">
                    #{device?.transactionCounter || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#94A3B8]">Anti-Replay Nonce:</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22C55E]">
                    <CheckCircle2 size={13} /> Enforced
                  </span>
                </div>
              </div>

              {/* Latest Security Event */}
              {securityEvents.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-[#263449]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Latest Security Audit
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#172337] text-xs text-[#F8FAFC] border border-[#263449]">
                    <CheckCircle2 size={14} className="text-[#22C55E] shrink-0" />
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
