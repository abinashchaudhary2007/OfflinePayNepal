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
        relative overflow-hidden rounded-2xl p-6 sm:p-7 text-[#F8FAFC]
        border border-[#263449] shadow-lg transition-all duration-300
        bg-gradient-to-br from-[#111C2E] to-[#172337] ${className}
      `}
    >
      {/* Subtle ambient lighting */}
      <div
        className="absolute -top-20 -right-20 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: '#14B8A6' }}
      />

      {/* Top Bar: Card title & Privacy Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]">
            Available Balance
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
            NPR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            isOffline
              ? 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30'
              : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
          }`}>
            {isOffline ? (
              <>
                <WifiOff size={11} />
                <span>Offline</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span>Connected</span>
              </>
            )}
          </span>

          <button
            onClick={() => setIsHidden(h => !h)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#263449]/50 hover:bg-[#263449] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label={isHidden ? 'Show balance' : 'Hide balance'}
            title={isHidden ? 'Show balance' : 'Hide balance'}
          >
            {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>

      {/* Primary Balance Display */}
      <div className="relative z-10 mb-6">
        <div className="font-black text-[#F8FAFC] tracking-tight text-3xl sm:text-4xl md:text-5xl select-none">
          {hide(formatCurrency(wallet.availableBalance))}
        </div>
      </div>

      {/* Offline Reserve Progress & Inflow/Outflow */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-[#263449]">
        {/* Reserve Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-[#94A3B8] font-medium">
              <ShieldCheck size={14} className="text-[#14B8A6]" />
              <span>Offline Spending Reserve</span>
            </div>
            <div className="text-[11px] font-semibold text-[#F8FAFC]">
              {hide(formatCurrency(offlineRemaining))} <span className="text-[#94A3B8] font-normal">available</span>
            </div>
          </div>

          <div className="h-1.5 w-full bg-[#0B1220] rounded-full overflow-hidden border border-[#263449]/60">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, 100 - offlineUsedPercent))}%`,
                background: offlineRemaining < 100 && offlineLimit > 0
                  ? '#F59E0B'
                  : 'linear-gradient(90deg, #14B8A6, #38BDF8)',
              }}
            />
          </div>
        </div>

        {/* Received / Sent Summary */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center">
              <TrendingDown size={12} />
            </div>
            <span className="text-[#94A3B8]">Received:</span>
            <span className="font-semibold text-[#F8FAFC]">{hide(formatCurrency(wallet.totalReceived || 0))}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
              <TrendingUp size={12} />
            </div>
            <span className="text-[#94A3B8]">Sent:</span>
            <span className="font-semibold text-[#F8FAFC]">{hide(formatCurrency(wallet.totalSent || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 sm:p-7 bg-[#111C2E] border border-[#263449] animate-pulse">
      <div className="h-4 w-28 bg-[#263449] rounded mb-4" />
      <div className="h-10 w-48 bg-[#263449] rounded-lg mb-6" />
      <div className="h-12 w-full bg-[#263449]/60 rounded-xl" />
    </div>
  );
}

export default BalanceCard;
