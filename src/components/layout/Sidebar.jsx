import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpRight, ArrowDownLeft,
  List, User, Settings, CreditCard, X
} from 'lucide-react';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';
import { ThemeToggle } from '../ui/ThemeToggle';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send',         icon: ArrowUpRight,    label: 'Pay / Send' },
  { to: '/receive',      icon: ArrowDownLeft,   label: 'Receive' },
  { to: '/transactions', icon: List,            label: 'Transactions' },
  { to: '/profile',      icon: User,            label: 'Profile' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
];

/**
 * Sidebar — Deep Navy UPI-style sidebar matching the reference dashboard.
 */
function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { device } = useWallet();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 h-full w-72 md:w-64 bg-[#132258] text-white
          flex flex-col z-40 transition-transform duration-300 shadow-2xl md:shadow-none flex-shrink-0 min-h-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 rounded-xl bg-[#3155B8] flex items-center justify-center text-white shadow-md border border-white/20 transition-transform group-hover:scale-105">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-tight">
                OfflinePay
              </div>
              <div className="text-[11px] font-medium text-white/60">
                Nepal
              </div>
            </div>
          </Link>

          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  isActive
                    ? 'bg-[#3155B8] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Admin link for administrators */}
          {currentUser?.role === 'admin' && (
            <div className="pt-4 mt-3 border-t border-white/10">
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all no-underline ${
                    isActive
                      ? 'bg-[#3155B8] text-white shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer / Device info & theme toggle */}
        <div className="p-4 border-t border-white/10 bg-[#0E1A45] flex-shrink-0 space-y-2">
          {device ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-[#16A66A] flex-shrink-0 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">Device</p>
                <p className="text-[11px] font-mono font-medium text-white/90 truncate">
                  {device.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 text-white/50 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2A900] flex-shrink-0" />
              <span>Hardware keys pending</span>
            </div>
          )}

          <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-white/60">
            <span>Theme</span>
            <ThemeToggle size="sm" showLabel={false} />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
