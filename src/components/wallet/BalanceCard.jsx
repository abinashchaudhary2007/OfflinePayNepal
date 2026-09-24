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
        relative overflow-hidden rounded-2xl p-6 sm:p-7 md:p-8 text-[#F8FAFC]
        border border-[#263449] shadow-xl transition-all duration-300
        bg-[#172337] ${className}
      `}
      style={{
        background: 'linear-gradient(145deg, #111C2E 0%, #172337 100%)',
        boxShadow: '0 12px 30px -10px rgba(11, 18, 32, 0.6), 0 0 0 1px rgba(38, 52, 73, 0.5) inset',
      }}
    >
      {/* Subtle Ambient Teal and Sky Accent Accents */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }}
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

          <span className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#111C2E]/80 text-[#38BDF8] border border-[#263449]">
            <Zap size={11} className="text-[#14B8A6]" /> Offline Wallet
          </span>
        </div>

        {/* Right status & Eye Toggle */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
            isOffline
              ? 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30'
              : 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
          }`}>
            {isOffline ? (
              <>
                <WifiOff size={13} className="text-[#A78BFA]" />
                <span className="hidden sm:inline font-bold">Offline Mode</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="hidden sm:inline font-bold">Online Sync</span>
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
        <p className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8] mb-1">
          Available Spendable Balance
        </p>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span
            className="font-black text-[#F8FAFC] tracking-tight select-none"
            style={{ fontSize: 'clamp(2rem, 5.5vw, 3.25rem)', lineHeight: 1.1 }}
          >
            {hide(formatCurrency(wallet.availableBalance))}
          </span>
          <span className="text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
            NPR
          </span>
        </div>
      </div>

      {/* ─── Offline Allowance Reserve Section ─── */}
      <div className="relative z-10 bg-[#111C2E] rounded-2xl p-4 sm:p-4.5 border border-[#263449] mb-5 shadow-inner">
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
            <ShieldCheck size={15} className="text-[#14B8A6]" />
            <span>Offline Spending Reserve</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
            <span>Total Limit:</span>
            <span className="font-bold text-[#F8FAFC]">{hide(formatCurrency(offlineLimit))}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-2 w-full bg-[#0B1220] rounded-full overflow-hidden my-2 border border-[#263449]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{
              width: `${Math.min(100, Math.max(0, 100 - offlineUsedPercent))}%`,
              background: offlineRemaining < 100 && offlineLimit > 0
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #14B8A6, #38BDF8)',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-[#94A3B8]">
            {hide(formatCurrency(offlineSpent))} spent offline
          </span>
          <span className="font-bold text-[#14B8A6]">
            {hide(formatCurrency(offlineRemaining))} ready to spend
          </span>
        </div>
      </div>

      {/* ─── Bottom Metrics & Action Row ─── */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#263449]">
        {/* Inflow & Outflow Pill Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-1">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#111C2E]/60 border border-[#263449]">
            <div className="w-7 h-7 rounded-lg bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
              <TrendingDown size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">Received</p>
              <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
                {hide(formatCurrency(wallet.totalReceived || 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#111C2E]/60 border border-[#263449]">
            <div className="w-7 h-7 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">Sent</p>
              <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
                {hide(formatCurrency(wallet.totalSent || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts right on the card */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            to="/receive"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111C2E] hover:bg-[#172337] text-[#38BDF8] hover:text-white text-xs font-semibold border border-[#263449] transition-all no-underline shadow-xs hover:border-[#38BDF8]/40"
            title="Open Receive QR"
          >
            <QrCode size={14} />
            <span>My QR</span>
          </Link>
          <Link
            to="/send"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] text-xs font-black shadow-md shadow-[#14B8A6]/20 transition-all no-underline hover:scale-105 active:scale-95"
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
