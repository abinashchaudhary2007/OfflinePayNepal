import { useMemo } from 'react';
import { Bell, RefreshCw, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import PaymentActions from '../components/wallet/QuickActions';
import QuickPayees from '../components/wallet/QuickPayees';
import OfflineReadinessCard from '../components/wallet/OfflineReadinessCard';
import RecentTransactionsPreview from '../components/wallet/RecentTransactionsPreview';
import FinancialAnalyticsChart from '../components/wallet/FinancialAnalyticsChart';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { useTheme } from '../context/ThemeContext';

function Dashboard() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, transactions,
    pendingSyncCount, retryWaitingCount, syncStatus, syncTransactions, isInitialized,
    initWallet, registerDevice,
  } = useWallet();
  const { isOffline } = useOfflineSimulation();
  const { isDark } = useTheme();

  const totalUnsynced = (pendingSyncCount || 0) + (retryWaitingCount || 0);

  // Compute harmonized wallet balances from real transactions
  const totalSent = useMemo(() => (
    (transactions || [])
      .filter(tx => tx.senderId === currentUser?.id && (tx.status === 'SETTLED' || tx.status === 'VERIFIED' || !tx.status))
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
  ), [transactions, currentUser?.id]);

  const totalReceived = useMemo(() => (
    (transactions || [])
      .filter(tx => tx.receiverId === currentUser?.id && (tx.status === 'SETTLED' || tx.status === 'VERIFIED' || !tx.status))
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
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

  const handleRefreshBalance = async () => {
    try {
      if (!isOffline && currentUser) {
        await syncTransactions(currentUser);
      }
      if (currentUser) {
        await initWallet(currentUser);
      }
    } catch (e) {
      console.error('[dashboard refresh balance error]', e);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      await registerDevice(currentUser.id);
    } catch (e) {
      console.error('[register device error]', e);
    }
  };

  // Format dynamic date: "Sunday, Sep 27, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const userName = currentUser?.name || 'User';

  return (
    <DashboardLayout>
      <div
        className="animate-fade-in pb-16"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >

        {/* ─── Dashboard Header & Greeting ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Dashboard
              </h1>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  background: isDark ? 'rgba(79,111,216,0.18)' : '#EAF0FF',
                  color: isDark ? '#93A7F0' : '#172B75',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                className="hidden sm:inline-flex"
              >
                <ShieldCheck size={11} />
                <span>ECDSA P-256 Secured</span>
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
              Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong> · {formattedDate}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {totalUnsynced > 0 && !isOffline && (
              <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isDark ? 'rgba(242,169,0,0.15)' : '#FFF6DD',
                  color: isDark ? '#F2A900' : '#B57F00',
                  border: `1px solid ${isDark ? 'rgba(242,169,0,0.3)' : 'rgba(242,169,0,0.3)'}`,
                }}
                title="Sync offline transactions to server"
              >
                <RefreshCw size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                <span>Sync ({totalUnsynced})</span>
              </button>
            )}

            <button
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                color: isDark ? '#4F6FD8' : '#3155B8',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--border-color)' : '#D6E3FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#EAF0FF'; }}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* ─── 1. Balance Card with Refresh Button beside Amount ─── */}
        <div>
          {isInitialized ? (
            <BalanceCard
              wallet={harmonizedWallet}
              isOffline={isOffline}
              onRefresh={handleRefreshBalance}
              syncStatus={syncStatus}
            />
          ) : (
            <div
              style={{
                borderRadius: '1.5rem',
                padding: '30px',
                background: '#172B75',
                height: '210px',
              }}
              className="animate-pulse border border-white/10 shadow-xs"
            />
          )}
        </div>

        {/* ─── 2. Quick Actions ─── */}
        <div>
          <PaymentActions isOffline={isOffline} />
        </div>

        {/* ─── 3. Quick Payees / Frequent Contacts ─── */}
        <div>
          <QuickPayees />
        </div>

        {/* ─── 4. Offline Readiness Card ─── */}
        <div>
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

        {/* ─── 5. Recent Transactions Statements ─── */}
        <div>
          <RecentTransactionsPreview />
        </div>

        {/* ─── 6. Debit & Credit Bar Graph Analytics (at the bottom) ─── */}
        <div>
          <FinancialAnalyticsChart />
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
