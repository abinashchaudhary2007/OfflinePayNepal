import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpRight, ArrowDownLeft,
  WifiOff, History, Shield, User, ShieldAlert,
  Settings, BarChart3, X, QrCode
} from 'lucide-react';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';
import { DemoBadge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';

const MAIN_NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send',         icon: ArrowUpRight,    label: 'Pay / Send' },
  { to: '/receive',      icon: ArrowDownLeft,   label: 'Receive Hub' },
  { to: '/transactions', icon: History,         label: 'Transactions' },
  { to: '/security',     icon: Shield,          label: 'Security Center' },
  { to: '/profile',      icon: User,            label: 'Profile' },
];

const SECURITY_TOOL_ITEMS = [
  { to: '/cybersecurity-demo',     icon: ShieldAlert, label: 'Security Testing' },
  { to: '/devices',               icon: Settings,    label: 'Device Management' },
  { to: '/offline-authorization', icon: WifiOff,     label: 'Offline Authorization' },
  { to: '/scan',                  icon: QrCode,      label: 'QR Scanner' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: BarChart3, label: 'Admin Dashboard' },
];

/**
 * Sidebar — Desktop side navigation + mobile slide-in drawer.
 */
function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { device } = useWallet();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 h-full w-72 md:w-64 bg-white border-r border-[#DCE3F2]
          flex flex-col z-30 transition-transform duration-300 shadow-xl md:shadow-none flex-shrink-0 min-h-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile drawer header with brand logo */}
        <div className="md:hidden flex items-center justify-between p-3.5 border-b border-[#DCE3F2]">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2 no-underline">
            <img
              src="/logo.png"
              alt="OfflinePay Nepal"
              className="w-8 h-8 rounded-lg object-contain bg-white shadow-xs p-0.5 border border-[#DCE3F2]"
            />
            <span className="font-extrabold text-sm tracking-tight text-[#172B75]">
              OfflinePay <span className="text-[#3155B8]">Nepal</span>
            </span>
          </Link>
          <button
            className="p-1.5 rounded-lg hover:bg-[#F5F7FF] text-[#5F6B85] hover:text-[#172B75] cursor-pointer"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-[#8993A8] uppercase px-3 pb-1 pt-1">
            Menu
          </p>

          {MAIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* DEMO / SECURITY section */}
          <div className="pt-4 mt-2 border-t border-[#DCE3F2]">
            <p className="text-[10px] font-bold tracking-widest text-[#8993A8] uppercase px-3 pb-1">
              Demo & Security Tools
            </p>
            {SECURITY_TOOL_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item text-xs ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Admin section — only visible to admins */}
          {currentUser?.role === 'admin' && (
            <div className="pt-4 mt-2 border-t border-[#DCE3F2]">
              <p className="text-[10px] font-bold tracking-widest text-[#8993A8] uppercase px-3 pb-1">
                Administration
              </p>
              {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item text-xs ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom — Theme Toggle & Device status info */}
        <div className="p-3 border-t border-[#DCE3F2] flex-shrink-0 bg-[#F5F7FF] space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#5F6B85]">Appearance</span>
            <ThemeToggle size="sm" showLabel={true} />
          </div>

          {device ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-[#DCE3F2] shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#16A66A] flex-shrink-0 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-[#8993A8] uppercase tracking-wider">Device Linked</p>
                <p className="text-xs font-mono font-semibold text-[#172033] truncate">
                  {device.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 text-[#8993A8] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#F2A900] flex-shrink-0" />
              <span>Device pending</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
