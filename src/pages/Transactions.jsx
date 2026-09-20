/**
 * Transactions.jsx — Phase 14
 * Full transaction history with filters, search, and link to detail page.
 */
import { useState, useMemo } from 'react';
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

const FILTERS = ['All', 'Sent', 'Received', 'Offline', 'Online', 'Pending', 'Settled', 'Rejected'];

function Transactions() {
  const { currentUser } = useAuth();
  const { transactions, syncTransactions, syncStatus, pendingSyncCount } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const userId = currentUser?.id;

  const filtered = useMemo(() => {
    let list = transactions;

    // Apply filter
    if (activeFilter === 'Sent')     list = list.filter(tx => tx.senderId === userId);
    else if (activeFilter === 'Received') list = list.filter(tx => tx.receiverId === userId);
    else if (activeFilter === 'Offline') list = list.filter(tx => tx.method === 'OFFLINE_QR');
    else if (activeFilter === 'Online')  list = list.filter(tx => tx.method === 'ONLINE');
    else if (activeFilter === 'Pending') list = list.filter(tx => tx.status === 'OFFLINE_PENDING' || tx.status === 'SYNCING');
    else if (activeFilter === 'Settled') list = list.filter(tx => tx.status === 'SETTLED');
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
              Transaction History
            </h1>
            <p className="text-[var(--color-gray-500)] text-xs sm:text-sm mt-1">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[var(--color-indigo-600)] text-white border-[var(--color-indigo-600)] shadow-xs'
                    : 'bg-white text-[var(--color-gray-600)] border-[var(--color-gray-200)] hover:border-[var(--color-indigo-300)] hover:bg-[var(--color-gray-50)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <Card padding={false}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-gray-400)]">
              <Filter size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No transactions found</p>
              <p className="text-xs mt-1">Try a different filter or search term</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-gray-50)]">
              {filtered.map(tx => {
                const isSent = tx.senderId === userId;
                const other = isSent ? tx.receiverName : tx.senderName;
                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[var(--color-gray-50)] transition-colors no-underline group"
                  >
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSent ? '#FEE2E2' : '#D1FAE5' }}
                    >
                      {isSent
                        ? <ArrowUpRight size={15} color="var(--color-red-500)" />
                        : <ArrowDownLeft size={15} color="var(--color-emerald-600)" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[var(--color-gray-800)] truncate">{other}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge status={tx.status} className="!py-0 !px-1 text-[9px]" />
                        <span className="text-[10px] text-[var(--color-gray-400)] hidden sm:inline">
                          {formatDateTime(tx.timestamp)}
                        </span>
                        <span className="text-[10px] text-[var(--color-gray-400)] sm:hidden">
                          {formatRelativeTime(tx.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs sm:text-sm font-bold ${isSent ? 'text-[var(--color-red-500)]' : 'text-[var(--color-emerald-600)]'}`}>
                        {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-[var(--color-gray-400)] mt-0.5 hidden sm:block">
                        {tx.method === 'OFFLINE_QR' ? '🔐 Offline' : '🌐 Online'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[var(--color-gray-300)] group-hover:text-[var(--color-gray-500)] flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {syncStatus === 'done' && (
          <div className="text-center text-xs text-[var(--color-emerald-600)] font-semibold">
            ✓ Sync complete — all transactions up to date
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Transactions;
