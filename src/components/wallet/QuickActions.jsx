import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ScanLine, Store } from 'lucide-react';

/**
 * PaymentActions — Clean, modern fintech action bar.
 * Streamlined 4 primary actions with crisp typography and subtle micro-interactions.
 */
function PaymentActions({ isOffline }) {
  const actions = [
    {
      to: '/send',
      id: 'dashboard-send-money-btn',
      icon: ArrowUpRight,
      label: 'Send',
      sub: 'P2P & Offline',
      isPrimary: true,
    },
    {
      to: '/scan',
      id: 'dashboard-scan-qr-btn',
      icon: ScanLine,
      label: 'Scan QR',
      sub: 'Camera Pay',
      accentColor: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/15',
    },
    {
      to: '/receive',
      id: 'dashboard-receive-shortcut',
      icon: ArrowDownLeft,
      label: 'Receive',
      sub: 'Show My QR',
      accentColor: 'text-[#22C55E]',
      iconBg: 'bg-[#22C55E]/15',
    },
    {
      to: '/send?mode=shop',
      id: 'dashboard-pay-shopkeeper-btn',
      icon: Store,
      label: 'Merchant',
      sub: 'Counter Pay',
      accentColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* 1. Send Money (Primary CTA: Background #172B75, Text #FFFFFF) */}
      <Link
        to="/send"
        id="dashboard-send-money-btn"
        className="
          group relative flex flex-col items-center justify-center p-4 rounded-2xl no-underline
          bg-[#172B75] hover:bg-[#12215B] text-white shadow-md shadow-[#172B75]/20
          transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
        "
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
          <ArrowUpRight size={20} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          Send
        </span>
        <span className="text-[11px] font-medium text-[#EAF0FF]/80 mt-0.5">
          P2P & Offline
        </span>
      </Link>

      {/* 2. Scan QR (QR SCAN BUTTON: Background #3155B8, Text #FFFFFF) */}
      <Link
        to="/scan"
        id="dashboard-scan-qr-btn"
        className="
          group relative flex flex-col items-center justify-center p-4 rounded-2xl no-underline
          bg-[#3155B8] hover:bg-[#264395] text-white shadow-md shadow-[#3155B8]/20
          transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
        "
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
          <ScanLine size={20} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          Scan QR
        </span>
        <span className="text-[11px] font-medium text-[#EAF0FF]/80 mt-0.5">
          Camera Pay
        </span>
      </Link>

      {/* 3. Receive Money (Secondary CTA: Background #EAF0FF, Text #172B75) */}
      <Link
        to="/receive"
        id="dashboard-receive-shortcut"
        className="
          group flex flex-col items-center justify-center p-4 rounded-2xl no-underline
          bg-[#EAF0FF] hover:bg-[#D6E3FF] text-[#172B75] border border-[#DCE3F2]
          shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
        "
      >
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3155B8] border border-[#DCE3F2] mb-2 group-hover:scale-110 transition-transform shadow-xs">
          <ArrowDownLeft size={20} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold text-[#172B75]">
          Receive
        </span>
        <span className="text-[11px] text-[#5F6B85] mt-0.5">
          Show My QR
        </span>
      </Link>

      {/* 4. Merchant Pay */}
      <Link
        to="/send?mode=shop"
        id="dashboard-pay-shopkeeper-btn"
        className="
          group flex flex-col items-center justify-center p-4 rounded-2xl no-underline
          bg-white hover:bg-[#F5F7FF] text-[#172033] border border-[#DCE3F2]
          shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
        "
      >
        <div className="w-10 h-10 rounded-xl bg-[#FFF6DD] text-[#F2A900] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-[#F2A900]/25">
          <Store size={20} />
        </div>
        <span className="text-sm font-bold text-[#172033]">
          Merchant
        </span>
        <span className="text-[11px] text-[#5F6B85] mt-0.5">
          Counter Pay
        </span>
      </Link>
    </div>
  );
}

export default PaymentActions;
