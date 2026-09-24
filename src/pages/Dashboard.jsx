import { useState, useMemo } from 'react';
import {
  Shield, CheckCircle2, RefreshCw,
  WifiOff, ExternalLink, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import PaymentActions from '../components/wallet/QuickActions';
import OfflineReadinessCard from '../components/wallet/OfflineReadinessCard';
import RecentTransactionsPreview from '../components/wallet/RecentTransactionsPreview';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';

function Dashboard() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, transactions,
    pendingSyncCount, retryWaitingCount, lastSyncTime, syncStatus, syncTransactions, isInitialized,
    registerDevice,
  } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceCopied, setDeviceCopied] = useState(false);

  const totalUnsynced = (pendingSyncCount || 0) + (retryWaitingCount || 0);
  const firstName = currentUser?.name?.split(' ')[0] || 'User';

  // Harmonized wallet metrics from live transactions
  const totalSent = useMemo(() => (
    (transactions || [])
      .filter(tx => tx.senderId === currentUser?.id && tx.status === 'SETTLED')
      .reduce((s, tx) => s + tx.amount, 0)
  ), [transactions, currentUser?.id]);

  const totalReceived = useMemo(() => (
    (transactions || [])
      .filter(tx => tx.receiverId === currentUser?.id && tx.status === 'SETTLED')
      .reduce((s, tx) => s + tx.amount, 0)
  ), [transactions, currentUser?.id]);

  const harmonizedWallet = wallet ? {
    ...wallet,
    totalSent,
    totalReceived,
  } : null;

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
      <div className="space-y-5 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
        {/* ─── 1. Header: Clean Fintech Welcome ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}Offline spending ready
            </p>
          </div>

          {/* Clean Unified Status Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
                <WifiOff size={13} />
                Offline Mode
              </span>
            ) : totalUnsynced > 0 ? (
              <button
                onClick={handleSync}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 transition-colors cursor-pointer"
                title="Click to reconcile transactions"
              >
                <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                {totalUnsynced} Pending Sync
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                All Systems Synced
              </span>
            )}
          </div>
        </div>

        {/* ─── 2. Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ─── Left Main Column (8 cols on lg) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* Hero Balance Card */}
            {isInitialized ? (
              <BalanceCard wallet={harmonizedWallet} isOffline={isOffline} />
            ) : (
              <div className="rounded-2xl p-8 bg-[#111C2E] border border-[#263449] animate-pulse h-56" />
            )}

            {/* Quick Action Bar */}
            <PaymentActions isOffline={isOffline} />

            {/* Recent Activity */}
            <RecentTransactionsPreview />
          </div>

          {/* ─── Right Operational Sidebar (4 cols on lg) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* 1. Offline Readiness & Ledger Sync */}
            <OfflineReadinessCard
              device={device}
              authorization={authorization}
              isOffline={isOffline}
              onRegisterDevice={handleRegisterDevice}
              isRegistering={isRegistering}
              totalUnsynced={totalUnsynced}
              syncStatus={syncStatus}
              onSync={handleSync}
              lastSyncTime={lastSyncTime}
            />

            {/* 2. Security Card */}
            <div className="p-5 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm hover:border-[#14B8A6]/40 transition-all space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#172337] border border-[#263449] text-[#14B8A6] flex items-center justify-center shrink-0">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Security & Hardware
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">Cryptographic Protection</p>
                  </div>
                </div>

                <Link
                  to="/security"
                  className="text-xs font-semibold text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-1 no-underline transition-colors"
                >
                  <span>Center</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Clean Security Specs */}
              <div className="p-3 rounded-xl bg-[#172337] border border-[#263449] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Hardware Key</span>
                  <span className="font-semibold text-[#22C55E] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active (ECDSA)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#263449]">
                  <span className="text-[#94A3B8]">Anti-Replay</span>
                  <span className="font-semibold text-[#F8FAFC]">Enforced</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#263449]">
                  <span className="text-[#94A3B8]">Device</span>
                  <button
                    onClick={handleCopyDeviceId}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#38BDF8] hover:text-[#14B8A6] transition-colors cursor-pointer"
                    title="Click to copy device ID"
                  >
                    <span>{device ? `${device.id.slice(0, 10)}...` : 'Pending'}</span>
                    {deviceCopied ? <Check size={11} className="text-[#22C55E]" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
