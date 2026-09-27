import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Store, History, ArrowRight, ArrowDownLeft, ArrowUpRight, ShieldCheck, WifiOff } from 'lucide-react';
import { formatCurrency, getOfflineTxTag } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * RecentTransactionsPreview — Dark-mode-aware transaction statements preview with Debit/Credit filtering.
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SENT' | 'RECEIVED'
  const userId = currentUser?.id;

  const filteredTxs = useMemo(() => {
    let list = (transactions || []);
    if (filter === 'SENT') {
      list = list.filter(tx => tx.senderId === userId);
    } else if (filter === 'RECEIVED') {
      list = list.filter(tx => tx.receiverId === userId);
    }
    return list.slice(0, 6);
  }, [transactions, filter, userId]);

  const formatDateShort = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        padding: '24px 28px',
        boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
      }}
      className="space-y-4"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Recent Statements
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Latest account debit and credit activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filter Tabs */}
          <div
            style={{
              background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '0.625rem',
              padding: '2px',
            }}
            className="flex items-center"
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'SENT', label: 'Debits' },
              { id: 'RECEIVED', label: 'Credits' },
            ].map(tab => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    background: active ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Link
            to="/transactions"
            style={{
              fontSize: '0.8125rem', fontWeight: 600,
              color: isDark ? '#738EE4' : '#3155B8',
              textDecoration: 'none', transition: 'color 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? '#93A7F0' : '#172B75'}
            onMouseLeave={e => e.currentTarget.style.color = isDark ? '#738EE4' : '#3155B8'}
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {filteredTxs.length === 0 ? (
        <EmptyTransactions isDark={isDark} filter={filter} />
      ) : (
        <div className="divide-y" style={{ borderColor: isDark ? 'var(--border-color)' : '#EAF0FF' }}>
          {filteredTxs.map((tx) => {
            const isSent = tx.senderId === userId;
            const otherParty = isSent ? (tx.receiverName || 'Recipient') : (tx.senderName || 'Sender');
            const dateStr = formatDateShort(tx.timestamp || tx.createdAt);
            const isMerchant = isSent && (
              otherParty.toLowerCase().includes('store') ||
              otherParty.toLowerCase().includes('superstore') ||
              otherParty.toLowerCase().includes('shop') ||
              tx.note?.toLowerCase().includes('shop') ||
              tx.note?.toLowerCase().includes('merchant')
            );
            const offlineTag = getOfflineTxTag(tx);
            const isOfflineTx = tx.method === 'OFFLINE_QR' || tx.isOffline;

            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 10px', marginLeft: -10, marginRight: -10,
                  borderRadius: 12, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Left: Avatar + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9375rem',
                    background: isSent
                      ? (isDark ? 'rgba(214,69,69,0.14)' : '#FDECEC')
                      : (isDark ? 'rgba(22,166,106,0.14)' : '#E8F8F1'),
                    color: isSent
                      ? (isDark ? '#F87171' : '#D64545')
                      : (isDark ? '#34D399' : '#16A66A'),
                  }}>
                    {isMerchant ? (
                      <Store size={20} />
                    ) : isSent ? (
                      <ArrowUpRight size={20} strokeWidth={2.4} />
                    ) : (
                      <ArrowDownLeft size={20} strokeWidth={2.4} />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <p style={{
                        fontSize: '0.9375rem', fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {otherParty}
                      </p>
                      {isOfflineTx && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDark ? 'rgba(79,111,216,0.18)' : '#EAF0FF',
                            color: isDark ? '#93A7F0' : '#172B75',
                          }}
                          className="shrink-0 flex items-center gap-1"
                        >
                          <WifiOff size={9} />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{dateStr}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{
                        color: isSent ? (isDark ? '#F87171' : '#D64545') : (isDark ? '#34D399' : '#16A66A'),
                        fontWeight: 600,
                      }}>
                        {isSent ? 'Debit' : 'Credit'}
                      </span>
                      {tx.note && (
                        <>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span className="truncate max-w-[140px] opacity-75">{tx.note}</span>
                        </>
                      )}
                      {offlineTag && (
                        <>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span className={`badge ${offlineTag.className} !py-0 !px-1.5 text-[9px]`}>
                            {offlineTag.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 16 }}>
                  <div style={{
                    fontSize: '1.0625rem', fontWeight: 800,
                    fontFamily: 'var(--font-primary)',
                    color: isSent ? (isDark ? '#F87171' : '#D64545') : (isDark ? '#34D399' : '#16A66A'),
                  }}>
                    {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {tx.currency || 'NPR'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyTransactions({ isDark, filter }) {
  return (
    <div style={{ padding: '36px 16px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '0.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
        background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
        color: 'var(--text-muted)',
      }}>
        <History size={22} />
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {filter === 'ALL' ? 'No recent transactions' : `No ${filter.toLowerCase()} transactions found`}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 280, margin: '4px auto 16px' }}>
        Your offline and online payment activity will appear here automatically.
      </p>
      <Link
        to="/send"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: '0.75rem',
          fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF',
          background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span>Send Money</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default RecentTransactionsPreview;
