import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, ScanLine, WifiOff, History,
  Store, ChevronRight
} from 'lucide-react';

/**
 * PaymentActions — Core payment hub on Dashboard.
 * Focuses on the 4 primary actions:
 * 1. Send Money (Primary action styled with Electric Teal #14B8A6)
 * 2. Scan QR (Secondary action with Sky Blue #38BDF8 accent)
 * 3. Receive Money (Clean surface card)
 * 4. Transaction History (Clean surface card)
 */
function PaymentActions({ isOffline }) {
  return (
    <div className="space-y-3.5">
      {/* ─── 2 Hero Action Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Primary Action 1: SEND MONEY (Electric Teal - Primary Action) */}
        <Link
          to="/send"
          className="
            relative overflow-hidden group p-5 rounded-2xl no-underline text-[#0B1220]
            bg-[#14B8A6] hover:bg-[#0D9488] shadow-lg shadow-[#14B8A6]/20
            transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer
          "
          id="dashboard-send-money-btn"
        >
          {/* Subtle Ambient Depth */}
          <div
            className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none opacity-20 blur-2xl group-hover:scale-125 transition-transform"
            style={{ background: '#FFFFFF' }}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0B1220]/20 text-[#0B1220] mb-2">
                <ArrowUpRight size={12} strokeWidth={3} />
                <span>Primary Payment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B1220] tracking-tight">
                Send Money
              </h3>
              <p className="text-[#0B1220]/80 text-xs mt-1 leading-relaxed max-w-[230px] font-medium">
                Instant P2P or merchant payment with offline signature support
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#0B1220]/15 flex items-center justify-center text-[#0B1220] shrink-0 group-hover:scale-110 transition-all shadow-xs">
              <ArrowUpRight size={26} strokeWidth={2.6} />
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-[#0B1220]/15 flex items-center justify-between text-xs font-bold text-[#0B1220]">
            <span>Online & Offline Ready</span>
            <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              Send Now <ChevronRight size={14} />
            </span>
          </div>
        </Link>

        {/* Primary Action 2: SCAN QR (Secondary Hero Card with Sky Blue Accent) */}
        <Link
          to="/scan"
          className="
            relative overflow-hidden group p-5 rounded-2xl no-underline text-[#F8FAFC]
            bg-[#111C2E] border border-[#263449] hover:border-[#38BDF8]/60
            shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer
          "
          id="dashboard-scan-qr-btn"
        >
          {/* Subtle Viewfinder Accent Glow */}
          <div
            className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none opacity-15 blur-2xl group-hover:scale-125 transition-transform"
            style={{ background: '#38BDF8' }}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 mb-2">
                <ScanLine size={12} />
                <span>Camera Scanner</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Scan QR Code
              </h3>
              <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed max-w-[230px]">
                Scan merchant counter QR, user invoices, or claim incoming offline cash
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#172337] border border-[#263449] text-[#38BDF8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-all shadow-xs">
              <ScanLine size={24} strokeWidth={2.2} />
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-[#263449] flex items-center justify-between text-xs font-semibold text-[#94A3B8]">
            <span>Supports P2P & Counter QR</span>
            <span className="flex items-center gap-0.5 text-[#38BDF8] group-hover:translate-x-1 transition-transform">
              Open Camera <ChevronRight size={14} />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── 4 Supporting Action Tiles ─── */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Receive Money */}
        <Link
          to="/receive"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-[#111C2E] border border-[#263449] hover:border-[#14B8A6]/50 hover:bg-[#172337]
            shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-receive-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] text-center">
            Receive Money
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden xs:block">
            Show My QR
          </p>
        </Link>

        {/* 2. Transaction History */}
        <Link
          to="/transactions"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-[#111C2E] border border-[#263449] hover:border-[#38BDF8]/50 hover:bg-[#172337]
            shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-activity-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <History size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] text-center">
            Transactions
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden xs:block">
            Full History
          </p>
        </Link>

        {/* 3. Pay Shopkeeper shortcut */}
        <Link
          to="/send?mode=shop"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-[#111C2E] border border-[#263449] hover:border-[#14B8A6]/50 hover:bg-[#172337]
            shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-pay-shopkeeper-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/15 text-[#14B8A6] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Store size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] text-center">
            Shopkeeper
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden xs:block">
            Merchant Mode
          </p>
        </Link>

        {/* 4. Offline Mode Simulation */}
        <Link
          to="/offline"
          className="
            flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl no-underline
            bg-[#111C2E] border border-[#263449] hover:border-[#A78BFA]/50 hover:bg-[#172337]
            shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group
          "
          id="dashboard-offline-shortcut"
        >
          <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/15 text-[#A78BFA] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <WifiOff size={19} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] text-center">
            Offline Mode
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden xs:block">
            Simulate Zero Net
          </p>
        </Link>
      </div>
    </div>
  );
}

export default PaymentActions;
