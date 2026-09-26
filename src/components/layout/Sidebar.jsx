import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpRight, ArrowDownLeft,
  List, User, Settings, X, QrCode
} from 'lucide-react';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send',         icon: ArrowUpRight,    label: 'Pay / Send' },
  { to: '/receive',      icon: ArrowDownLeft,   label: 'Receive' },
  { to: '/scan',         icon: QrCode,          label: 'Scan QR' },
  { to: '/transactions', icon: List,            label: 'Transactions' },
  { to: '/profile',      icon: User,            label: 'Profile' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
];

/**
 * Sidebar — Deep navy UPI-style sidebar.
 * Brand tag sits in the header row next to the close button.
 * Nav items are pushed down with generous spacing and fill the full sidebar width.
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
          fixed md:static inset-y-0 left-0 md:self-stretch w-64 bg-[#0F1D55]
          flex flex-col z-40 transition-transform duration-300 ease-in-out
          shadow-2xl md:shadow-none flex-shrink-0 overflow-hidden select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile close header */}
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-1">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── User mini-card (sits at top) ── */}
        {currentUser && (
          <div className="mx-3.5 mt-3 md:mt-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 flex items-center gap-3 transition-colors">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden border border-white/20 shadow-xs"
              style={{ background: currentUser.avatarPhotoUrl ? 'transparent' : (currentUser.avatarColor || '#3155B8') }}
            >
              {currentUser.avatarPhotoUrl
                ? <img src={currentUser.avatarPhotoUrl} alt="avatar" className="w-full h-full object-cover" />
                : (currentUser.avatar || currentUser.name?.[0]?.toUpperCase() || 'U')
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-white/50 truncate mt-0.5 capitalize font-medium">{currentUser.role || 'User'}</p>
            </div>
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#16A66A] shadow-[0_0_6px_rgba(22,166,106,0.8)]" />
          </div>
        )}

        {/* ── Navigation label ── */}
        <div className="px-5 mt-4 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">
            Menu
          </span>
        </div>

        {/* ── Navigation links ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-1.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-[15px]
                 transition-all duration-150 no-underline cursor-pointer w-full text-left
                 ${isActive
                   ? 'bg-[#2952CC] text-white shadow-md shadow-[#2952CC]/40'
                   : 'text-white/70 hover:text-white hover:bg-white/10'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left accent indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                  )}

                  {/* Icon */}
                  <span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110">
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.4 : 1.9}
                      className={isActive ? 'text-white' : 'text-white/75 group-hover:text-white'}
                    />
                  </span>

                  {/* Label */}
                  <span className="flex-1 truncate tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {currentUser?.role === 'admin' && (
            <div className="pt-2 border-t border-white/10 mt-2">
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-[15px]
                   transition-all duration-150 no-underline cursor-pointer w-full text-left
                   ${isActive
                     ? 'bg-[#F2A900]/25 text-[#F2A900] border border-[#F2A900]/30'
                     : 'text-white/60 hover:text-[#F2A900] hover:bg-[#F2A900]/10'
                   }`
                }
              >
                <Settings size={20} strokeWidth={1.9} className="flex-shrink-0 transition-transform duration-150 group-hover:rotate-45" />
                <span className="flex-1 truncate tracking-wide">Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* ── Footer: Device info ── */}
        <div className="p-3.5 border-t border-white/10 bg-[#0A1438] flex-shrink-0">
          {device ? (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/8 transition-colors">
              <div className="w-2 h-2 rounded-full bg-[#16A66A] flex-shrink-0 animate-pulse shadow-[0_0_6px_rgba(22,166,106,0.8)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Device</p>
                <p className="text-[11px] font-mono font-medium text-white/80 truncate mt-1 leading-tight">
                  {device.id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 text-white/50 text-xs rounded-xl bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#F2A900] flex-shrink-0 animate-pulse" />
              <span className="truncate text-[11px] font-medium">Hardware keys pending</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
