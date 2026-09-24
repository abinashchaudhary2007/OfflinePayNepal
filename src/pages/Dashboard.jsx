import { useMemo } from 'react';
import { Bell } from 'lucide-react';
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
    pendingSyncCount, retryWaitingCount, syncStatus, syncTransactions, isInitialized,
    registerDevice,
  } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const totalUnsynced = (pendingSyncCount || 0) + (retryWaitingCount || 0);

  // Compute harmonized wallet balances from real transactions
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
    try {
      await registerDevice(currentUser.id);
    } catch (e) {
      console.error('[register device error]', e);
    }
  };

  // Format dynamic date exactly like reference: "Thursday, 24 Sep 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <DashboardLayout>
      <div className="animate-fade-in pb-10">

        {/* ─── Dashboard Header ─── */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6B85] mt-1">
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-2xl bg-[#EAF0FF] hover:bg-[#D6E3FF] text-[#3155B8] flex items-center justify-center transition-colors cursor-pointer border border-[#DCE3F2]"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* ─── 1. Balance Card ─── */}
        <div className="mb-8">
          {isInitialized ? (
            <BalanceCard wallet={harmonizedWallet} isOffline={isOffline} />
          ) : (
            <div className="rounded-2xl sm:rounded-3xl p-8 bg-white border border-[#DCE3F2] animate-pulse h-52 shadow-xs" />
          )}
        </div>

        {/* ─── 2. Quick Actions ─── */}
        <div className="mb-8">
          <PaymentActions isOffline={isOffline} />
        </div>

        {/* ─── 3. Offline Readiness ─── */}
        <div className="mb-8">
          <OfflineReadinessCard
            device={device}
            authorization={authorization}
            isOffline={isOffline}
            onRegisterDevice={handleRegisterDevice}
            totalUnsynced={totalUnsynced}
            syncStatus={syncStatus}
            onSync={handleSync}
          />
        </div>

        {/* ─── 4. Recent Transactions ─── */}
        <div>
          <RecentTransactionsPreview />
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
