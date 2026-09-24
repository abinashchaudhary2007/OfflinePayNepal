/**
 * Transactions.jsx — Phase 14
 * Full transaction history with filters, search, and link to detail page.
 */
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Filter, Search, RefreshCw, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatting';

const FILTERS = ['All', 'Sent', 'Received', 'Offline', 'Online', 'Pending', 'Settled', 'Expired', 'Rejected'];

function Transactions() {
  const { currentUser } = useAuth();
  const { transactions, syncTransactions, syncStatus, pendingSyncCount, expirePendingTransactions } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const userId = currentUser?.id;

  // Sweep expired transactions when viewing history
  useEffect(() => {
    if (expirePendingTransactions) {
      expirePendingTransactions();
    }
  }, [expirePendingTransactions]);

  const filtered = useMemo(() => {
    let list = transactions;

    // Apply filter
    if (activeFilter === 'Sent')          list = list.filter(tx => tx.senderId === userId);
    else if (activeFilter === 'Received') list = list.filter(tx => tx.receiverId === userId);
    else if (activeFilter === 'Offline')  list = list.filter(tx => tx.method === 'OFFLINE_QR');
    else if (activeFilter === 'Online')   list = list.filter(tx => tx.method === 'ONLINE');
    else if (activeFilter === 'Pending')  list = list.filter(tx => tx.status === 'OFFLINE_PENDING' || tx.status === 'SYNCING' || tx.status === 'RETRY_WAITING');
    else if (activeFilter === 'Settled')  list = list.filter(tx => tx.status === 'SETTLED');
    else if (activeFilter === 'Expired')  list = list.filter(tx => tx.status === 'EXPIRED');
    else if (activeFilter === 'Rejected') list = list.filter(tx => tx.status === 'REJECTED');

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

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, activeFilter, search, userId]);

  const handleSync = async () => {
    if (isOffline) return;
    try { await syncTransactions(currentUser); } catch (e) { console.error(e); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F8FAFC] tracking-tight">
              Transaction History
            </h1>
            <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} total · {filtered.length} showing
            </p>
          </div>
          {pendingSyncCount > 0 && !isOffline && (
            <Button size="sm" variant="primary" loading={syncStatus === 'syncing'} onClick={handleSync}
              leftIcon={<RefreshCw size={13} />}>
              Sync {pendingSyncCount}
            </Button>
          )}
        </div>

        {/* Search */}
        <Input
          id="tx-search"
          placeholder="Search by name, TX ID, amount..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />

        {/* Filter chips */}
        <div className="scroll-x pb-1">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[#14B8A6] text-[#0B1220] border-[#14B8A6] shadow-xs'
                    : 'bg-[#111C2E] text-[#94A3B8] border-[#263449] hover:border-[#14B8A6]/40 hover:text-[#F8FAFC] hover:bg-[#172337]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <Card padding={false} className="bg-[#111C2E] border border-[#263449]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <Filter size={32} className="mx-auto mb-3 opacity-30 text-[#94A3B8]" />
              <p className="text-sm font-semibold text-[#F8FAFC]">No transactions found</p>
              <p className="text-xs mt-1 text-[#94A3B8]">Try a different filter or search term</p>
            </div>
          ) : (
            <div className="divide-y divide-[#263449]">
              {filtered.map(tx => {
                const isSent = tx.senderId === userId;
                const other = isSent ? tx.receiverName : tx.senderName;
                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[#172337] transition-colors no-underline group"
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSent
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                      }`}
                    >
                      {isSent
                        ? <ArrowUpRight size={16} />
                        : <ArrowDownLeft size={16} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate group-hover:text-[#14B8A6] transition-colors">{other}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge status={tx.status} className="!py-0 !px-1.5 text-[9px]" />
                        <span className="text-[10px] text-[#94A3B8] hidden sm:inline">
                          {formatDateTime(tx.timestamp)}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] sm:hidden">
                          {formatRelativeTime(tx.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs sm:text-sm font-extrabold ${isSent ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                        {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <p className={`text-[10px] mt-0.5 hidden sm:block font-medium ${tx.method === 'OFFLINE_QR' ? 'text-[#A78BFA]' : 'text-[#38BDF8]'}`}>
                        {tx.method === 'OFFLINE_QR' ? '🔐 Offline' : '🌐 Online'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[#94A3B8]/40 group-hover:text-[#F8FAFC] flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {syncStatus === 'done' && (
          <div className="text-center text-xs text-[#22C55E] font-semibold">
            ✓ Sync complete — all transactions up to date
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Transactions;
