import { Link } from 'react-router-dom';
import {
  WifiOff, ShieldCheck, AlertCircle, ArrowRight, KeyRound, CheckCircle2,
  Zap, Lock, Smartphone
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatRelativeTime } from '../../utils/formatting';

/**
 * OfflineReadinessCard — High-end operational readiness card on the Dashboard.
 * Explains device registration & cryptographic offline spending capacity.
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
      <div className="p-5 sm:p-6 rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs transition-all">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <KeyRound size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Setup Required
              </span>
              <span className="badge badge-warning text-[10px]">Unregistered</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 mt-0.5">
              Cryptographic Key Needed
            </h3>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 leading-relaxed">
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
                className="text-xs font-semibold text-amber-900 dark:text-amber-300 hover:underline px-2 py-1"
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
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <WifiOff size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Offline Capability
              </p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorize Offline Balance
              </h3>
            </div>
          </div>
          <span className="badge badge-pending text-[10px]">Needs Limit</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          Hardware key is active, but no offline spending allowance is currently authorized for this device.
        </p>

        <Link
          to="/offline-authorization"
          className="btn btn-primary btn-sm w-full no-underline shadow-xs"
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
  const maxLimit = authorization.maximumAmount || 1000;
  const percentLeft = Math.round((remaining / maxLimit) * 100);

  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Offline Protection
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Ready for Offline Pay
            </h3>
          </div>
        </div>

        <span className="badge badge-settled text-[10px]">
          100% Ready
        </span>
      </div>

      {/* Metrics Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Remaining limit:</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
            {formatCurrency(remaining)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-slate-400 dark:text-slate-500">Max per payment:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency(authorization.maxSingleTransaction || 500)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 dark:text-slate-500">Authorization valid:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatRelativeTime(authorization.expiresAt)}
          </span>
        </div>
      </div>

      {/* Bottom Link & Hardware Badge */}
      <div className="flex items-center justify-between text-xs pt-1">
        <Link
          to="/offline-authorization"
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 no-underline"
        >
          <span>Manage Allowance</span>
          <ArrowRight size={13} />
        </Link>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          ECDSA P-256
        </span>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
