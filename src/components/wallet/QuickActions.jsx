import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, QrCode, Store } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * PaymentActions — 4 quick-action cards with dark mode support.
 */
function PaymentActions({ isOffline }) {
  const { isDark } = useTheme();

  const actions = [
    {
      to: '/send',
      id: 'dashboard-send-money-btn',
      icon: ArrowUp,
      label: 'Send',
      iconBg: isDark ? 'rgba(49,85,184,0.15)' : '#EAF0FF',
      iconColor: '#4F6FD8',
    },
    {
      to: '/receive',
      id: 'dashboard-receive-shortcut',
      icon: ArrowDown,
      label: 'Receive',
      iconBg: isDark ? 'rgba(22,166,106,0.12)' : '#E8F8F1',
      iconColor: '#16A66A',
    },
    {
      to: '/scan',
      id: 'dashboard-scan-qr-btn',
      icon: QrCode,
      label: 'Scan QR',
      iconBg: isDark ? 'rgba(49,85,184,0.15)' : '#EAF0FF',
      iconColor: '#4F6FD8',
    },
    {
      to: '/send?mode=shop',
      id: 'dashboard-pay-shopkeeper-btn',
      icon: Store,
      label: 'Pay Merchant',
      iconBg: isDark ? 'rgba(79,111,216,0.12)' : '#F0F4FF',
      iconColor: '#4F6FD8',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map(({ to, id, icon: Icon, label, iconBg, iconColor }) => (
        <Link
          key={label}
          to={to}
          id={id}
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            color: 'var(--text-primary)',
          }}
          className="
            group flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl no-underline
            shadow-xs hover:shadow-md
            transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer
          "
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = isDark ? 'var(--border-hover)' : 'rgba(49,85,184,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isDark ? 'var(--border-color)' : '#DCE3F2';
          }}
        >
          <div
            style={{ backgroundColor: iconBg, color: iconColor, width: 52, height: 52 }}
            className="rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
          >
            <Icon size={24} strokeWidth={2.2} />
          </div>
          <span style={{ color: 'var(--text-primary)' }} className="text-sm font-bold tracking-tight text-center">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default PaymentActions;
