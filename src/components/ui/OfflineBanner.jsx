import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * OfflineBanner — Shows current connectivity status.
 * Displayed at the top of the page when offline or in simulation mode.
 */
export function OfflineBanner({ isOffline, isSimulating, onReconnect }) {
  if (!isOffline) return null;

  return (
    <div className="offline-banner animate-fade-in" role="alert" aria-live="polite">
      {isSimulating ? (
        <>
          <AlertTriangle size={15} />
          <span>OFFLINE SIMULATION ACTIVE</span>
          {onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-4 underline text-white hover:text-amber-200 font-semibold text-xs transition-colors"
            >
              Reconnect & Sync
            </button>
          )}
        </>
      ) : (
        <>
          <WifiOff size={15} />
          <span>No internet connection — Offline Mode</span>
        </>
      )}
    </div>
  );
}

/**
 * OnlineStatusPill — Small inline pill showing current connectivity
 */
export function OnlineStatusPill({ isOffline, isSimulating, className = '' }) {
  if (isOffline) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold 
          bg-[var(--color-amber-100)] text-[var(--color-amber-600)] ${className}`}
      >
        <span className="status-dot offline pulse" />
        {isSimulating ? 'Simulating Offline' : 'Offline'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold 
        bg-[var(--color-emerald-100)] text-[var(--color-emerald-600)] ${className}`}
    >
      <span className="status-dot online pulse" />
      Online
    </span>
  );
}

export default OfflineBanner;
