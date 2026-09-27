/**
 * Transactions.jsx — Full transaction statements with analytics, rich filters, search, and details.
 */
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, Filter, Search, RefreshCw, ChevronRight,
  Store, WifiOff, Globe, Clock, AlertCircle, TrendingUp, X, CheckCircle2,
  Calendar, Layers, ShieldCheck
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDateTime, formatRelativeTime, getOfflineTxTag } from '../utils/formatting';

const FILTERS = [
  { id: 'All', label: 'All', icon: Layers },
  { id: 'Sent', label: 'Debits (Sent)', icon: ArrowUpRight },
  { id: 'Received', label: 'Credits (Received)', icon: ArrowDownLeft },
  { id: 'Offline', label: 'Offline QR', icon: WifiOff },
  { id: 'Online', label: 'Online', icon: Globe },
  { id: 'Pending', label: 'Pending', icon: Clock },
  { id: 'Rejected', label: 'Rejected', icon: AlertCircle },
];

function Transactions() {
  const { currentUser } = useAuth();
  const { transactions, syncTransactions, syncStatus, pendingSyncCount, expirePendingTransactions } = useWallet();
  const { isOffline } = useOfflineSimulation();
  const { isDark } = useTheme();

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const userId = currentUser?.id;

  // Sweep expired transactions when viewing history
  useEffect(() => {
    if (expirePendingTransactions) {
      expirePendingTransactions();
    }
  }, [expirePendingTransactions]);

  // Aggregate stats
  const stats = useMemo(() => {
    let sent = 0;
    let received = 0;
    let count = 0;

    (transactions || []).forEach(tx => {
      const isSettled = tx.status === 'SETTLED' || tx.status === 'VERIFIED' || !tx.status;
      if (isSettled) {
        if (tx.senderId === userId) sent += (Number(tx.amount) || 0);
        if (tx.receiverId === userId) received += (Number(tx.amount) || 0);
        count++;
      }
    });

    return { sent, received, net: received - sent, totalCount: (transactions || []).length };
  }, [transactions, userId]);

  const filtered = useMemo(() => {
    let list = transactions || [];

    // Apply filter
    if (activeFilter === 'Sent')          list = list.filter(tx => tx.senderId === userId);
    else if (activeFilter === 'Received') list = list.filter(tx => tx.receiverId === userId);
    else if (activeFilter === 'Offline')  list = list.filter(tx => tx.method === 'OFFLINE_QR' || tx.isOffline);
    else if (activeFilter === 'Online')   list = list.filter(tx => tx.method === 'ONLINE');
    else if (activeFilter === 'Pending')  list = list.filter(tx => (tx.method === 'OFFLINE_QR' || tx.isOffline) && !tx.receiverAcknowledged && (tx.status === 'OFFLINE_PENDING' || tx.status === 'PENDING' || tx.status === 'SYNCING' || tx.status === 'RETRY_WAITING'));
    else if (activeFilter === 'Rejected' || activeFilter === 'Expired') list = list.filter(tx => (tx.status === 'EXPIRED' || tx.status === 'REJECTED' || tx.status === 'FAILED' || tx.status === 'CANCELLED' || tx.status === 'CANCELED'));

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        tx.id?.toLowerCase().includes(q) ||
        tx.senderName?.toLowerCase().includes(q) ||
        tx.receiverName?.toLowerCase().includes(q) ||
        String(tx.amount).includes(q) ||
        tx.note?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  }, [transactions, activeFilter, search, userId]);

  const handleSync = async () => {
    if (isOffline) return;
    try { await syncTransactions(currentUser); } catch (e) { console.error(e); }
  };

  return (
    <DashboardLayout>
      <div
        className="max-w-5xl mx-auto animate-fade-in pb-16"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Transaction History
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 9999,
                  background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                  color: isDark ? '#93A7F0' : '#172B75',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                }}
              >
                {filtered.length} of {stats.totalCount}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              Complete record of online and cryptographic offline transactions
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {pendingSyncCount > 0 && !isOffline && (
              <Button
                size="sm"
                variant="primary"
                loading={syncStatus === 'syncing'}
                onClick={handleSync}
                leftIcon={<RefreshCw size={14} />}
                className="shadow-xs"
              >
                Sync {pendingSyncCount} Pending
              </Button>
            )}
          </div>
        </div>

        {/* ─── Summary Overview Stats Strip ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Inflow */}
          <div
            style={{
              background: isDark ? 'rgba(22,166,106,0.08)' : '#F2FBF6',
              border: `1px solid ${isDark ? 'rgba(22,166,106,0.2)' : 'rgba(22,166,106,0.25)'}`,
              borderRadius: '1.125rem',
              padding: '16px 20px',
            }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A66A] mb-1">
                <ArrowDownLeft size={14} />
                <span>Total Received (Credits)</span>
              </div>
              <div className="text-xl font-black" style={{ color: isDark ? '#34D399' : '#0F7249' }}>
                +{formatCurrency(stats.received)}
              </div>
            </div>
            <div
              style={{
                width: 38, height: 38, borderRadius: '0.75rem',
                background: isDark ? 'rgba(22,166,106,0.2)' : '#E8F8F1',
                color: '#16A66A',
              }}
              className="flex items-center justify-center shrink-0"
            >
              <ArrowDownLeft size={20} strokeWidth={2.4} />
            </div>
          </div>

          {/* Total Outflow */}
          <div
            style={{
              background: isDark ? 'rgba(214,69,69,0.08)' : '#FEF6F6',
              border: `1px solid ${isDark ? 'rgba(214,69,69,0.2)' : 'rgba(214,69,69,0.25)'}`,
              borderRadius: '1.125rem',
              padding: '16px 20px',
            }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D64545] mb-1">
                <ArrowUpRight size={14} />
                <span>Total Sent (Debits)</span>
              </div>
              <div className="text-xl font-black" style={{ color: isDark ? '#F87171' : '#A83636' }}>
                -{formatCurrency(stats.sent)}
              </div>
            </div>
            <div
              style={{
                width: 38, height: 38, borderRadius: '0.75rem',
                background: isDark ? 'rgba(214,69,69,0.2)' : '#FDECEC',
                color: '#D64545',
              }}
              className="flex items-center justify-center shrink-0"
            >
              <ArrowUpRight size={20} strokeWidth={2.4} />
            </div>
          </div>

          {/* Net Flow */}
          <div
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '1.125rem',
              padding: '16px 20px',
              boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
            }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                <TrendingUp size={14} />
                <span>Net Cash Flow</span>
              </div>
              <div
                className="text-xl font-black"
                style={{
                  color: stats.net >= 0
                    ? (isDark ? '#34D399' : '#16A66A')
                    : (isDark ? '#F87171' : '#D64545'),
                }}
              >
                {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 9999,
                background: stats.net >= 0
                  ? (isDark ? 'rgba(22,166,106,0.2)' : '#E8F8F1')
                  : (isDark ? 'rgba(214,69,69,0.2)' : '#FDECEC'),
                color: stats.net >= 0 ? '#16A66A' : '#D64545',
              }}
            >
              {stats.net >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>

        {/* ─── Search Bar ─── */}
        <div
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            borderRadius: '1rem',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.04)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          <input
            id="tx-search"
            type="text"
            placeholder="Search by recipient, sender, note, amount, or TX ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: '9999px',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* ─── Filter Pills ─── */}
        <div className="overflow-x-auto pb-1 scroll-x">
          <div className="flex items-center gap-2 min-w-max">
            {FILTERS.map(({ id, label, icon: Icon }) => {
              const isActive = activeFilter === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveFilter(id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '0.875rem',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    background: isActive
                      ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)'
                      : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                    border: `1px solid ${isActive ? '#172B75' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                    boxShadow: isActive ? '0 3px 10px rgba(23,43,117,0.25)' : '0 1px 2px rgba(23,43,117,0.03)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isDark ? 'var(--border-hover)' : '#3155B8';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isDark ? 'var(--border-color)' : '#DCE3F2';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Transaction Statements List Card ─── */}
        <div
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            borderRadius: '1.25rem',
            padding: '8px 12px',
            boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 6px rgba(23,43,117,0.05)',
          }}
        >
          {filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: '1rem',
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  color: 'var(--text-muted)',
                }}
                className="mx-auto mb-3 flex items-center justify-center"
              >
                <Filter size={24} />
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                No transactions match your filter
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Try selecting a different filter or clearing your search term
              </p>
              {(search || activeFilter !== 'All') && (
                <button
                  onClick={() => { setSearch(''); setActiveFilter('All'); }}
                  style={{
                    marginTop: '16px',
                    padding: '6px 16px',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? 'var(--border-color)' : '#EAF0FF' }}>
              {filtered.map(tx => {
                const isSent = tx.senderId === userId;
                const other = isSent ? (tx.receiverName || 'Recipient') : (tx.senderName || 'Sender');
                const offlineTag = getOfflineTxTag(tx);
                const isOfflineTx = tx.method === 'OFFLINE_QR' || tx.isOffline;
                const isMerchant = isSent && (
                  other.toLowerCase().includes('store') ||
                  other.toLowerCase().includes('superstore') ||
                  other.toLowerCase().includes('shop') ||
                  tx.note?.toLowerCase().includes('shop') ||
                  tx.note?.toLowerCase().includes('merchant')
                );

                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 14px',
                      borderRadius: '0.875rem',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                      gap: '12px',
                    }}
                    className="group"
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Left: Avatar + Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9375rem',
                          background: isSent
                            ? (isDark ? 'rgba(214,69,69,0.14)' : '#FDECEC')
                            : (isDark ? 'rgba(22,166,106,0.14)' : '#E8F8F1'),
                          color: isSent
                            ? (isDark ? '#F87171' : '#D64545')
                            : (isDark ? '#34D399' : '#16A66A'),
                          border: `1px solid ${isSent ? (isDark ? 'rgba(214,69,69,0.3)' : '#F9D0D0') : (isDark ? 'rgba(22,166,106,0.3)' : '#C9EFE0')}`,
                        }}
                      >
                        {isMerchant ? (
                          <Store size={20} />
                        ) : isSent ? (
                          <ArrowUpRight size={20} strokeWidth={2.4} />
                        ) : (
                          <ArrowDownLeft size={20} strokeWidth={2.4} />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            style={{
                              fontSize: '0.9375rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            className="group-hover:text-[#3155B8] transition-colors"
                          >
                            {other}
                          </p>

                          {/* Method Badge */}
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: isOfflineTx
                                ? (isDark ? 'rgba(79,111,216,0.18)' : '#EAF0FF')
                                : (isDark ? 'rgba(59,130,246,0.12)' : '#F0F7FF'),
                              color: isOfflineTx
                                ? (isDark ? '#93A7F0' : '#172B75')
                                : (isDark ? '#60A5FA' : '#2563EB'),
                              border: `1px solid ${isOfflineTx ? (isDark ? 'rgba(79,111,216,0.3)' : '#DCE3F2') : 'rgba(59,130,246,0.2)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isOfflineTx ? <WifiOff size={10} /> : <Globe size={10} />}
                            <span>{isOfflineTx ? 'Offline QR' : 'Online'}</span>
                          </span>

                          {offlineTag && (
                            <span className={`badge ${offlineTag.className} !py-0 !px-1.5 text-[9px]`}>
                              {offlineTag.label}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '3px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{formatDateTime(tx.timestamp || tx.createdAt)}</span>
                          {tx.note && (
                            <>
                              <span style={{ opacity: 0.5 }}>•</span>
                              <span className="truncate max-w-[180px] opacity-80">{tx.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontSize: '1.0625rem',
                            fontWeight: 800,
                            margin: 0,
                            color: isSent
                              ? (isDark ? '#F87171' : '#D64545')
                              : (isDark ? '#34D399' : '#16A66A'),
                          }}
                        >
                          {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                        </p>
                        <p
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: isSent ? 'var(--text-secondary)' : '#16A66A',
                            margin: 0,
                          }}
                        >
                          {isSent ? 'Debited' : 'Credited'}
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        style={{ color: 'var(--text-muted)' }}
                        className="group-hover:translate-x-0.5 group-hover:text-[#3155B8] transition-all"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {syncStatus === 'done' && (
          <div className="text-center text-xs text-[#16A66A] font-semibold flex items-center justify-center gap-1.5 animate-fade-in">
            <CheckCircle2 size={14} />
            <span>Sync complete — all local and offline transactions committed</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Transactions;
