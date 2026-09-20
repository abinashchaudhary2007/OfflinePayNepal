import { useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, Wifi, WifiOff, Clock } from 'lucide-react';
import { formatCurrency, calcPercentage } from '../../utils/formatting';

/**
 * BalanceCard — Main wallet balance display (navy card).
 * Shows available balance, offline limit, remaining offline amount.
 */
function BalanceCard({ wallet, isOffline, className = '' }) {
  const [isHidden, setIsHidden] = useState(false);

  if (!wallet) return <BalanceCardSkeleton />;

  const offlineUsedPercent = calcPercentage(
    wallet.offlineLimit - wallet.offlineRemaining,
    wallet.offlineLimit
  );

  const hide = (val) => isHidden ? 'Rs. ●●●●' : val;

  return (
    <div className={`card-navy p-6 md:p-8 ${className}`}>
      {/* Card header */}
      <div className="relative z-10 flex items-start justify-between mb-4 sm:mb-6">
        <div>
          <p className="text-white/60 text-xs sm:text-sm font-medium">Available Balance</p>
          <div className="flex items-end gap-2 sm:gap-3 mt-1">
            <span
              className="font-bold text-white tracking-tight"
              style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', lineHeight: 1.1 }}
            >
              {hide(formatCurrency(wallet.availableBalance))}
            </span>
            <span className="text-white/50 text-xs sm:text-sm mb-1 font-medium">NPR</span>
          </div>
        </div>
        <button
          onClick={() => setIsHidden(h => !h)}
          className="text-white/50 hover:text-white transition-colors p-1"
          aria-label={isHidden ? 'Show balance' : 'Hide balance'}
        >
          {isHidden ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>

      {/* Offline allowance section */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xs rounded-xl p-4 sm:p-5 mb-5 border border-white/10">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isOffline ? (
              <WifiOff size={16} className="text-amber-300 flex-shrink-0" />
            ) : (
              <Wifi size={16} className="text-emerald-300 flex-shrink-0" />
            )}
            <span className="text-white/80 text-xs sm:text-sm font-semibold">Offline Allowance</span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-white/60 text-xs mr-1">Limit:</span>
            <span className="text-white text-xs sm:text-sm font-bold">
              {hide(formatCurrency(wallet.offlineLimit))}
            </span>
          </div>
        </div>

        {/* Progress bar with explicit track height and margin */}
        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden my-2.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, offlineUsedPercent))}%`,
              background: offlineUsedPercent > 80
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #34D399, #10B981)',
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-1 gap-2 text-xs">
          <span className="text-white/60 font-medium">
            {hide(formatCurrency(wallet.offlineSpent))} spent
          </span>
          <span className="text-emerald-300 font-bold">
            {hide(formatCurrency(wallet.offlineRemaining))} remaining
          </span>
        </div>
      </div>

      {/* Stats row with top divider */}
      <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={16} className="text-emerald-300" />
          </div>
          <div className="min-w-0">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Total Received</p>
            <p className="text-white text-xs sm:text-sm md:text-base font-bold truncate">
              {hide(formatCurrency(wallet.totalReceived))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-red-300" />
          </div>
          <div className="min-w-0">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Total Sent</p>
            <p className="text-white text-xs sm:text-sm md:text-base font-bold truncate">
              {hide(formatCurrency(wallet.totalSent))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div className="card-navy p-6 md:p-8">
      <div className="skeleton h-5 w-32 mb-2 bg-white/20" />
      <div className="skeleton h-12 w-48 mb-6 bg-white/20" />
      <div className="skeleton h-20 w-full mb-4 rounded-xl bg-white/20" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-10 bg-white/20" />
        <div className="skeleton h-10 bg-white/20" />
      </div>
    </div>
  );
}

export default BalanceCard;
