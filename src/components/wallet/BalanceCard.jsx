import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

/**
 * BalanceCard — High-contrast Fintech style balance card with generous padding & inline refresh.
 * Features:
 * - AVAILABLE BALANCE label & Privacy eye toggle
 * - High-contrast large NPR balance with inline Refresh button
 * - Currency badge & Offline spending limit indicator
 * - Guaranteed padding and breathing room across all screen sizes
 */
function BalanceCard({ wallet, isOffline, onRefresh, isRefreshing = false, syncStatus = 'idle', className = '' }) {
  const [isHidden, setIsHidden] = useState(false);
  const [localSpinning, setLocalSpinning] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  if (!wallet) return <BalanceCardSkeleton />;

  const offlineSpent = wallet.offlineSpent || 0;
  const offlineLimit = wallet.offlineLimit || 0;
  const offlineRemaining = wallet.offlineRemaining !== undefined
    ? wallet.offlineRemaining
    : Math.max(0, offlineLimit - offlineSpent);

  const hide = (val) => (isHidden ? '••••••' : val);

  const handleRefreshClick = async (e) => {
    e.stopPropagation();
    if (localSpinning || isRefreshing) return;

    setLocalSpinning(true);
    setJustRefreshed(false);

    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('[balance refresh error]', err);
    } finally {
      setTimeout(() => {
        setLocalSpinning(false);
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2500);
      }, 600);
    }
  };

  const isSpinning = localSpinning || isRefreshing || syncStatus === 'syncing';

  return (
    <div
      style={{
        padding: '30px 32px',
        borderRadius: '1.5rem',
        background: 'linear-gradient(135deg, #172B75 0%, #1C358A 50%, #2B4DAE 100%)',
        boxShadow: '0 14px 35px -8px rgba(23, 43, 117, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF',
      }}
      className={`select-none transition-all ${className}`}
    >
      {/* Decorative overlapping translucent concentric circles watermark */}
      <div
        style={{
          position: 'absolute',
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          opacity: 0.22,
          userSelect: 'none',
        }}
      >
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="170" cy="170" r="160" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="170" cy="170" r="120" stroke="white" strokeWidth="2" />
          <circle cx="170" cy="170" r="80" fill="white" fillOpacity="0.08" />
          <circle cx="170" cy="170" r="40" fill="white" fillOpacity="0.12" />
        </svg>
      </div>

      {/* ─── Top Row: Label, Status Pill & Privacy Toggle ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            Available Balance
          </span>
          {justRefreshed && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#34D399',
                background: 'rgba(22, 166, 106, 0.25)',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
              className="animate-fade-in"
            >
              <CheckCircle2 size={11} />
              <span>Updated</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setIsHidden(h => !h)}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          aria-label={isHidden ? 'Show balance' : 'Hide balance'}
          title={isHidden ? 'Show balance' : 'Hide balance'}
        >
          {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* ─── Balance Amount Row with Refresh Button ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          margin: '10px 0 12px 0',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {hide(formatCurrency(wallet.availableBalance))}
        </div>

        {/* Refresh Button beside Amount */}
        <button
          id="dashboard-refresh-balance-btn"
          onClick={handleRefreshClick}
          disabled={isSpinning}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            cursor: isSpinning ? 'default' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!isSpinning) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
          }}
          onMouseLeave={e => {
            if (!isSpinning) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          aria-label="Refresh balance and sync transactions"
          title="Refresh balance"
        >
          <RefreshCw
            size={18}
            style={{
              transition: 'transform 0.4s ease',
              animation: isSpinning ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      {/* Currency Label Pill */}
      <div style={{ position: 'relative', zIndex: 10, marginBottom: '18px' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {wallet.currency || 'NPR'}
        </span>
      </div>

      {/* ─── Bottom Status Line: Offline Limit & Sync State ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          paddingTop: '16px',
          marginTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '0.8125rem',
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '9999px',
              background: '#16A66A',
              boxShadow: '0 0 8px #16A66A',
              flexShrink: 0,
            }}
          />
          <span>
            Offline spending limit:{' '}
            <strong style={{ fontWeight: 800, color: '#FFFFFF' }}>
              {hide(formatCurrency(offlineRemaining > 0 ? offlineRemaining : wallet.availableBalance))}
            </strong>
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)' }}>
          {isOffline ? '⚡ Offline Ready' : '🟢 Real-time Sync'}
        </div>
      </div>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <div
      style={{
        padding: '30px 32px',
        borderRadius: '1.5rem',
        background: '#172B75',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        height: '210px',
      }}
      className="animate-pulse"
    />
  );
}

export default BalanceCard;
