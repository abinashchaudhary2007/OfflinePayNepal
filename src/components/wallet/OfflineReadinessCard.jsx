import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw, KeyRound, WifiOff } from 'lucide-react';
import Button from '../ui/Button';

/**
 * OfflineReadinessCard — Matches the reference dashboard's horizontal status card:
 * - Green checkmark circle on left
 * - "Offline payments ready" title & "Your wallet is ready for offline payments." subtitle
 * - "Active" status pill on right
 * - Gracefully prompts registration/authorization if pending, and offers sync when needed
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
  const isDeviceRegistered = !!device && device.status === 'ACTIVE';
  const isAuthActive =
    !!authorization &&
    authorization.status === 'ACTIVE' &&
    new Date(authorization.expiresAt) > new Date();

  // State 1: Device key needs registration
  if (!isDeviceRegistered) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl border border-[#DCE3F2] bg-white shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF6DD] text-[#B57F00] flex items-center justify-center shrink-0">
            <KeyRound size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#172033] truncate">
              Setup Offline Device Key
            </h3>
            <p className="text-xs text-[#5F6B85] truncate">
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

  // State 2: Active & Ready (Matches Reference Image)
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-[#DCE3F2] bg-white shadow-xs flex items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-[#E8F8F1] text-[#16A66A] flex items-center justify-center shrink-0">
          <CheckCircle2 size={24} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-[#172033] truncate">
            Offline payments ready
          </h3>
          <p className="text-xs text-[#5F6B85] truncate">
            Your wallet is ready for offline payments.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {totalUnsynced > 0 && !isOffline && (
          <button
            onClick={onSync}
            disabled={syncStatus === 'syncing'}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF6DD] text-[#B57F00] border border-[#F2A900]/30 hover:bg-[#FFE5A3] transition-colors cursor-pointer"
            title="Reconcile pending transactions"
          >
            <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            <span>Sync ({totalUnsynced})</span>
          </button>
        )}

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/20">
          Active
        </span>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
