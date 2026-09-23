import { Link } from 'react-router-dom';
import {
  WifiOff, ShieldCheck, AlertCircle, ArrowRight, KeyRound, CheckCircle2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatRelativeTime } from '../../utils/formatting';

/**
 * OfflineReadinessCard — Explains device registration & offline spending capacity clearly.
 * Dynamically displays:
 * 1. Device Setup Required (if device not registered)
 * 2. Authorization Required (if device registered but no active authorization)
 * 3. Ready for Offline Payments (if active authorization present)
 */
export function OfflineReadinessCard({
  device,
  authorization,
  isOffline,
  onRegisterDevice,
  isRegistering = false,
}) {
  const isDeviceRegistered = !!device && device.status === 'ACTIVE';
  const isAuthActive = !!authorization && authorization.status === 'ACTIVE' && new Date(authorization.expiresAt) > new Date();

  // ─── STATE 1: Device Not Registered ───────────────────────────
  if (!isDeviceRegistered) {
    return (
      <div className="card p-5 border-2 border-dashed border-amber-300 bg-amber-50/60 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <KeyRound size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Setup Required
              </span>
              <span className="badge badge-warning text-[10px]">Unregistered</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-amber-950 mt-0.5">
              Device Registration Needed
            </h3>
            <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
              Generate local cryptographic keys (P-256) on this browser to sign and verify payments when offline.
            </p>
            <div className="mt-3.5 flex items-center gap-2">
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
                className="text-xs font-semibold text-amber-900 hover:underline px-2 py-1"
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
      <div className="card p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center flex-shrink-0">
              <WifiOff size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                Offline Capability
              </p>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)]">
                Offline Authorization Inactive
              </h3>
            </div>
          </div>
          <span className="badge badge-pending text-[10px]">Needs Limit</span>
        </div>

        <p className="text-xs text-[var(--color-gray-500)] leading-relaxed mb-4">
          Device <span className="font-mono font-semibold text-[var(--color-gray-700)]">{device.id}</span> is linked, but no offline spending balance is currently authorized.
        </p>

        <Link
          to="/offline-authorization"
          className="btn btn-primary btn-sm w-full no-underline"
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
    <div className="card p-5 border border-slate-200 bg-white rounded-2xl shadow-xs hover:border-[var(--color-indigo-300)] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
              Offline Wallet
            </p>
            <h3 className="text-sm font-bold text-[var(--color-gray-900)]">
              Ready for Offline Pay
            </h3>
          </div>
        </div>
        <span className="badge badge-settled text-[10px]">Active</span>
      </div>

      <div className="space-y-2 py-2 border-y border-[var(--color-gray-100)] text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-gray-500)]">Remaining offline limit:</span>
          <span className="font-black text-emerald-600 text-sm">
            {formatCurrency(remaining)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--color-gray-400)]">Max single transaction:</span>
          <span className="font-medium text-[var(--color-gray-700)]">
            {formatCurrency(authorization.maxSingleTransaction || 500)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--color-gray-400)]">Valid until:</span>
          <span className="font-medium text-[var(--color-gray-700)]">
            {formatRelativeTime(authorization.expiresAt)}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between pt-1">
        <Link
          to="/offline-authorization"
          className="text-xs font-semibold text-[var(--color-indigo-600)] hover:underline flex items-center gap-1 no-underline"
        >
          Manage Offline Access <ArrowRight size={13} />
        </Link>
        <span className="text-[10px] text-[var(--color-gray-400)] font-mono">
          Key: P-256
        </span>
      </div>
    </div>
  );
}

export default OfflineReadinessCard;
