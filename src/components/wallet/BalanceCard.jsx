import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, EyeOff, TrendingUp, TrendingDown, Wifi, WifiOff,
  QrCode, ArrowUpRight, ShieldCheck, Zap
} from 'lucide-react';
import { formatCurrency, calcPercentage } from '../../utils/formatting';

/**
 * BalanceCard — Ultra-premium fintech hero wallet card.
 * Features:
 * - Luxury metallic dark gradient with subtle ambient aura
 * - Detailed EMV smart chip & contactless waves graphic
 * - Instant privacy toggle (eye icon) with bullet masking
 * - Live Offline Allowance reserve meter
 * - Glassmorphic inflow/outflow metrics and quick action chips
 */
function BalanceCard({ wallet, isOffline, className = '' }) {
  const [isHidden, setIsHidden] = useState(false);

  if (!wallet) return <BalanceCardSkeleton />;

  const offlineSpent = wallet.offlineSpent || 0;
  const offlineLimit = wallet.offlineLimit || 0;
  const offlineRemaining = wallet.offlineRemaining !== undefined
    ? wallet.offlineRemaining
    : Math.max(0, offlineLimit - offlineSpent);

  const offlineUsedPercent = offlineLimit > 0
    ? calcPercentage(offlineSpent, offlineLimit)
    : 0;

  const hide = (val) => (isHidden ? '••••••' : val);

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl p-6 sm:p-7 md:p-8 text-white
        border border-slate-800/80 shadow-2xl transition-all duration-300
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 45%, #1E1B4B 100%)',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.45), 0 0 1px 1px rgba(255, 255, 255, 0.08) inset',
      }}
    >
      {/* Background Decorative Mesh Glows */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
      />

      {/* ─── Top Header: EMV Chip, Card Type & Privacy Toggle ─── */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          {/* Detailed Golden EMV Smart Chip */}
          <div
            className="w-10 h-7 sm:w-11 sm:h-8 rounded-lg relative overflow-hidden border border-amber-300/40 shadow-inner flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 60%, #B45309 100%)',
            }}
            title="Cryptographic Hardware Key Emulation"
          >
            <div className="w-full h-[1px] bg-amber-900/30 absolute top-2" />
            <div className="w-full h-[1px] bg-amber-900/30 absolute bottom-2" />
            <div className="h-full w-[1px] bg-amber-900/30 absolute left-3" />
            <div className="h-full w-[1px] bg-amber-900/30 absolute right-3" />
            <div className="w-3.5 h-2.5 rounded border border-amber-900/40 z-10" />
          </div>

          {/* Contactless Waves */}
          <div className="flex items-center gap-0.5 text-white/50" title="Offline Contactless Ready">
            <span className="w-1 h-3 border-r-2 border-white/40 rounded-full" />
            <span className="w-1.5 h-4 border-r-2 border-white/60 rounded-full" />
            <span className="w-2 h-5 border-r-2 border-white/80 rounded-full" />
          </div>

          <span className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-white/90 border border-white/10 backdrop-blur-md">
            <Zap size={11} className="text-amber-400" /> Offline Wallet
          </span>
        </div>

        {/* Right status & Eye Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 backdrop-blur-md text-white/90">
            {isOffline ? (
              <>
                <WifiOff size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Offline Mode</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Online Sync</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsHidden(h => !h)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
            aria-label={isHidden ? 'Show balance' : 'Hide balance'}
            title={isHidden ? 'Show balance' : 'Hide balance'}
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* ─── Hero Balance Display ─── */}
      <div className="relative z-10 mb-6">
        <p className="text-xs font-semibold tracking-wider uppercase text-white/60 mb-1">
          Available Spendable Balance
        </p>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span
            className="font-black text-white tracking-tight select-none"
            style={{ fontSize: 'clamp(2rem, 5.5vw, 3.25rem)', lineHeight: 1.1 }}
          >
            {hide(formatCurrency(wallet.availableBalance))}
          </span>
          <span className="text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
            NPR
          </span>
        </div>
      </div>

      {/* ─── Offline Allowance Reserve Section ─── */}
      <div className="relative z-10 bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 border border-white/10 mb-5 shadow-inner">
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white/90">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Offline Spending Reserve</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-white/70">
            <span>Total Limit:</span>
            <span className="font-bold text-white">{hide(formatCurrency(offlineLimit))}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden my-2 border border-white/5">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{
              width: `${Math.min(100, Math.max(0, 100 - offlineUsedPercent))}%`,
              background: offlineRemaining < 100 && offlineLimit > 0
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #10B981, #34D399)',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-white/60">
            {hide(formatCurrency(offlineSpent))} spent offline
          </span>
          <span className="font-bold text-emerald-400">
            {hide(formatCurrency(offlineRemaining))} ready to spend
          </span>
        </div>
      </div>

      {/* ─── Bottom Metrics & Action Row ─── */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
        {/* Inflow & Outflow Pill Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-1">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingDown size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Received</p>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {hide(formatCurrency(wallet.totalReceived || 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Sent</p>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {hide(formatCurrency(wallet.totalSent || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts right on the card */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            to="/receive"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all no-underline shadow-xs hover:scale-105 active:scale-95"
            title="Open Receive QR"
          >
            <QrCode size={14} />
            <span>My QR</span>
          </Link>
          <Link
            to="/send"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all no-underline hover:scale-105 active:scale-95"
          >
            <span>Send</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-slate-900 border border-slate-800 animate-pulse">
      <div className="h-6 w-36 bg-white/10 rounded mb-4" />
      <div className="h-12 w-64 bg-white/15 rounded-xl mb-6" />
      <div className="h-24 w-full bg-white/10 rounded-2xl mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-white/10 rounded-xl" />
        <div className="h-12 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

export default BalanceCard;
