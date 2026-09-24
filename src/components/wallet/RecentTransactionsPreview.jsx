import { Link } from 'react-router-dom';
import { Store, History, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';

/**
 * RecentTransactionsPreview — Renders the exact clean transaction list from reference image:
 * - "Recent Transactions" header with "View all"
 * - Rounded square avatars (green initial for Received, soft-red store icon for Sent)
 * - Name + "Date • Received / Sent"
 * - High-contrast amount (+Rs. in green, -Rs. in red)
 */
function RecentTransactionsPreview() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
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
    <div className="rounded-2xl border border-[#DCE3F2] bg-white shadow-xs p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#DCE3F2]">
        <h3 className="text-base font-bold text-[#172033] tracking-tight">
          Recent Transactions
        </h3>

        <Link
          to="/transactions"
          className="text-xs font-semibold text-[#3155B8] hover:text-[#172B75] hover:underline no-underline transition-colors"
        >
          View all
        </Link>
      </div>

      {userTxs.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="divide-y divide-[#DCE3F2]">
          {userTxs.map(tx => {
            const isSent = tx.senderId === userId;
            const otherParty = isSent ? (tx.receiverName || 'Recipient') : (tx.senderName || 'Sender');
            const dateStr = formatDateShort(tx.timestamp);
            const isMerchant = isSent && (otherParty.toLowerCase().includes('store') || otherParty.toLowerCase().includes('superstore') || otherParty.toLowerCase().includes('shop') || tx.note?.toLowerCase().includes('shop'));

            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="flex items-center justify-between py-3.5 sm:py-4 hover:bg-[#F5F7FF] -mx-2 px-2 sm:-mx-3 sm:px-3 rounded-xl transition-colors no-underline group"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      isSent
                        ? 'bg-[#FDECEC] text-[#D64545]'
                        : 'bg-[#E8F8F1] text-[#16A66A]'
                    }`}
                  >
                    {isMerchant ? (
                      <Store size={18} />
                    ) : (
                      <span>{otherParty.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#172033] truncate group-hover:text-[#3155B8] transition-colors">
                      {otherParty}
                    </p>
                    <p className="text-xs text-[#5F6B85] mt-0.5 flex items-center gap-1.5">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className={isSent ? 'text-[#5F6B85]' : 'text-[#16A66A] font-medium'}>
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0 pl-3">
                  <span
                    className={`text-sm sm:text-base font-extrabold ${
                      isSent ? 'text-[#D64545]' : 'text-[#16A66A]'
                    }`}
                  >
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

function EmptyTransactions() {
  return (
    <div className="py-8 text-center px-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-[#F5F7FF] border border-[#DCE3F2] text-[#8993A8]">
        <History size={22} />
      </div>
      <p className="text-sm font-bold text-[#172033]">No recent transactions</p>
      <p className="text-xs text-[#5F6B85] mt-1 max-w-xs mx-auto mb-4">
        Your offline and online payment activity will appear here automatically.
      </p>
      <Link
        to="/send"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#172B75] hover:bg-[#12215B] transition-colors no-underline"
      >
        <span>Send Money</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default RecentTransactionsPreview;
