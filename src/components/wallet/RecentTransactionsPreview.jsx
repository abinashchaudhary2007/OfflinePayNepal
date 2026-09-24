import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, History, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatRelativeTime, formatTxIdShort } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';

/**
 * RecentTransactionsPreview — Shows latest real transactions on the dashboard.
 * Styled with Midnight Navy (#111C2E / #172337), border #263449, Electric Teal & Sky Blue accents.
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'received' | 'sent' | 'offline'

  // Filtered transactions for this user
  const userTxs = useMemo(() => {
    let list = transactions || [];
    if (activeTab === 'received') {
      list = list.filter(tx => tx.receiverId === userId);
    } else if (activeTab === 'sent') {
      list = list.filter(tx => tx.senderId === userId);
    } else if (activeTab === 'offline') {
      list = list.filter(tx => tx.isOffline);
    }
    return list.slice(0, 6);
  }, [transactions, activeTab, userId]);

  return (
    <div className="rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm p-5 sm:p-6 transition-all space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#172337] border border-[#263449] text-[#38BDF8] flex items-center justify-center shrink-0">
            <History size={16} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight">
            Recent Activity
          </h3>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2">
          <div className="hidden xs:flex items-center gap-1 bg-[#172337] p-0.5 rounded-lg border border-[#263449]">
            {[
              { id: 'all', label: 'All' },
              { id: 'received', label: 'In' },
              { id: 'sent', label: 'Out' },
              { id: 'offline', label: 'Offline' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#14B8A6] text-[#0B1220] font-bold shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/transactions"
            className="text-xs font-semibold text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-1 group no-underline transition-colors pl-1"
          >
            <span>View all</span>
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
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
        flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl
        hover:bg-[#172337] transition-all no-underline group
        border border-transparent hover:border-[#263449]
      "
    >
      {/* Icon with clear status colors */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
          isSent
            ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
            : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
        }`}
      >
        {isSent ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate group-hover:text-[#14B8A6] transition-colors">
            {otherParty || 'Unknown Party'}
          </p>
          {tx.isOffline && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge status={tx.status} className="text-[9px] sm:text-[10px] !py-0 !px-1.5" />
          <span className="font-mono text-[10px] text-[#94A3B8] hidden xs:inline">
            {formatTxIdShort(tx.id)}
          </span>
        </div>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs sm:text-sm font-extrabold ${
          isSent ? 'text-[#EF4444]' : 'text-[#22C55E]'
        }`}>
          {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
        </p>
        <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">
          {formatRelativeTime(tx.timestamp)}
        </p>
      </div>

      <ChevronRight
        size={14}
        className="text-[#94A3B8]/50 group-hover:text-[#F8FAFC] group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </Link>
  );
}

function EmptyTransactions() {
  return (
    <div className="py-8 text-center px-4 rounded-xl bg-[#172337]/50 border border-[#263449]">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[#111C2E] border border-[#263449] text-[#94A3B8]">
        <History size={22} />
      </div>
      <p className="text-sm font-bold text-[#F8FAFC]">No payment activity yet</p>
      <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto mb-4">
        Your offline transactions and signed receipts will appear here automatically.
      </p>
      <Link
        to="/send?mode=shop"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0B1220] bg-[#14B8A6] hover:bg-[#0D9488] shadow-sm transition-colors no-underline"
        id="btn-empty-make-demo-payment"
      >
        <span>Make a Demo Payment</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default RecentTransactionsPreview;
