import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, QrCode, ScanLine, WifiOff, History,
  Store, Users
} from 'lucide-react';

/**
 * PaymentActions — Primary financial payment entry points on the Dashboard.
 * Gives crystal-clear hierarchy to:
 * 1. Pay Shopkeeper (primary offline merchant checkout)
 * 2. Scan QR (instant camera QR scanner)
 * 3. Send to User (P2P contact transfers)
 * 4. Receive Hub (receive money / show identity QR)
 */
function PaymentActions({ isOffline }) {
  return (
    <div className="space-y-3">
      {/* Primary 2-button action row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Primary Action 1: PAY SHOPKEEPER */}
        <Link
          to="/send?mode=shop"
          className="flex items-center justify-between p-4 sm:p-5 rounded-2xl text-white shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all no-underline group"
          style={{ background: 'linear-gradient(135deg, var(--color-indigo-600), var(--color-indigo-800))' }}
          id="dashboard-pay-shopkeeper-btn"
        >
          <div>
            <div className="flex items-center gap-1.5 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
              <Store size={13} className="text-indigo-300" />
              <span>Offline Merchant Checkout</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-white mt-1">Pay Shopkeeper</p>
            <p className="text-indigo-200/80 text-xs hidden sm:block mt-0.5">
              Scan shop QR or generate signed offline payment
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
            <Store size={24} strokeWidth={2.2} />
          </div>
        </Link>

        {/* Primary Action 2: SCAN QR */}
        <Link
          to="/scan"
          className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[var(--color-gray-200)] shadow-xs hover:border-[var(--color-indigo-300)] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all no-underline group"
          id="dashboard-scan-qr-btn"
        >
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
              <ScanLine size={13} />
              <span>Camera Scanner</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-[var(--color-gray-900)] mt-1">Scan QR Code</p>
            <p className="text-[var(--color-gray-500)] text-xs hidden sm:block mt-0.5">
              Pay invoice or claim incoming payment offline
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-[var(--color-indigo-600)] border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <ScanLine size={24} strokeWidth={2.2} />
          </div>
        </Link>
      </div>

      {/* Quick Secondary Actions 4-grid */}
      <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Send to User */}
        <Link
          to="/send?mode=user"
          className="quick-action group no-underline"
          id="dashboard-send-user-shortcut"
        >
          <div className="quick-action-icon bg-indigo-50 text-[var(--color-indigo-600)] group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)]">Send to User</p>
            <p className="text-[10px] text-[var(--color-gray-400)] hidden sm:block">P2P contacts</p>
          </div>
        </Link>

        {/* Receive Hub */}
        <Link
          to="/receive"
          className="quick-action group no-underline"
          id="dashboard-receive-shortcut"
        >
          <div className="quick-action-icon bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={20} />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)]">Receive Hub</p>
            <p className="text-[10px] text-[var(--color-gray-400)] hidden sm:block">Show My QR</p>
          </div>
        </Link>

        {/* Offline Mode */}
        <Link
          to="/offline"
          className="quick-action group no-underline"
          id="dashboard-offline-shortcut"
        >
          <div className="quick-action-icon bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
            <WifiOff size={20} />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)]">Offline Mode</p>
            <p className="text-[10px] text-[var(--color-gray-400)] hidden sm:block">Zero-net tools</p>
          </div>
        </Link>

        {/* Activity / Sync History */}
        <Link
          to="/transactions"
          className="quick-action group no-underline"
          id="dashboard-activity-shortcut"
        >
          <div className="quick-action-icon bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
            <History size={20} />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-[var(--color-gray-800)]">Activity</p>
            <p className="text-[10px] text-[var(--color-gray-400)] hidden sm:block">Sync & ledger</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default PaymentActions;
