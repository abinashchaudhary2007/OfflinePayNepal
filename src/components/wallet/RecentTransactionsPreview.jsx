import { Link } from 'react-router-dom';
import { Store, History, ArrowRight } from 'lucide-react';
import { formatCurrency, getOfflineTxTag } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * RecentTransactionsPreview — Dark-mode-aware recent transactions list.
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const { isDark } = useTheme();
  const userId = currentUser?.id;

  const userTxs = (transactions || []).slice(0, 5);

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
    <div style={{
      borderRadius: '1.25rem',
      border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
      padding: '24px 28px',
      boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 18,
        borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
        marginBottom: 8,
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          style={{
            fontSize: '0.8125rem', fontWeight: 600,
            color: isDark ? '#4F6FD8' : '#3155B8',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = isDark ? '#738EE4' : '#172B75'}
          onMouseLeave={e => e.currentTarget.style.color = isDark ? '#4F6FD8' : '#3155B8'}
        >
          View all
        </Link>
      </div>

      {userTxs.length === 0 ? (
        <EmptyTransactions isDark={isDark} />
      ) : (
        <div>
          {userTxs.map((tx, idx) => {
            const isSent = tx.senderId === userId;
            const otherParty = isSent ? (tx.receiverName || 'Recipient') : (tx.senderName || 'Sender');
            const dateStr = formatDateShort(tx.timestamp);
            const isMerchant = isSent && (
              otherParty.toLowerCase().includes('store') ||
              otherParty.toLowerCase().includes('superstore') ||
              otherParty.toLowerCase().includes('shop') ||
              tx.note?.toLowerCase().includes('shop')
            );
            const offlineTag = getOfflineTxTag(tx);

            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 12px', marginLeft: -12, marginRight: -12,
                  borderRadius: 12, textDecoration: 'none',
                  borderBottom: idx < userTxs.length - 1 ? `1px solid ${isDark ? 'var(--border-color)' : '#EAF0FF'}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Left: Avatar + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '0.875rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.875rem',
                    background: isSent
                      ? (isDark ? 'rgba(214,69,69,0.12)' : '#FDECEC')
                      : (isDark ? 'rgba(22,166,106,0.12)' : '#E8F8F1'),
                    color: isSent
                      ? (isDark ? '#E57373' : '#D64545')
                      : '#16A66A',
                  }}>
                    {isMerchant ? <Store size={18} /> : <span>{otherParty.charAt(0).toUpperCase()}</span>}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.875rem', fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {otherParty}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{dateStr}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ color: isSent ? 'var(--text-secondary)' : '#16A66A', fontWeight: isSent ? 400 : 600 }}>
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                      {offlineTag && (
                        <>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span className={`badge ${offlineTag.className} !py-0 !px-1.5 text-[9px]`}>
                            {offlineTag.label}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 16 }}>
                  <span style={{
                    fontSize: '1rem', fontWeight: 800,
                    color: isSent ? (isDark ? '#E57373' : '#D64545') : '#16A66A',
                  }}>
                    {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyTransactions({ isDark }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
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
        No recent transactions
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
