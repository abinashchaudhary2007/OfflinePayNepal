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
      {actions.map((act) => {
        const Icon = act.icon;
        if (act.isPrimary) {
          return (
            <Link
              key={act.to}
              to={act.to}
              id={act.id}
              className="
                group relative flex flex-col items-center justify-center p-4 rounded-2xl no-underline
                bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] shadow-md shadow-[#14B8A6]/20
                transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
              "
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1220]/15 flex items-center justify-center text-[#0B1220] mb-2 group-hover:scale-110 transition-transform">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[#0B1220]">
                {act.label}
              </span>
              <span className="text-[11px] font-semibold text-[#0B1220]/75 mt-0.5">
                {act.sub}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={act.to}
            to={act.to}
            id={act.id}
            className="
              group flex flex-col items-center justify-center p-4 rounded-2xl no-underline
              bg-[#111C2E] border border-[#263449] hover:border-[#38BDF8]/40 hover:bg-[#172337]
              shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
            "
          >
            <div className={`w-10 h-10 rounded-xl ${act.iconBg} ${act.accentColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <Icon size={20} />
            </div>
            <span className="text-sm font-bold text-[#F8FAFC]">
              {act.label}
            </span>
            <span className="text-[11px] text-[#94A3B8] mt-0.5">
              {act.sub}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default PaymentActions;
