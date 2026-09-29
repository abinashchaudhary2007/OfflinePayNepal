import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet2, Bell, Settings, LogOut, Menu, X, Shield,
  User, ChevronDown, ChevronRight, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/DemoAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { OnlineStatusPill } from '../ui/OfflineBanner';

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
              className="absolute right-0 top-full mt-2.5 w-64 sm:w-72 rounded-2xl shadow-2xl z-40 animate-scale-in"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                boxShadow: isDark
                  ? '0 16px 40px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-color)'
                  : '0 16px 40px -8px rgba(23, 43, 117, 0.16), 0 0 0 1px rgba(220, 227, 242, 0.8)',
                overflow: 'hidden',
              }}
            >
              {/* User info Header with Avatar & Details */}
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#F1F4F9'}`,
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: currentUser?.avatarPhotoUrl ? 'transparent' : 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    {currentUser?.avatarPhotoUrl ? (
                      <img src={currentUser.avatarPhotoUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || 'AJ'
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currentUser?.name || 'User'}
                    </p>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: '2px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currentUser?.email || 'No email registered'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items navigation list with generous padding and gap */}
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[{
                  to: '/profile',
                  icon: <User size={16} />,
                  label: 'My Profile',
                  iconBg: isDark ? 'rgba(79, 111, 216, 0.18)' : '#EAF0FF',
                  iconColor: '#3155B8',
                }, {
                  to: '/security',
                  icon: <Shield size={16} />,
                  label: 'Security',
                  iconBg: isDark ? 'rgba(22, 166, 106, 0.18)' : '#E8F8F1',
                  iconColor: '#16A66A',
                }].map(({ to, icon, label, iconBg, iconColor }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsProfileOpen(false)}
                    className="no-underline group"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      transition: 'all 0.15s ease',
                      gap: '12px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: iconBg,
                          color: iconColor,
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}

                {currentUser?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="no-underline group"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      transition: 'all 0.15s ease',
                      gap: '12px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark ? 'var(--bg-elevated)' : '#F5F7FF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isDark ? 'rgba(242, 169, 0, 0.18)' : '#FFF6DD',
                          color: '#F2A900',
                          flexShrink: 0,
                        }}
                      >
                        <Settings size={16} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        Admin Dashboard
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}

                {/* Divider */}
                <div
                  style={{
                    height: '1px',
                    background: isDark ? 'var(--border-color)' : '#F1F4F9',
                    margin: '4px 4px',
                  }}
                />

                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  className="cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? 'rgba(214, 69, 69, 0.15)' : '#FDECEC';
                    e.currentTarget.style.color = '#D64545';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDark ? 'rgba(214, 69, 69, 0.15)' : '#FDECEC',
                      color: '#D64545',
                      flexShrink: 0,
                    }}
                  >
                    <LogOut size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isDark ? '#FCA5A5' : '#D64545',
                    }}
                  >
                    Sign Out
                  </span>
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
