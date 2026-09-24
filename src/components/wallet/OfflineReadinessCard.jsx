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
      <div className="p-5 rounded-2xl border border-[#F59E0B]/40 bg-[#111C2E] shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F59E0B]">Setup Required</span>
            </div>
            <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5">
              Device Key Needed
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
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
                className="text-xs font-semibold text-[#38BDF8] hover:underline px-2 py-1 no-underline"
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
      <div className="p-5 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/15 text-[#A78BFA] flex items-center justify-center shrink-0">
              <WifiOff size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Offline Allowance
              </h3>
              <p className="text-[11px] text-[#94A3B8]">Authorization needed</p>
            </div>
          </div>
          <span className="badge badge-pending text-[10px]">Inactive</span>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed mb-3.5">
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
    <div className="p-5 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm hover:border-[#14B8A6]/40 transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">
              Offline Readiness
            </h3>
            <p className="text-[11px] text-[#94A3B8]">Hardware Signed (ECDSA P-256)</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          Active
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#172337] border border-[#263449] text-xs">
        <div>
          <span className="text-[11px] text-[#94A3B8] block mb-0.5">Remaining limit</span>
          <span className="font-extrabold text-sm sm:text-base text-[#14B8A6]">
            {formatCurrency(remaining)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[#94A3B8] block mb-0.5">Max per payment</span>
          <span className="font-bold text-sm text-[#F8FAFC]">
            {formatCurrency(authorization.maxSingleTransaction || 500)}
          </span>
        </div>
      </div>

      {/* Synchronization Status */}
      <div className="pt-2 border-t border-[#263449]">
        {totalUnsynced > 0 ? (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F59E0B]">
                {totalUnsynced} item{totalUnsynced > 1 ? 's' : ''} pending sync
              </p>
              <p className="text-[10px] text-[#94A3B8] truncate">
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
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#22C55E]" />
              <span className="text-[11px] font-medium text-[#F8FAFC]">Ledger Synchronized</span>
            </div>
            {lastSyncTime && (
              <span className="text-[10px] text-[#94A3B8]">
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
          className="font-bold text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-1 no-underline transition-colors"
        >
          <span>Manage Allowance</span>
          <ArrowRight size={12} />
        </Link>
        <Link
          to="/devices"
          className="text-[#94A3B8] hover:text-[#F8FAFC] text-[11px] transition-colors no-underline"
        >
          Device Keys →
        </Link>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
