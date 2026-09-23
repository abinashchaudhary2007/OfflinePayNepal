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
      className="h-14 sm:h-16 bg-white border-b border-[var(--color-gray-100)] flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 sticky top-0 z-30"
      style={{ boxShadow: '0 1px 0 0 var(--color-gray-100)' }}
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[var(--color-gray-100)] text-[var(--color-gray-600)] transition-colors touch-target"
        onClick={onMenuToggle}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-1.5 sm:gap-2 no-underline flex-shrink-0">
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm"
          style={{ background: 'linear-gradient(135deg, var(--color-navy-900), var(--color-indigo-600))' }}
        >
          OP
        </div>
        <span
          className="hidden sm:block font-bold text-sm sm:text-base"
          style={{ color: 'var(--color-navy-900)' }}
        >
          OfflinePay
        </span>
        <span
          className="hidden md:block text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'var(--color-indigo-600)', color: 'white' }}
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
            borderColor: isSimulating ? 'var(--color-amber-400)' : 'var(--color-gray-200)',
            color: isSimulating ? 'var(--color-amber-600)' : 'var(--color-gray-500)',
            background: isSimulating ? 'var(--color-amber-100)' : 'white',
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
        className="relative p-2 rounded-lg hover:bg-[var(--color-gray-100)] text-[var(--color-gray-500)] transition-colors touch-target"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: 'var(--color-red-500)' }}
        />
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(p => !p)}
          className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-[var(--color-gray-100)] transition-colors"
          aria-label="Account menu"
          aria-expanded={isProfileOpen}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: currentUser?.avatarColor || 'var(--color-indigo-600)' }}
          >
            {currentUser?.avatar || 'U'}
          </div>
          <span className="hidden md:block text-sm font-semibold text-[var(--color-gray-700)] max-w-[100px] truncate">
            {currentUser?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={14} className="text-[var(--color-gray-400)] hidden md:block" />
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsProfileOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-[var(--color-gray-100)] z-40 py-1.5 animate-scale-in"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--color-gray-100)]">
                <p className="text-sm font-semibold text-[var(--color-gray-900)]">{currentUser?.name}</p>
                <p className="text-xs text-[var(--color-gray-400)] truncate">{currentUser?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-gray-50)] text-sm text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)] no-underline transition-colors"
              >
                <User size={16} /> My Profile
              </Link>
              <Link
                to="/security"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-gray-50)] text-sm text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)] no-underline transition-colors"
              >
                <Shield size={16} /> Security
              </Link>

              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-gray-50)] text-sm text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)] no-underline transition-colors"
                >
                  <Settings size={16} /> Admin Dashboard
                </Link>
              )}

              <div className="border-t border-[var(--color-gray-100)] mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 text-sm text-[var(--color-gray-600)] hover:text-[var(--color-red-600)] transition-colors"
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
