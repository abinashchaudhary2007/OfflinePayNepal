import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw, KeyRound, WifiOff } from 'lucide-react';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

/**
 * OfflineReadinessCard — Dark-mode-aware offline status card.
 */
export function OfflineReadinessCard({
  device,
  authorization,
  isOffline,
  onRegisterDevice,
  isRegistering = false,
  totalUnsynced = 0,
  syncStatus = 'idle',
  onSync,
}) {
  const { isDark } = useTheme();
  const isDeviceRegistered = !!device && device.status === 'ACTIVE';
  const isAuthActive =
    !!authorization &&
    authorization.status === 'ACTIVE' &&
    new Date(authorization.expiresAt) > new Date();

  const cardStyle = {
    background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
    border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
    borderRadius: '1rem',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    transition: 'all 0.2s',
    boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
  };

  // State 1: Device key needs registration
  if (!isDeviceRegistered) {
    return (
      <div style={cardStyle}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div style={{
            width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
            background: isDark ? 'rgba(242,169,0,0.12)' : '#FFF6DD',
            color: isDark ? '#F2A900' : '#B57F00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyRound size={22} />
          </div>
          <div className="min-w-0">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Setup Offline Device Key
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Register device cryptographic keys to enable offline payments.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={onRegisterDevice}
          disabled={isRegistering}
          loading={isRegistering}
          className="shrink-0"
        >
          Register Key
        </Button>
      </div>
    );
  }

  // State 2: Active & Ready
  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3.5 min-w-0">
        <div style={{
          width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
          background: isDark ? 'rgba(22,166,106,0.12)' : '#E8F8F1',
          color: '#16A66A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={24} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            Offline payments ready
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Your wallet is ready for offline payments.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {totalUnsynced > 0 && !isOffline && (
          <button
            onClick={onSync}
            disabled={syncStatus === 'syncing'}
            style={{
              background: isDark ? 'rgba(242,169,0,0.12)' : '#FFF6DD',
              color: isDark ? '#F2A900' : '#B57F00',
              border: `1px solid ${isDark ? 'rgba(242,169,0,0.25)' : 'rgba(242,169,0,0.30)'}`,
              padding: '3px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
            className="hidden sm:inline-flex"
            title="Reconcile pending transactions"
          >
            <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            <span>Sync ({totalUnsynced})</span>
          </button>
        )}

        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 12px', borderRadius: 9999,
          fontSize: '0.75rem', fontWeight: 700,
          background: isDark ? 'rgba(22,166,106,0.12)' : '#E8F8F1',
          color: '#16A66A',
          border: `1px solid ${isDark ? 'rgba(22,166,106,0.22)' : 'rgba(22,166,106,0.22)'}`,
        }}>
          Active
        </span>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
