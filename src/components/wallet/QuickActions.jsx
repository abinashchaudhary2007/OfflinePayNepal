import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, QrCode, ScanLine, WifiOff, History,
  Store, Users, Sparkles, ChevronRight
} from 'lucide-react';

/**
 * PaymentActions — Simplified, high-converting payment hub on Dashboard.
 * 2 Primary Action Cards (Pay Shopkeeper & Scan QR) + 4 Quick Utility Tiles.
 */
function PaymentActions({ isOffline }) {
  return (
    <div className="space-y-3.5">
      {/* ─── 2 Hero Action Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Primary Action 1: PAY SHOPKEEPER */}
        <Link
          to="/send?mode=shop"
          className="
            relative overflow-hidden group p-5 rounded-3xl no-underline text-white
            shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30
            transition-all duration-300 hover:-translate-y-1 active:translate-y-0 cursor-pointer
          "
          style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 50%, #6366F1 100%)',
          }}
          id="dashboard-pay-shopkeeper-btn"
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none opacity-40 blur-2xl group-hover:scale-125 transition-transform"
            style={{ background: '#A5B4FC' }}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md mb-2">
                <Store size={12} className="text-amber-300" />
                <span>Offline Merchant</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pay Shopkeeper
              </h3>
              <p className="text-indigo-100/80 text-xs mt-1 leading-relaxed max-w-[220px]">
                Scan merchant counter QR & authorize payment without internet
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 group-hover:bg-white/25 transition-all shadow-sm">
              <Store size={24} strokeWidth={2.2} />
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-white/90">
            <span>Instant Offline Signature</span>
            <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              Pay Now <ChevronRight size={14} />
            </span>
          </div>
        </Link>

        {/* Primary Action 2: SCAN QR */}
        <Link
          to="/scan"
          className="
            relative overflow-hidden group p-5 rounded-3xl no-underline
            bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800
            shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50
            transition-all duration-300 hover:-translate-y-1 active:translate-y-0 cursor-pointer
          "
          id="dashboard-scan-qr-btn"
        >
          {/* Subtle Viewfinder Accent Glow */}
          <div
            className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none opacity-20 dark:opacity-40 blur-2xl group-hover:scale-125 transition-transform"
            style={{ background: '#818CF8' }}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 mb-2">
                <ScanLine size={12} />
                <span>Camera Scanner</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Scan QR Code
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed max-w-[220px]">
                Scan payment QR, shop invoices, or claim incoming offline cash
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all shadow-xs">
              <ScanLine size={24} strokeWidth={2.2} />
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Supports P2P & Invoices</span>
            <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              Open Camera <ChevronRight size={14} />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── 4 Quick Secondary Action Tiles ─── */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Send to User */}
        <Link
          to="/send?mode=user"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800
            shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-send-user-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
            Send to User
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden xs:block">
            P2P Transfer
          </p>
        </Link>

        {/* 2. Receive Hub */}
        <Link
          to="/receive"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800
            shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-receive-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
            Receive Hub
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden xs:block">
            Show My QR
          </p>
        </Link>

        {/* 3. Offline Mode */}
        <Link
          to="/offline"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800
            shadow-xs hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-offline-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <WifiOff size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
            Offline Mode
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden xs:block">
            Simulate Zero Net
          </p>
        </Link>

        {/* 4. Transactions Activity */}
        <Link
          to="/transactions"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800
            shadow-xs hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-activity-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <History size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
            Activity Log
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden xs:block">
            Sync & History
          </p>
        </Link>
      </div>
    </div>
  );
}

export default PaymentActions;
