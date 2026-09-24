import { useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { formatCurrency, calcPercentage } from '../../utils/formatting';

/**
 * BalanceCard — Clean, modern fintech hero wallet card.
 * Minimalist dark gradient with clear balance, privacy toggle, and offline reserve bar.
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
        relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white
        border border-white/15 shadow-xl transition-all duration-300
        bg-gradient-to-br from-[#172B75] to-[#3155B8] ${className}
      `}
      style={{ boxShadow: '0 10px 25px -5px rgba(23, 43, 117, 0.35)' }}
    >
      {/* Subtle ambient lighting */}
      <div
        className="absolute -top-20 -right-20 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl bg-[#4F6FD8]"
      />

      {/* Top Bar: Card title & Privacy Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#EAF0FF]/80">
            Available Balance
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
            NPR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            isOffline
              ? 'bg-[#FFF6DD] text-[#8C6200] border-[#F2A900]/40 font-semibold'
              : 'bg-white/15 text-white border-white/20'
          }`}>
            {isOffline ? (
              <>
                <WifiOff size={11} />
                <span>Offline</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A] shadow-xs" />
                <span>Connected</span>
              </>
            )}
          </span>

          <button
            onClick={() => setIsHidden(h => !h)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label={isHidden ? 'Show balance' : 'Hide balance'}
            title={isHidden ? 'Show balance' : 'Hide balance'}
          >
            {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>

      {/* Primary Balance Display */}
      <div className="relative z-10 mb-6">
        <div className="font-black text-white tracking-tight text-3xl sm:text-4xl md:text-5xl select-none">
          {hide(formatCurrency(wallet.availableBalance))}
        </div>
      </div>

      {/* Offline Reserve Progress & Inflow/Outflow */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-white/15">
        {/* Reserve Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-[#EAF0FF]/90 font-medium">
              <ShieldCheck size={14} className="text-[#EAF0FF]" />
              <span>Offline Spending Reserve</span>
            </div>
            <div className="text-[11px] font-semibold text-white">
              {hide(formatCurrency(offlineRemaining))} <span className="text-[#EAF0FF]/70 font-normal">available</span>
            </div>
          </div>

          <div className="h-2 w-full bg-[#0C1740]/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, 100 - offlineUsedPercent))}%`,
                background: offlineRemaining < 100 && offlineLimit > 0
                  ? '#F2A900'
                  : 'linear-gradient(90deg, #4F6FD8, #EAF0FF)',
              }}
            />
          </div>
        </div>

        {/* Received / Sent Summary */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/15 text-[#E8F8F1] flex items-center justify-center">
              <TrendingDown size={12} className="text-[#16A66A]" />
            </div>
            <span className="text-[#EAF0FF]/80">Received:</span>
            <span className="font-bold text-white">{hide(formatCurrency(wallet.totalReceived || 0))}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/15 text-white flex items-center justify-center">
              <TrendingUp size={12} className="text-[#FDECEC]" />
            </div>
            <span className="text-[#EAF0FF]/80">Sent:</span>
            <span className="font-bold text-white">{hide(formatCurrency(wallet.totalSent || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 sm:p-7 bg-[#172B75] border border-white/10 animate-pulse">
      <div className="h-4 w-28 bg-white/20 rounded mb-4" />
      <div className="h-10 w-48 bg-white/20 rounded-lg mb-6" />
      <div className="h-12 w-full bg-white/10 rounded-xl" />
    </div>
  );
}

export default BalanceCard;
