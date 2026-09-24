import { Link } from 'react-router-dom';
import {
  WifiOff, ShieldCheck, ArrowRight, KeyRound
} from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency, formatRelativeTime } from '../../utils/formatting';

/**
 * OfflineReadinessCard — Operational readiness card on the Dashboard.
 * Explains device registration & cryptographic offline spending capacity.
 * Styled with Midnight Navy (#111C2E / #172337), Electric Teal, and Sky Blue.
 */
export function OfflineReadinessCard({
  device,
  authorization,
  isOffline,
  onRegisterDevice,
  isRegistering = false,
}) {
  const isDeviceRegistered = !!device && device.status === 'ACTIVE';
  const isAuthActive =
    !!authorization &&
    authorization.status === 'ACTIVE' &&
    new Date(authorization.expiresAt) > new Date();

  // ─── STATE 1: Device Not Registered ───────────────────────────
  if (!isDeviceRegistered) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl border border-[#F59E0B]/40 bg-[#111C2E] shadow-sm transition-all">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
            <KeyRound size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                Setup Required
              </span>
              <span className="badge badge-pending text-[10px]">Unregistered</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] mt-0.5">
              Cryptographic Key Needed
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Generate local ECDSA P-256 keys on this device to sign payments without network connectivity.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <Button
                size="sm"
                variant="primary"
                onClick={onRegisterDevice}
                disabled={isRegistering}
                loading={isRegistering}
                id="btn-register-device-cta"
              >
                Register Device Now
              </Button>
              <Link
                to="/devices"
                className="text-xs font-semibold text-[#38BDF8] hover:underline px-2 py-1 no-underline"
              >
                Learn More
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
      <div className="p-5 sm:p-6 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#A78BFA]/15 text-[#A78BFA] flex items-center justify-center shrink-0">
              <WifiOff size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Offline Capability
              </p>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Authorize Offline Balance
              </h3>
            </div>
          </div>
          <span className="badge badge-pending text-[10px]">Needs Limit</span>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
          Hardware key is active, but no offline spending allowance is currently authorized for this device.
        </p>

        <Link
          to="/offline-authorization"
          className="btn btn-primary btn-sm w-full no-underline shadow-xs flex items-center justify-center gap-1.5"
          id="btn-get-offline-auth"
        >
          <span>Authorize Offline Balance</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // ─── STATE 3: Fully Ready For Offline Payments ─────────────────
  const remaining = authorization.remainingAmount || 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[#263449] bg-[#111C2E] shadow-sm hover:border-[#14B8A6]/40 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Offline Protection
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight">
              Ready for Offline Pay
            </h3>
          </div>
        </div>

        <span className="badge badge-settled text-[10px]">
          100% Ready
        </span>
      </div>

      {/* Metrics Card */}
      <div className="p-3.5 rounded-xl bg-[#172337] border border-[#263449] space-y-2.5 text-xs mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8]">Remaining limit:</span>
          <span className="font-black text-[#14B8A6] text-sm sm:text-base">
            {formatCurrency(remaining)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#263449]">
          <span className="text-[#94A3B8]">Max per payment:</span>
          <span className="font-semibold text-[#F8FAFC]">
            {formatCurrency(authorization.maxSingleTransaction || 500)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#94A3B8]">Authorization valid:</span>
          <span className="font-semibold text-[#F8FAFC]">
            {formatRelativeTime(authorization.expiresAt)}
          </span>
        </div>
      </div>

      {/* Bottom Link & Hardware Badge */}
      <div className="flex items-center justify-between text-xs pt-1">
        <Link
          to="/offline-authorization"
          className="font-bold text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-1 no-underline transition-colors"
        >
          <span>Manage Allowance</span>
          <ArrowRight size={13} />
        </Link>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#172337] text-[#94A3B8] border border-[#263449]">
          ECDSA P-256
        </span>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
