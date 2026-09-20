import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatRelativeTime, formatTxIdShort } from '../../utils/formatting';
import { MOCK_TRANSACTIONS } from '../../data/mockData';
import { useAuth } from '../../context/DemoAuthContext';
import { Card, CardHeader } from '../ui/Card';

/**
 * RecentTransactionsPreview — Shows last 4 transactions on the dashboard.
 * Fully responsive: stacks cleanly on mobile, table-like on desktop.
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  // Filter relevant transactions for this user
  const userTxs = MOCK_TRANSACTIONS
    .filter(tx => tx.senderId === userId || tx.receiverId === userId)
    .slice(0, 4);

  return (
    <Card>
      <CardHeader
        title="Recent Transactions"
        subtitle="Your latest activity"
        action={
          <Link
            to="/transactions"
            className="text-xs font-semibold text-[var(--color-indigo-600)] hover:underline no-underline flex items-center gap-1 whitespace-nowrap"
          >
            View all <ChevronRight size={13} />
          </Link>
        }
      />

      {userTxs.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="space-y-0.5 -mx-2 sm:mx-0">
          {userTxs.map(tx => (
            <TransactionRow key={tx.id} tx={tx} userId={userId} />
          ))}
        </div>
      )}
    </Card>
  );
}

function TransactionRow({ tx, userId }) {
  const isSent     = tx.senderId === userId;
  const otherParty = isSent ? tx.receiverName : tx.senderName;
  const amountColor = isSent
    ? 'text-[var(--color-red-500)]'
    : 'text-[var(--color-emerald-600)]';
  const sign = isSent ? '-' : '+';

  return (
    <Link
      to={`/transactions/${tx.id}`}
      className="
        flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl
        hover:bg-[var(--color-gray-50)] transition-colors no-underline group
      "
    >
      {/* Icon */}
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isSent ? '#FEE2E2' : '#D1FAE5',
        }}
      >
        {isSent
          ? <ArrowUpRight size={15} color="var(--color-red-500)" />
          : <ArrowDownLeft size={15} color="var(--color-emerald-600)" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-[var(--color-gray-800)] truncate">
          {otherParty}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge status={tx.status} className="text-[9px] sm:text-[10px] !py-0 !px-1.5 sm:!px-2" />
          <span className="text-[9px] sm:text-[10px] text-[var(--color-gray-400)] hidden xs:inline">
            {formatTxIdShort(tx.id)}
          </span>
        </div>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs sm:text-sm font-bold ${amountColor}`}>
          {sign}{formatCurrency(tx.amount)}
        </p>
        <p className="text-[9px] sm:text-[10px] text-[var(--color-gray-400)] mt-0.5">
          {formatRelativeTime(tx.timestamp)}
        </p>
      </div>

      <ChevronRight
        size={12}
        className="text-[var(--color-gray-300)] group-hover:text-[var(--color-gray-500)] flex-shrink-0"
      />
    </Link>
  );
}

function EmptyTransactions() {
  return (
    <div className="py-8 sm:py-10 text-center">
      <div
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: 'var(--color-gray-100)' }}
      >
        <ArrowUpRight size={24} color="var(--color-gray-300)" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-gray-500)]">No transactions yet</p>
      <p className="text-xs text-[var(--color-gray-400)] mt-1">
        Your transaction history will appear here
      </p>
    </div>
  );
}

export default RecentTransactionsPreview;
