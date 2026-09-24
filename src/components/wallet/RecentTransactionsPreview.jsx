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
    <div className="rounded-2xl border border-[#DCE3F2] bg-white shadow-xs p-5 sm:p-6 transition-all space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2] text-[#3155B8] flex items-center justify-center shrink-0">
            <History size={16} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#172033] tracking-tight">
            Recent Activity
          </h3>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2">
          <div className="hidden xs:flex items-center gap-1 bg-[#F5F7FF] p-0.5 rounded-lg border border-[#DCE3F2]">
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
                    ? 'bg-[#172B75] text-white font-bold shadow-xs'
                    : 'text-[#5F6B85] hover:text-[#172033]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/transactions"
            className="text-xs font-semibold text-[#3155B8] hover:text-[#172B75] flex items-center gap-1 group no-underline transition-colors pl-1"
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
        hover:bg-[#F5F7FF] transition-all no-underline group
        border border-transparent hover:border-[#DCE3F2]
      "
    >
      {/* Icon with clear status colors */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
          isSent
            ? 'bg-[#FDECEC] text-[#D64545] border border-[#D64545]/25'
            : 'bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/25'
        }`}
      >
        {isSent ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs sm:text-sm font-bold text-[#172033] truncate group-hover:text-[#3155B8] transition-colors">
            {otherParty || 'Unknown Party'}
          </p>
          {tx.isOffline && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#EAF0FF] text-[#3155B8] border border-[#3155B8]/25">
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge status={tx.status} className="text-[9px] sm:text-[10px] !py-0 !px-1.5" />
          <span className="font-mono text-[10px] text-[#8993A8] hidden xs:inline">
            {formatTxIdShort(tx.id)}
          </span>
        </div>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs sm:text-sm font-extrabold ${
          isSent ? 'text-[#D64545]' : 'text-[#16A66A]'
        }`}>
          {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
        </p>
        <p className="text-[10px] text-[#8993A8] font-medium mt-0.5">
          {formatRelativeTime(tx.timestamp)}
        </p>
      </div>

      <ChevronRight
        size={14}
        className="text-[#8993A8]/50 group-hover:text-[#172033] group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </Link>
  );
}

function EmptyTransactions() {
  return (
    <div className="py-8 text-center px-4 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2]">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white border border-[#DCE3F2] text-[#8993A8] shadow-xs">
        <History size={22} />
      </div>
      <p className="text-sm font-bold text-[#172033]">No payment activity yet</p>
      <p className="text-xs text-[#5F6B85] mt-1 max-w-xs mx-auto mb-4">
        Your offline transactions and signed receipts will appear here automatically.
      </p>
      <Link
        to="/send?mode=shop"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#172B75] hover:bg-[#12215B] shadow-sm transition-colors no-underline"
        id="btn-empty-make-demo-payment"
      >
        <span>Make a Demo Payment</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default RecentTransactionsPreview;
