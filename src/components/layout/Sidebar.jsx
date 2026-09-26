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
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 no-underline group">
            <img
              src="/logo.png"
              alt="OfflinePay Nepal Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white shadow-md p-0.5 border border-white/20 transition-transform group-hover:scale-105"
            />
            <div>
              <div className="font-black text-base tracking-tight text-white leading-tight flex items-center gap-1.5">
                <span>OfflinePay</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-[#3155B8] text-white border border-[#4F6FD8]/40">
                  Nepal
                </span>
              </div>
              <div className="text-[11px] font-medium text-white/55 mt-0.5">
                Offline Payment Wallet
              </div>
            </div>
          </Link>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation links ── */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-3">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-semibold
                 transition-all duration-200 ease-out no-underline cursor-pointer
                 ${isActive
                   ? 'bg-[#3155B8] text-white shadow-md shadow-[#3155B8]/30 font-bold'
                   : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}

                  {/* Icon with hover scale */}
                  <span className={`transition-transform duration-200 ${!isActive ? 'group-hover:scale-105' : ''}`}>
                    <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>

                  {/* Label */}
                  <span className="tracking-wide text-[15px]">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {currentUser?.role === 'admin' && (
            <div className="pt-4 mt-3 border-t border-white/10">
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-semibold
                   transition-all duration-200 no-underline cursor-pointer
                   ${isActive
                     ? 'bg-[#3155B8] text-white shadow-md shadow-[#3155B8]/30 font-bold'
                     : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1'
                   }`
                }
              >
                <span className="text-[15px] tracking-wide">Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* ── Footer: Device info & theme toggle ── */}
        <div className="p-4 border-t border-white/10 bg-[#0E1A45] flex-shrink-0 space-y-3">
          {device ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16A66A] flex-shrink-0 animate-pulse shadow-[0_0_8px_rgba(22,166,106,0.7)]" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-white/45 uppercase tracking-widest leading-none">Device</p>
                <p className="text-[12px] font-mono font-semibold text-white/90 truncate mt-1 leading-tight">
                  {device.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 text-white/50 text-xs rounded-xl bg-white/5 border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2A900] flex-shrink-0 animate-pulse" />
              <span className="truncate">Hardware keys pending</span>
            </div>
          )}

          <div className="flex items-center justify-between px-1 text-xs text-white/60">
            <span className="font-semibold">Theme</span>
            <ThemeToggle size="sm" showLabel={false} />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
