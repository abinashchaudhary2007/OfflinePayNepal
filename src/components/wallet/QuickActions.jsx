import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, QrCode, Store } from 'lucide-react';

/**
 * PaymentActions — 4 clean white quick action cards matching the reference design:
 * - Send (ArrowUp with light blue bg)
 * - Receive (ArrowDown with light green bg)
 * - Scan QR (QrCode with light blue bg)
 * - Pay Merchant (Store with light blue/gray bg)
 */
function PaymentActions({ isOffline }) {
  const actions = [
    {
      to: '/send',
      id: 'dashboard-send-money-btn',
      icon: ArrowUp,
      label: 'Send',
      iconBg: 'bg-[#EAF0FF]',
      iconColor: 'text-[#3155B8]',
    },
    {
      to: '/receive',
      id: 'dashboard-receive-shortcut',
      icon: ArrowDown,
      label: 'Receive',
      iconBg: 'bg-[#E8F8F1]',
      iconColor: 'text-[#16A66A]',
    },
    {
      to: '/scan',
      id: 'dashboard-scan-qr-btn',
      icon: QrCode,
      label: 'Scan QR',
      iconBg: 'bg-[#EAF0FF]',
      iconColor: 'text-[#3155B8]',
    },
    {
      to: '/send?mode=shop',
      id: 'dashboard-pay-shopkeeper-btn',
      icon: Store,
      label: 'Pay Merchant',
      iconBg: 'bg-[#F0F4FF]',
      iconColor: 'text-[#3155B8]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {actions.map(({ to, id, icon: Icon, label, iconBg, iconColor }) => (
        <Link
          key={label}
          to={to}
          id={id}
          className="
            group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl no-underline
            bg-white border border-[#DCE3F2] shadow-xs hover:shadow-md hover:border-[#3155B8]/40
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
          "
        >
          <div
            className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105`}
          >
            <Icon size={22} strokeWidth={2.4} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#172033] tracking-tight text-center">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default PaymentActions;
