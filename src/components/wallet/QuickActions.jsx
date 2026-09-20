import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, WifiOff, RefreshCw,
  QrCode, Banknote
} from 'lucide-react';

const ACTIONS = [
  {
    to: '/send',
    icon: ArrowUpRight,
    label: 'Send Money',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    description: 'Transfer funds',
  },
  {
    to: '/receive',
    icon: ArrowDownLeft,
    label: 'Receive',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    description: 'Generate QR code',
  },
  {
    to: '/offline',
    icon: WifiOff,
    label: 'Offline Pay',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    description: 'Pay without internet',
  },
  {
    to: '/transactions',
    icon: RefreshCw,
    label: 'Sync & History',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
    description: 'View all transactions',
  },
];

/**
 * QuickActions — Grid of 4 main action shortcuts on the dashboard.
 */
function QuickActions({ isOffline }) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
      {ACTIONS.map(({ to, icon: Icon, label, iconBg, iconColor, description }) => (
        <Link key={to} to={to} className="quick-action group no-underline">
          <div
            className="quick-action-icon group-hover:scale-110 transition-transform duration-200"
            style={{ background: iconBg }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-[var(--color-gray-800)] leading-tight">{label}</p>
            <p className="hidden sm:block text-[10px] text-[var(--color-gray-400)] mt-0.5">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default QuickActions;
