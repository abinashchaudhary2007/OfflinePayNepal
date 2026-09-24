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
      className="h-14 sm:h-16 bg-[#111C2E] border-b border-[#263449] flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 sticky top-0 z-30"
      style={{ boxShadow: '0 2px 10px rgba(11, 18, 32, 0.5)' }}
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#172337] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors touch-target"
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
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-white shadow-xs p-0.5 border border-[#263449] transition-transform group-hover:scale-105"
        />
        <span
          className="hidden sm:block font-extrabold text-sm sm:text-base tracking-tight text-[#F8FAFC]"
        >
          OfflinePay
        </span>
        <span
          className="hidden md:block text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30"
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
            border transition-all
          "
          style={{
            borderColor: isSimulating ? 'rgba(245, 158, 11, 0.4)' : '#263449',
            color: isSimulating ? '#F59E0B' : '#94A3B8',
            background: isSimulating ? 'rgba(245, 158, 11, 0.12)' : '#172337',
          }}
        >
          {isSimulating ? <WifiOff size={13} /> : <Wifi size={13} />}
          <span className="hidden md:inline">{isSimulating ? 'Go Online' : 'Simulate Offline'}</span>
        </button>
      </div>

      {/* Dark / Light Mode Toggle */}
      <ThemeToggle />

      {/* Notification bell */}
      <button
        className="relative p-2 rounded-lg hover:bg-[#172337] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors touch-target"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: '#EF4444' }}
        />
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(p => !p)}
          className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-[#172337] transition-colors"
          aria-label="Account menu"
          aria-expanded={isProfileOpen}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0B1220] text-sm font-bold bg-[#14B8A6]"
          >
            {currentUser?.avatar || 'U'}
          </div>
          <span className="hidden md:block text-sm font-semibold text-[#F8FAFC] max-w-[100px] truncate">
            {currentUser?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={14} className="text-[#94A3B8] hidden md:block" />
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsProfileOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-[#111C2E] rounded-2xl shadow-2xl border border-[#263449] z-40 py-2 animate-scale-in"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[#263449]">
                <p className="text-sm font-bold text-[#F8FAFC]">{currentUser?.name}</p>
                <p className="text-xs text-[#94A3B8] truncate">{currentUser?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#172337] text-sm text-[#94A3B8] hover:text-[#F8FAFC] no-underline transition-colors"
              >
                <User size={16} className="text-[#38BDF8]" /> My Profile
              </Link>
              <Link
                to="/security"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#172337] text-sm text-[#94A3B8] hover:text-[#F8FAFC] no-underline transition-colors"
              >
                <Shield size={16} className="text-[#14B8A6]" /> Security
              </Link>

              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#172337] text-sm text-[#94A3B8] hover:text-[#F8FAFC] no-underline transition-colors"
                >
                  <Settings size={16} className="text-[#F59E0B]" /> Admin Dashboard
                </Link>
              )}

              <div className="border-t border-[#263449] mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#EF4444]/10 text-sm text-[#94A3B8] hover:text-[#EF4444] transition-colors"
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
