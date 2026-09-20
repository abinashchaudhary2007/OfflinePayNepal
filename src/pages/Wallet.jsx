/**
 * Wallet.jsx — Phase 2
 * Full wallet view with balance, stats, offline auth summary, and transaction preview.
 */
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Shield, TrendingUp, QrCode } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import BalanceCard from '../components/wallet/BalanceCard';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatRelativeTime, calcPercentage } from '../utils/formatting';

function Wallet() {
  const { currentUser } = useAuth();
  const { wallet, authorization, transactions, pendingSyncCount, syncTransactions, syncStatus, isInitialized } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const recentTxs = transactions.slice(0, 6);
  const totalSent = transactions
    .filter(tx => tx.senderId === currentUser?.id && tx.status === 'SETTLED')
    .reduce((s, tx) => s + tx.amount, 0);
  const totalReceived = transactions
    .filter(tx => tx.receiverId === currentUser?.id && tx.status === 'SETTLED')
    .reduce((s, tx) => s + tx.amount, 0);

  // Harmonized wallet object so dark card and stat cards always match
  const harmonizedWallet = wallet ? {
    ...wallet,
    totalSent,
    totalReceived,
  } : null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
            Wallet
          </h1>
        </div>

        {/* Desktop 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Balance Card */}
            {isInitialized
              ? <BalanceCard wallet={harmonizedWallet} isOffline={isOffline} />
              : <div className="card-navy p-6 animate-pulse"><div className="h-10 w-48 bg-white/20 rounded" /></div>
            }

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Total Sent"
                value={formatCurrency(totalSent)}
                color="var(--color-red-500)"
                icon={<ArrowUpRight size={16} />}
              />
              <StatCard
                label="Total Received"
                value={formatCurrency(totalReceived)}
                color="var(--color-emerald-600)"
                icon={<ArrowDownLeft size={16} />}
              />
              <StatCard
                label="Pending Sync"
                value={`${pendingSyncCount} item${pendingSyncCount !== 1 ? 's' : ''}`}
                color={pendingSyncCount > 0 ? 'var(--color-amber-600)' : 'var(--color-emerald-600)'}
                icon={<RefreshCw size={16} />}
                className="col-span-2 sm:col-span-1"
              />
            </div>

            {/* Offline Authorization */}
            {authorization && (
              <Card>
                <CardHeader
                  title="Offline Authorization"
                  action={
                    <Link to="/offline-authorization" className="text-xs text-[var(--color-indigo-600)] font-semibold no-underline hover:underline">
                      Manage
                    </Link>
                  }
                />
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--color-gray-500)]">Used</span>
                      <span className="font-bold text-[var(--color-gray-700)]">
                        {formatCurrency(authorization.maximumAmount - authorization.remainingAmount)} / {formatCurrency(authorization.maximumAmount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-gray-100)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${calcPercentage(authorization.maximumAmount - authorization.remainingAmount, authorization.maximumAmount)}%`,
                          background: 'linear-gradient(90deg, var(--color-emerald-400), var(--color-indigo-500))',
                        }}
                      />
                    </div>
                  </div>
                  <Badge status={authorization.status} />
                </div>
                <div className="flex justify-between text-xs text-[var(--color-gray-500)] pt-2 border-t border-[var(--color-gray-100)]">
                  <span>Remaining: <strong className="text-[var(--color-emerald-600)]">{formatCurrency(authorization.remainingAmount)}</strong></span>
                  <span>Expires {formatRelativeTime(authorization.expiresAt)}</span>
                </div>
              </Card>
            )}
          </div>

          {/* Side Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader title="Wallet Actions" />
              <div className="grid grid-cols-2 gap-3">
                <Link to="/send" className="btn btn-primary btn-md justify-center no-underline">
                  <ArrowUpRight size={18} /> Send
                </Link>
                <Link to="/receive" className="btn btn-outline btn-md justify-center no-underline">
                  <ArrowDownLeft size={18} /> Receive
                </Link>
                <Link to="/offline" className="btn btn-navy btn-md justify-center no-underline col-span-2">
                  <QrCode size={18} /> Offline Payment (QR)
                </Link>
              </div>
            </Card>

            {/* Recent Transactions Card */}
            <Card padding={false}>
              <div className="p-4 border-b border-[var(--color-gray-100)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Recent Transactions</h3>
                  <p className="text-xs text-[var(--color-gray-400)]">Latest wallet activity</p>
                </div>
                <Link to="/transactions" className="text-xs text-[var(--color-indigo-600)] font-semibold no-underline hover:underline">
                  View all
                </Link>
              </div>

              {recentTxs.length === 0 ? (
                <p className="text-sm text-center text-[var(--color-gray-400)] py-8">No transactions yet</p>
              ) : (
                <div className="divide-y divide-[var(--color-gray-50)]">
                  {recentTxs.map(tx => {
                    const isSent = tx.senderId === currentUser?.id;
                    return (
                      <Link
                        key={tx.id}
                        to={`/transactions/${tx.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-gray-50)] transition-colors no-underline group"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: isSent ? '#FEE2E2' : '#D1FAE5' }}
                        >
                          {isSent
                            ? <ArrowUpRight size={15} color="var(--color-red-500)" />
                            : <ArrowDownLeft size={15} color="var(--color-emerald-600)" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--color-gray-800)] truncate">
                            {isSent ? tx.receiverName : tx.senderName}
                          </p>
                          <p className="text-[10px] text-[var(--color-gray-400)]">{formatRelativeTime(tx.timestamp)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-bold ${isSent ? 'text-[var(--color-red-500)]' : 'text-[var(--color-emerald-600)]'}`}>
                            {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                          </p>
                          <Badge status={tx.status} className="!text-[9px] !py-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Sync button */}
            {pendingSyncCount > 0 && !isOffline && (
              <Button
                block
                variant="primary"
                loading={syncStatus === 'syncing'}
                onClick={() => syncTransactions(currentUser)}
                leftIcon={<RefreshCw size={15} />}
              >
                Sync {pendingSyncCount} Pending Transaction{pendingSyncCount !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color, icon, className = '' }) {
  return (
    <div className={`card p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm sm:text-base font-black truncate" style={{ color }}>{value}</p>
    </div>
  );
}

export default Wallet;
