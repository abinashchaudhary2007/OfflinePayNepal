/**
 * Wallet.jsx — Clean, modern fintech wallet view.
 * Features:
 * - Real-time spendable balance & offline reserve
 * - Financial flow & volume summary (Inflow, Outflow, Net Volume)
 * - Cryptographic offline allowance inspector with progress gauge
 * - Streamlined wallet action hub (Send, Receive, Scan, Merchant)
 * - Filterable recent activity preview (All, Received, Sent, Offline)
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, RefreshCw, ShieldCheck,
  QrCode, Store, TrendingUp, TrendingDown, WifiOff,
  CheckCircle2, ChevronRight, History
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import BalanceCard from '../components/wallet/BalanceCard';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatRelativeTime, calcPercentage, formatTxIdShort } from '../utils/formatting';

function Wallet() {
  const { currentUser } = useAuth();
  const {
    wallet, authorization, transactions,
    pendingSyncCount, syncTransactions, syncStatus, isInitialized
  } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'received' | 'sent' | 'offline'

  // Financial aggregates
  const totalSent = useMemo(() => (
    transactions
      .filter(tx => tx.senderId === currentUser?.id && tx.status === 'SETTLED')
      .reduce((s, tx) => s + tx.amount, 0)
  ), [transactions, currentUser?.id]);

  const totalReceived = useMemo(() => (
    transactions
      .filter(tx => tx.receiverId === currentUser?.id && tx.status === 'SETTLED')
      .reduce((s, tx) => s + tx.amount, 0)
  ), [transactions, currentUser?.id]);

  const totalVolume = totalSent + totalReceived;

  // Harmonized wallet object
  const harmonizedWallet = wallet ? {
    ...wallet,
    totalSent,
    totalReceived,
  } : null;

  // Filtered transactions for preview
  const filteredTxs = useMemo(() => {
    let list = transactions;
    if (activeTab === 'received') {
      list = list.filter(tx => tx.receiverId === currentUser?.id);
    } else if (activeTab === 'sent') {
      list = list.filter(tx => tx.senderId === currentUser?.id);
    } else if (activeTab === 'offline') {
      list = list.filter(tx => tx.isOffline);
    }
    return list.slice(0, 6);
  }, [transactions, activeTab, currentUser?.id]);

  // Offline allowance data
  const isAuthActive =
    !!authorization &&
    authorization.status === 'ACTIVE' &&
    new Date(authorization.expiresAt) > new Date();

  const allowanceUsed = authorization
    ? Math.max(0, (authorization.maximumAmount || 0) - (authorization.remainingAmount || 0))
    : 0;

  const allowancePercent = authorization && authorization.maximumAmount > 0
    ? calcPercentage(allowanceUsed, authorization.maximumAmount)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* ─── 1. Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              My Wallet
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
              Spendable balance, offline allowance limits, and ledger activity
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {pendingSyncCount > 0 && !isOffline ? (
              <Button
                size="sm"
                variant="primary"
                loading={syncStatus === 'syncing'}
                onClick={() => syncTransactions(currentUser)}
                leftIcon={<RefreshCw size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />}
              >
                Reconcile ({pendingSyncCount})
              </Button>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isOffline
                  ? 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30'
                  : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
              }`}>
                {isOffline ? (
                  <>
                    <WifiOff size={12} />
                    <span>Offline Simulated</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span>Ledger In Sync</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ─── 2. Main 12-Column Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ─── Left Main Column (7 cols on lg, 8 on xl) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* Hero Balance Card */}
            {isInitialized ? (
              <BalanceCard wallet={harmonizedWallet} isOffline={isOffline} />
            ) : (
              <div className="rounded-2xl p-6 sm:p-7 bg-[#111C2E] border border-[#263449] animate-pulse h-56" />
            )}

            {/* Financial Flow & Volume Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Inflow */}
              <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#263449] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Inflow (Received)
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center">
                    <TrendingDown size={13} />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-[#22C55E] tracking-tight">
                  +{formatCurrency(totalReceived)}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Settled credits</p>
              </div>

              {/* Total Outflow */}
              <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#263449] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Outflow (Sent)
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
                    <TrendingUp size={13} />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-[#EF4444] tracking-tight">
                  -{formatCurrency(totalSent)}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Settled debits</p>
              </div>

              {/* Total Volume */}
              <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#263449] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Total Volume
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
                    <CheckCircle2 size={13} />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-[#F8FAFC] tracking-tight">
                  {formatCurrency(totalVolume)}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Offline Spending Allowance Inspector */}
            <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#263449] shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#172337] border border-[#263449] text-[#14B8A6] flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Offline Spending Allowance
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Local ECDSA P-256 spending authorization
                    </p>
                  </div>
                </div>

                <Link
                  to="/offline-authorization"
                  className="text-xs font-bold text-[#38BDF8] hover:text-[#14B8A6] no-underline transition-colors flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {authorization ? (
                <div className="space-y-3.5">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">
                        Spent: <strong className="text-[#F8FAFC]">{formatCurrency(allowanceUsed)}</strong>
                      </span>
                      <span className="text-[#94A3B8]">
                        Allowance: <strong className="text-[#F8FAFC]">{formatCurrency(authorization.maximumAmount)}</strong>
                      </span>
                    </div>

                    <div className="h-2 rounded-full overflow-hidden bg-[#0B1220] border border-[#263449]/70">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(0, 100 - allowancePercent))}%`,
                          background: 'linear-gradient(90deg, #14B8A6, #38BDF8)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#172337] border border-[#263449] text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-0.5">
                        Remaining
                      </span>
                      <span className="font-extrabold text-[#14B8A6] text-sm sm:text-base">
                        {formatCurrency(authorization.remainingAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-0.5">
                        Max Per Payment
                      </span>
                      <span className="font-bold text-[#F8FAFC] text-sm">
                        {formatCurrency(authorization.maxSingleTransaction || 500)}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-0.5">
                        Validity
                      </span>
                      <span className="font-semibold text-[#F8FAFC] text-xs">
                        {formatRelativeTime(authorization.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#172337]/50 border border-[#263449] text-center space-y-2">
                  <p className="text-xs text-[#94A3B8]">
                    No active offline spending allowance authorized on this device.
                  </p>
                  <Link
                    to="/offline-authorization"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] text-xs font-bold transition-colors no-underline"
                  >
                    <span>Authorize Spending Reserve</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Operational Sidebar (5 cols on lg, 4 on xl) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
            {/* Quick Actions Panel */}
            <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#263449] shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Wallet Actions
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/send"
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] font-black text-xs shadow-sm transition-all duration-150 no-underline hover:-translate-y-0.5 cursor-pointer"
                >
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                  <span>Send</span>
                </Link>

                <Link
                  to="/receive"
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#172337] hover:bg-[#20304a] text-[#22C55E] border border-[#263449] font-bold text-xs shadow-xs transition-all duration-150 no-underline hover:-translate-y-0.5 cursor-pointer"
                >
                  <ArrowDownLeft size={16} />
                  <span>Receive</span>
                </Link>

                <Link
                  to="/scan"
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#172337] hover:bg-[#20304a] text-[#38BDF8] border border-[#263449] font-bold text-xs shadow-xs transition-all duration-150 no-underline hover:-translate-y-0.5 cursor-pointer"
                >
                  <QrCode size={16} />
                  <span>Scan QR</span>
                </Link>

                <Link
                  to="/send?mode=shop"
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#172337] hover:bg-[#20304a] text-[#F59E0B] border border-[#263449] font-bold text-xs shadow-xs transition-all duration-150 no-underline hover:-translate-y-0.5 cursor-pointer"
                >
                  <Store size={16} />
                  <span>Merchant</span>
                </Link>
              </div>
            </div>

            {/* Filterable Recent Activity Card */}
            <div className="rounded-2xl bg-[#111C2E] border border-[#263449] shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="p-4 border-b border-[#263449] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    Recent Activity
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Latest wallet transactions
                  </p>
                </div>
                <Link
                  to="/transactions"
                  className="text-xs font-semibold text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-0.5 no-underline transition-colors"
                >
                  <span>View all</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 bg-[#0B1220]/40 border-b border-[#263449] text-xs overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'received', label: 'In' },
                  { id: 'sent', label: 'Out' },
                  { id: 'offline', label: 'Offline' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[#172337] text-[#14B8A6] border border-[#263449]'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              {filteredTxs.length === 0 ? (
                <div className="p-6 text-center text-[#94A3B8] space-y-1">
                  <p className="text-xs font-medium">No activity for this filter</p>
                  <p className="text-[10px]">Transactions will appear here when recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#263449]/50">
                  {filteredTxs.map(tx => {
                    const isSent = tx.senderId === currentUser?.id;
                    const otherParty = isSent ? tx.receiverName : tx.senderName;

                    return (
                      <Link
                        key={tx.id}
                        to={`/transactions/${tx.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#172337]/50 transition-colors no-underline group"
                      >
                        {/* Direction Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                            isSent
                              ? 'bg-[#EF4444]/15 text-[#EF4444]'
                              : 'bg-[#22C55E]/15 text-[#22C55E]'
                          }`}
                        >
                          {isSent ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                        </div>

                        {/* Party & Time */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[#F8FAFC] truncate group-hover:text-[#14B8A6] transition-colors">
                              {otherParty || 'Unknown Party'}
                            </p>
                            {tx.isOffline && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
                                Offline
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">
                            {formatRelativeTime(tx.timestamp)}
                          </p>
                        </div>

                        {/* Amount & Status */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-extrabold ${
                            isSent ? 'text-[#EF4444]' : 'text-[#22C55E]'
                          }`}>
                            {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                          </p>
                          <Badge status={tx.status} className="!text-[9px] !py-0 !px-1 mt-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Wallet;
