import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, QrCode, Store } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * PaymentActions — 4 quick-action cards with dark mode support and generous spacing.
 */
function PaymentActions({ isOffline }) {
  const { isDark } = useTheme();

  const actions = [
    {
      to: '/send',
      id: 'dashboard-send-money-btn',
      icon: ArrowUp,
      label: 'Send',
      iconBg: isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF',
      iconColor: '#4F6FD8',
    },
    {
      to: '/receive',
      id: 'dashboard-receive-shortcut',
      icon: ArrowDown,
      label: 'Receive',
      iconBg: isDark ? 'rgba(22,166,106,0.18)' : '#E8F8F1',
      iconColor: '#16A66A',
    },
    {
      to: '/scan',
      id: 'dashboard-scan-qr-btn',
      icon: QrCode,
      label: 'Scan QR',
      iconBg: isDark ? 'rgba(49,85,184,0.18)' : '#EAF0FF',
      iconColor: '#4F6FD8',
    },
    {
      to: '/send?mode=shop',
      id: 'dashboard-pay-shopkeeper-btn',
      icon: Store,
      label: 'Pay Merchant',
      iconBg: isDark ? 'rgba(79,111,216,0.18)' : '#F0F4FF',
      iconColor: '#4F6FD8',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '16px',
        width: '100%',
      }}
      className="grid grid-cols-2 sm:grid-cols-4"
    >
      {actions.map(({ to, id, icon: Icon, label, iconBg, iconColor }) => (
        <Link
          key={label}
          to={to}
          id={id}
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            color: 'var(--text-primary)',
            padding: '24px 18px',
            borderRadius: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)',
            transition: 'all 0.2s ease',
          }}
          className="group cursor-pointer hover:-translate-y-1 active:scale-95"
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = isDark ? 'var(--border-hover)' : '#3155B8';
            e.currentTarget.style.boxShadow = isDark ? '0 6px 18px rgba(0,0,0,0.35)' : '0 8px 20px rgba(23,43,117,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isDark ? 'var(--border-color)' : '#DCE3F2';
            e.currentTarget.style.boxShadow = isDark ? 'var(--shadow-card)' : '0 2px 8px rgba(23,43,117,0.06)';
          }}
        >
          <div
            style={{
              backgroundColor: iconBg,
              color: iconColor,
              width: '52px',
              height: '52px',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              transition: 'transform 0.2s ease',
            }}
            className="group-hover:scale-110"
          >
            <Icon size={24} strokeWidth={2.4} />
          </div>
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              textAlign: 'center',
            }}
          >
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default PaymentActions;
