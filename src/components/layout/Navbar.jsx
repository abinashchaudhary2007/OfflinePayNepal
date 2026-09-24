import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet2, Bell, Settings, LogOut, Menu, X, Shield,
  User, ChevronDown, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/DemoAuthContext';
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
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="h-14 sm:h-16 bg-[#172B75] border-b border-[#12215B] flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 sticky top-0 z-30"
      style={{ boxShadow: '0 2px 12px rgba(23, 43, 117, 0.25)' }}
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#12215B] text-white/80 hover:text-white transition-colors touch-target"
        onClick={onMenuToggle}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
        <img
          src="/logo.png"
          alt="OfflinePay Nepal Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-white shadow-xs p-0.5 border border-white/20 transition-transform group-hover:scale-105"
        />
        <span
          className="hidden sm:block font-extrabold text-sm sm:text-base tracking-tight text-white"
        >
          OfflinePay
        </span>
        <span
          className="hidden md:block text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#3155B8] text-white border border-[#4F6FD8]/40"
        >
          Nepal
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Connectivity status + toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
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

      {/* Dark / Light Mode Toggle */}
      <ThemeToggle />

      {/* Notification bell */}
      <button
        className="relative p-2 rounded-lg hover:bg-[#12215B] text-white/80 hover:text-white transition-colors touch-target cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: '#D64545' }}
        />
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(p => !p)}
          className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-[#12215B] transition-colors cursor-pointer"
          aria-label="Account menu"
          aria-expanded={isProfileOpen}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-[#3155B8] border border-white/20"
          >
            {currentUser?.avatar || 'U'}
          </div>
          <span className="hidden md:block text-sm font-semibold text-white max-w-[100px] truncate">
            {currentUser?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={14} className="text-white/70 hidden md:block" />
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsProfileOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#DCE3F2] z-40 py-2 animate-scale-in"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[#DCE3F2]">
                <p className="text-sm font-bold text-[#172033]">{currentUser?.name}</p>
                <p className="text-xs text-[#5F6B85] truncate">{currentUser?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#EAF0FF] text-sm text-[#5F6B85] hover:text-[#172B75] no-underline transition-colors"
              >
                <User size={16} className="text-[#3155B8]" /> My Profile
              </Link>
              <Link
                to="/security"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#EAF0FF] text-sm text-[#5F6B85] hover:text-[#172B75] no-underline transition-colors"
              >
                <Shield size={16} className="text-[#16A66A]" /> Security
              </Link>

              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#EAF0FF] text-sm text-[#5F6B85] hover:text-[#172B75] no-underline transition-colors"
                >
                  <Settings size={16} className="text-[#F2A900]" /> Admin Dashboard
                </Link>
              )}

              <div className="border-t border-[#DCE3F2] mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#FDECEC] text-sm text-[#5F6B85] hover:text-[#D64545] transition-colors cursor-pointer"
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
