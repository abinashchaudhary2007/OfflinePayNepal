import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, History, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatRelativeTime, formatTxIdShort } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';

/**
 * RecentTransactionsPreview — Shows latest real transactions on the dashboard.
 * Styled with luxury rounded-3xl container, high contrast typography, and theme-adaptive colors.
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const userId = currentUser?.id;

  // Real transactions for this user
  const userTxs = (transactions || []).slice(0, 5);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <History size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Audit Feed
            </p>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Transactions
            </h3>
          </div>
        </div>

        <Link
          to="/transactions"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group no-underline transition-colors"
        >
          <span>View all</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {userTxs.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="space-y-1.5 -mx-1 sm:mx-0">
          {userTxs.map(tx => (
            <TransactionRow key={tx.id} tx={tx} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx, userId }) {
  const isSent     = tx.senderId === userId;
  const otherParty = isSent ? tx.receiverName : tx.senderName;

  return (
    <Link
      to={`/transactions/${tx.id}`}
      className="
        flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-2xl
        hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all no-underline group
        border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800
      "
    >
      {/* Icon with refined micro-gradient */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
          isSent
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
        }`}
      >
        {isSent ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {otherParty || 'Unknown Party'}
          </p>
          {tx.isOffline && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge status={tx.status} className="text-[9px] sm:text-[10px] !py-0 !px-1.5" />
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 hidden xs:inline">
            {formatTxIdShort(tx.id)}
          </span>
        </div>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs sm:text-sm font-extrabold ${
          isSent ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
        }`}>
          {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
          {formatRelativeTime(tx.timestamp)}
        </p>
      </div>

      <ChevronRight
        size={14}
        className="text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </Link>
  );
}

function EmptyTransactions() {
  return (
    <div className="py-8 text-center px-4 rounded-2xl bg-slate-50/60 dark:bg-[#0B0F19]/60 border border-slate-100 dark:border-slate-800/80">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
        <History size={22} />
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No payment activity yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto mb-4">
        Your offline transactions and signed receipts will appear here automatically.
      </p>
      <Link
        to="/send?mode=shop"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors no-underline"
        id="btn-empty-make-demo-payment"
      >
        <span>Make a Demo Payment</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default RecentTransactionsPreview;
