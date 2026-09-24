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
 * Sidebar — Deep Navy UPI-style sidebar with rich hover animations and proper spacing.
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
          fixed md:static inset-y-0 left-0 md:self-stretch w-72 bg-[#132258] text-white
          flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ── Brand header ── */}
        <div className="flex items-center justify-between px-7 py-8 border-b border-white/10">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-4 no-underline group">
            <div className="w-12 h-12 rounded-2xl bg-[#3155B8] flex items-center justify-center text-white shadow-lg border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(49,85,184,0.6)]">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="font-extrabold text-[20px] tracking-tight text-white leading-tight">
                OfflinePay
              </div>
              <div className="text-[13px] font-medium text-white/55 mt-1">
                Nepal
              </div>
            </div>
          </Link>

          <button
            className="md:hidden p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Navigation links ── */}
        <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-3">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 px-6 py-4 rounded-2xl text-[21px] font-semibold
                 transition-all duration-200 ease-out no-underline cursor-pointer
                 ${isActive
                   ? 'bg-[#3155B8] text-white shadow-lg shadow-[#3155B8]/40'
                   : 'text-white/60 hover:text-white hover:bg-white/10 hover:translate-x-1.5'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-white/80" />
                  )}

                  {/* Icon with hover scale */}
                  <span className={`transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}>
                    <Icon size={26} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>

                  {/* Label */}
                  <span className="tracking-tight">{label}</span>

                  {/* Active glow dot */}
                  {isActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {currentUser?.role === 'admin' && (
            <div className="pt-5 mt-4 border-t border-white/10">
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-4 px-6 py-4 rounded-2xl text-[17px] font-semibold
                   transition-all duration-200 no-underline cursor-pointer
                   ${isActive
                     ? 'bg-[#3155B8] text-white shadow-lg shadow-[#3155B8]/40'
                     : 'text-white/60 hover:text-white hover:bg-white/10 hover:translate-x-1.5'
                   }`
                }
              >
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* ── Footer: Device info & theme toggle ── */}
        <div className="px-6 py-7 border-t border-white/10 bg-[#0E1A45] flex-shrink-0 space-y-4">
          {device ? (
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200">
              <div className="w-3.5 h-3.5 rounded-full bg-[#16A66A] flex-shrink-0 animate-pulse shadow-[0_0_8px_rgba(22,166,106,0.7)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white/45 uppercase tracking-widest">Device</p>
                <p className="text-[14px] font-mono font-semibold text-white/90 truncate mt-1">
                  {device.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-4 text-white/50 text-[15px] rounded-2xl bg-white/5 border border-white/10">
              <span className="w-3 h-3 rounded-full bg-[#F2A900] flex-shrink-0 animate-pulse" />
              <span>Hardware keys pending</span>
            </div>
          )}

          <div className="flex items-center justify-between px-2 pt-1 text-[15px] text-white/60">
            <span className="font-medium">Theme</span>
            <ThemeToggle size="sm" showLabel={false} />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
