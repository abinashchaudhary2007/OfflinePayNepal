import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet2, ArrowUpRight, WifiOff, History, User
} from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { OfflineBanner } from '../ui/OfflineBanner';
import { useOfflineSimulation } from '../../hooks/useOfflineSimulation';

/**
 * DashboardLayout — Wraps all authenticated dashboard pages.
 * Provides: Navbar + Sidebar + OfflineBanner + Mobile bottom nav + main content area.
 */
function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    isOffline,
    isSimulating,
    toggleOfflineSimulation,
    disableOfflineSimulation,
  } = useOfflineSimulation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-gray-50)' }}>
      {/* Demo banner — always visible */}
      <div className="demo-banner">
        🎭 DEMO WALLET — SIMULATED MONEY ONLY — NO REAL TRANSACTIONS
      </div>

      {/* Offline banner */}
      <OfflineBanner
        isOffline={isOffline}
        isSimulating={isSimulating}
        onReconnect={isSimulating ? disableOfflineSimulation : undefined}
      />

      {/* Navbar */}
      <Navbar
        onMenuToggle={() => setIsSidebarOpen(p => !p)}
        isSidebarOpen={isSidebarOpen}
        isOffline={isOffline}
        isSimulating={isSimulating}
        onToggleOffline={toggleOfflineSimulation}
      />

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-8"
          style={{ minHeight: 0 }}
        >
          <div className="container-app py-4 sm:py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

/** Mobile bottom navigation tabs */
function MobileBottomNav() {
  const mobileNavItems = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
    { to: '/wallet',       icon: Wallet2,         label: 'Wallet' },
    { to: '/send',         icon: ArrowUpRight,    label: 'Send' },
    { to: '/offline',      icon: WifiOff,         label: 'Offline' },
    { to: '/transactions', icon: History,         label: 'History' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-gray-100)] flex z-20 safe-bottom"
      style={{ boxShadow: '0 -1px 12px rgba(0,0,0,0.06)' }}
    >
      {mobileNavItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5
            text-[10px] font-semibold transition-colors
            ${isActive
              ? 'text-[var(--color-indigo-600)]'
              : 'text-[var(--color-gray-400)]'
            }
          `}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default DashboardLayout;
