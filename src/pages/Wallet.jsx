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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F8FAFC] tracking-tight">
            Wallet
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">Manage balances, offline limits, and recent activity</p>
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
                color="#EF4444"
                icon={<ArrowUpRight size={16} />}
              />
              <StatCard
                label="Total Received"
                value={formatCurrency(totalReceived)}
                color="#22C55E"
                icon={<ArrowDownLeft size={16} />}
              />
              <StatCard
                label="Pending Sync"
                value={`${pendingSyncCount} item${pendingSyncCount !== 1 ? 's' : ''}`}
                color={pendingSyncCount > 0 ? '#F59E0B' : '#14B8A6'}
                icon={<RefreshCw size={16} />}
                className="col-span-2 sm:col-span-1"
              />
            </div>

            {/* Offline Authorization */}
            {authorization && (
              <div className="bg-[#111C2E] border border-[#263449] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Offline Authorization</h3>
                  </div>
                  <Link to="/offline-authorization" className="text-xs text-[#14B8A6] font-semibold no-underline hover:text-[#0D9488]">
                    Manage
                  </Link>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">Used</span>
                      <span className="font-bold text-[#F8FAFC]">
                        {formatCurrency(authorization.maximumAmount - authorization.remainingAmount)} / {formatCurrency(authorization.maximumAmount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[#172337] border border-[#263449]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${calcPercentage(authorization.maximumAmount - authorization.remainingAmount, authorization.maximumAmount)}%`,
                          background: 'linear-gradient(90deg, #14B8A6, #38BDF8)',
                        }}
                      />
                    </div>
                  </div>
                  <Badge status={authorization.status} />
                </div>
                <div className="flex justify-between text-xs text-[#94A3B8] pt-3 border-t border-[#263449]">
                  <span>Remaining: <strong className="text-[#14B8A6]">{formatCurrency(authorization.remainingAmount)}</strong></span>
                  <span>Expires {formatRelativeTime(authorization.expiresAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Side Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick Actions Card */}
            <div className="bg-[#111C2E] border border-[#263449] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#F8FAFC] mb-3">Wallet Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/send" className="btn btn-primary btn-md justify-center no-underline shadow-xs">
                  <ArrowUpRight size={18} /> Send
                </Link>
                <Link to="/receive" className="btn btn-secondary btn-md justify-center no-underline">
                  <ArrowDownLeft size={18} /> Receive
                </Link>
                <Link to="/scan" className="btn btn-accent btn-md justify-center no-underline col-span-2">
                  <QrCode size={18} /> Scan QR Code
                </Link>
              </div>
            </div>

            {/* Recent Transactions Card */}
            <div className="bg-[#111C2E] border border-[#263449] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#263449] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">Recent Transactions</h3>
                  <p className="text-xs text-[#94A3B8]">Latest wallet activity</p>
                </div>
                <Link to="/transactions" className="text-xs text-[#14B8A6] font-semibold no-underline hover:text-[#0D9488]">
                  View all
                </Link>
              </div>

              {recentTxs.length === 0 ? (
                <p className="text-sm text-center text-[#94A3B8] py-8">No transactions yet</p>
              ) : (
                <div className="divide-y divide-[#263449]/60">
                  {recentTxs.map(tx => {
                    const isSent = tx.senderId === currentUser?.id;
                    return (
                      <Link
                        key={tx.id}
                        to={`/transactions/${tx.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#172337]/50 transition-colors no-underline group"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                            border: `1px solid ${isSent ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                          }}
                        >
                          {isSent
                            ? <ArrowUpRight size={15} color="#EF4444" />
                            : <ArrowDownLeft size={15} color="#22C55E" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                            {isSent ? tx.receiverName : tx.senderName}
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">{formatRelativeTime(tx.timestamp)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-bold ${isSent ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                            {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                          </p>
                          <Badge status={tx.status} className="!text-[9px] !py-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

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
    <div className={`bg-[#111C2E] border border-[#263449] rounded-2xl p-3 sm:p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm sm:text-base font-black truncate" style={{ color }}>{value}</p>
    </div>
  );
}

export default Wallet;
