import { Link } from 'react-router-dom';
import {
  WifiOff, ShieldCheck, ArrowRight, KeyRound, RefreshCw, CheckCircle2
} from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency, formatRelativeTime } from '../../utils/formatting';

/**
 * OfflineReadinessCard — Unified Offline & Ledger Status widget.
 * Combines offline allowance with ledger synchronization in a clean, uncluttered card.
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
  lastSyncTime,
}) {
  const isDeviceRegistered = !!device && device.status === 'ACTIVE';
  const isAuthActive =
    !!authorization &&
    authorization.status === 'ACTIVE' &&
    new Date(authorization.expiresAt) > new Date();

  // ─── STATE 1: Device Not Registered ───────────────────────────
  if (!isDeviceRegistered) {
    return (
      <div className="p-5 rounded-2xl border border-[#F2A900]/40 bg-white shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF6DD] text-[#F2A900] flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2A900]">Setup Required</span>
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-0.5">
              Device Key Needed
            </h3>
            <p className="text-xs text-[#5F6B85] mt-1 leading-relaxed">
              Generate local cryptographic keys to sign payments without network connectivity.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={onRegisterDevice}
                disabled={isRegistering}
                loading={isRegistering}
                id="btn-register-device-cta"
              >
                Register Device
              </Button>
              <Link
                to="/devices"
                className="text-xs font-semibold text-[#3155B8] hover:underline px-2 py-1 no-underline"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE 2: Registered, but No Active Offline Authorization ────
  if (!isAuthActive) {
    return (
      <div className="p-5 rounded-2xl border border-[#DCE3F2] bg-white shadow-xs">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center shrink-0">
              <WifiOff size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Offline Allowance
              </h3>
              <p className="text-[11px] text-[#5F6B85]">Authorization needed</p>
            </div>
          </div>
          <span className="badge badge-pending text-[10px]">Inactive</span>
        </div>

        <p className="text-xs text-[#5F6B85] leading-relaxed mb-3.5">
          Authorize an offline spending reserve to pay when disconnected from the internet.
        </p>

        <Link
          to="/offline-authorization"
          className="btn btn-primary btn-sm w-full no-underline shadow-xs flex items-center justify-center gap-1.5"
          id="btn-get-offline-auth"
        >
          <span>Authorize Offline Balance</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  // ─── STATE 3: Active & Ready ──────────────────────────────────
  const remaining = authorization.remainingAmount || 0;

  return (
    <div className="p-5 rounded-2xl border border-[#DCE3F2] bg-white shadow-xs transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F8F1] text-[#16A66A] flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033]">
              Offline Readiness
            </h3>
            <p className="text-[11px] text-[#5F6B85]">Hardware Signed (ECDSA P-256)</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A]" />
          Active
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2] text-xs">
        <div>
          <span className="text-[11px] text-[#5F6B85] block mb-0.5">Remaining limit</span>
          <span className="font-extrabold text-sm sm:text-base text-[#172B75]">
            {formatCurrency(remaining)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[#5F6B85] block mb-0.5">Max per payment</span>
          <span className="font-bold text-sm text-[#172033]">
            {formatCurrency(authorization.maxSingleTransaction || 500)}
          </span>
        </div>
      </div>

      {/* Synchronization Status */}
      <div className="pt-2 border-t border-[#DCE3F2]">
        {totalUnsynced > 0 ? (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FFF6DD] border border-[#F2A900]/30">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#8C6200]">
                {totalUnsynced} item{totalUnsynced > 1 ? 's' : ''} pending sync
              </p>
              <p className="text-[10px] text-[#5F6B85] truncate">
                Will settle automatically online
              </p>
            </div>
            <Button
              size="xs"
              variant="primary"
              disabled={isOffline || syncStatus === 'syncing'}
              loading={syncStatus === 'syncing'}
              onClick={onSync}
              id="btn-dashboard-sync"
            >
              Sync Now
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#5F6B85]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#16A66A]" />
              <span className="text-[11px] font-medium text-[#172033]">Ledger Synchronized</span>
            </div>
            {lastSyncTime && (
              <span className="text-[10px] text-[#8993A8]">
                {formatRelativeTime(lastSyncTime)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Manage Allowance link */}
      <div className="pt-1 flex items-center justify-between text-xs">
        <Link
          to="/offline-authorization"
          className="font-bold text-[#3155B8] hover:text-[#172B75] flex items-center gap-1 no-underline transition-colors"
        >
          <span>Manage Allowance</span>
          <ArrowRight size={12} />
        </Link>
        <Link
          to="/devices"
          className="text-[#8993A8] hover:text-[#172033] text-[11px] transition-colors no-underline"
        >
          Device Keys →
        </Link>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
