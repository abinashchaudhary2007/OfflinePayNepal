import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

/**
 * BalanceCard — Matches the UPI-style modern reference dashboard card.
 * Features:
 * - AVAILABLE BALANCE label
 * - High-contrast large NPR balance
 * - Dynamic offline spending limit indicator with status dot
 * - Elegant circular watermark graphic on right
 */
function BalanceCard({ wallet, isOffline, className = '' }) {
  const [isHidden, setIsHidden] = useState(false);

  if (!wallet) return <BalanceCardSkeleton />;

  const offlineSpent = wallet.offlineSpent || 0;
  const offlineLimit = wallet.offlineLimit || 0;
  const offlineRemaining = wallet.offlineRemaining !== undefined
    ? wallet.offlineRemaining
    : Math.max(0, offlineLimit - offlineSpent);

  const hide = (val) => (isHidden ? '••••••' : val);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-9 text-white
        bg-gradient-to-r from-[#172B75] via-[#1C358A] to-[#2B4DAE]
        border border-white/10 shadow-lg ${className}
      `}
      style={{ boxShadow: '0 12px 30px -8px rgba(23, 43, 117, 0.4)' }}
    >
      {/* Decorative overlapping translucent concentric circles watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-20 select-none">
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="170" cy="170" r="160" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="170" cy="170" r="120" stroke="white" strokeWidth="2" />
          <circle cx="170" cy="170" r="80" fill="white" fillOpacity="0.08" />
          <circle cx="170" cy="170" r="40" fill="white" fillOpacity="0.12" />
        </svg>
      </div>

      {/* Top row: Label and Eye Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
          Available Balance
        </span>

        <button
          onClick={() => setIsHidden(h => !h)}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          aria-label={isHidden ? 'Show balance' : 'Hide balance'}
          title={isHidden ? 'Show balance' : 'Hide balance'}
        >
          {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Balance Amount Display */}
      <div className="relative z-10 my-4 sm:my-5">
        <div className="text-4xl sm:text-5xl font-black text-white tracking-tight select-none">
          {hide(formatCurrency(wallet.availableBalance))}
        </div>
        <p className="text-xs font-bold text-white/70 mt-2 uppercase tracking-widest">
          NPR
        </p>
      </div>

      {/* Offline spending limit status line */}
      <div className="relative z-10 mt-6 sm:mt-7 pt-4 sm:pt-5 border-t border-white/15 flex items-center gap-2.5 text-xs sm:text-sm font-medium text-white/90">
        <span className="w-2.5 h-2.5 rounded-full bg-[#16A66A] shadow-xs" />
        <span>
          Offline spending limit:{' '}
          <strong className="font-bold text-white">
            {hide(formatCurrency(offlineRemaining > 0 ? offlineRemaining : wallet.availableBalance))}
          </strong>
        </span>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl sm:rounded-3xl p-7 bg-[#172B75] animate-pulse h-48 sm:h-52 border border-white/10" />
  );
}

export default BalanceCard;
