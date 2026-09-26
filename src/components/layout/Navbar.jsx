import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet2, Bell, Settings, LogOut, Menu, X, Shield,
  User, ChevronDown, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/DemoAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { OnlineStatusPill } from '../ui/OfflineBanner';
import { ThemeToggle } from '../ui/ThemeToggle';

/**
 * Navbar — Top navigation bar for the dashboard shell.
 * Shows logo, user info, connectivity status, and actions.
 */
function Navbar({
  onMenuToggle,
  isSidebarOpen,
  isOffline,
  isSimulating,
  onToggleOffline,
}) {
  const { currentUser, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="h-14 sm:h-16 bg-[#172B75] border-b border-[#12215B] flex items-center px-4 sm:px-6 md:px-8 gap-3 sm:gap-4.5 sticky top-0 z-30"
      style={{ boxShadow: '0 2px 12px rgba(23, 43, 117, 0.25)' }}
    >
      {/* Mobile menu toggle with comfortable left & right gap */}
      <button
        className="md:hidden p-2 mr-1 rounded-lg hover:bg-[#12215B] text-white/80 hover:text-white transition-colors touch-target cursor-pointer"
        onClick={onMenuToggle}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Brand — always visible beside the toggle */}
      <Link to="/dashboard" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
        <img
          src="/logo.png"
          alt="OfflinePay Nepal Logo"
          className="w-8 h-8 rounded-xl object-contain bg-white shadow-xs p-0.5 border border-white/20 transition-transform group-hover:scale-105"
        />
        <span className="font-extrabold text-sm tracking-tight text-white">
          OfflinePay
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-[#3155B8] text-white border border-[#4F6FD8]/40">
          Nepal
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Connectivity status + Offline Simulation Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5 mr-1 sm:mr-2">
        <OnlineStatusPill isOffline={isOffline} isSimulating={isSimulating} />

        <button
          onClick={onToggleOffline}
          title={isSimulating ? 'Disable offline simulation' : 'Simulate offline mode'}
          className="
            hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg
            border transition-all cursor-pointer
          "
          style={{
            borderColor: isSimulating ? '#F2A900' : 'rgba(255, 255, 255, 0.25)',
            color: isSimulating ? '#F2A900' : '#EAF0FF',
            background: isSimulating ? '#FFF6DD' : '#12215B',
          }}
        >
          {isSimulating ? <WifiOff size={13} className="text-[#8C6200]" /> : <Wifi size={13} />}
          <span className="hidden md:inline" style={{ color: isSimulating ? '#8C6200' : '#EAF0FF' }}>
            {isSimulating ? 'Go Online' : 'Simulate Offline'}
          </span>
        </button>
      </div>

      {/* Dark / Light Mode Toggle with margin */}
      <div className="flex items-center px-1">
        <ThemeToggle />
      </div>

      {/* Notification bell */}
      <button
        className="relative p-2 rounded-lg hover:bg-[#12215B] text-white/80 hover:text-white transition-colors touch-target cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#D64545' }} />
      </button>

      {/* Profile dropdown */}
      <div className="relative ml-1">
        <button
          onClick={() => setIsProfileOpen(p => !p)}
          className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-[#12215B] transition-colors cursor-pointer"
          aria-label="Account menu"
          aria-expanded={isProfileOpen}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold border border-white/20 overflow-hidden flex-shrink-0"
            style={{ background: currentUser?.avatarPhotoUrl ? 'transparent' : '#3155B8' }}
          >
            {currentUser?.avatarPhotoUrl
              ? <img src={currentUser.avatarPhotoUrl} alt="avatar" className="w-full h-full object-cover" />
              : (currentUser?.avatar || 'U')
            }
          </div>
          <span className="hidden md:block text-sm font-semibold text-white max-w-[100px] truncate">
            {currentUser?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={14} className="text-white/70 hidden md:block" />
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl z-40 py-2 animate-scale-in"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              }}
            >
              {/* User info */}
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</p>
              </div>

              {[{
                to: '/profile', icon: <User size={16} style={{ color: '#4F6FD8' }} />, label: 'My Profile',
              }, {
                to: '/security', icon: <Shield size={16} style={{ color: '#16A66A' }} />, label: 'Security',
              }].map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors"
                  style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#EAF0FF'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {icon} {label}
                </Link>
              ))}

              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors"
                  style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#EAF0FF'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Settings size={16} style={{ color: '#F2A900' }} /> Admin Dashboard
                </Link>
              )}

              <div style={{ borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`, marginTop: 4, paddingTop: 4 }}>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors cursor-pointer"
                  style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(214,69,69,0.12)' : '#FDECEC'; e.currentTarget.style.color = isDark ? '#E57373' : '#D64545'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
