import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet2, ArrowUpRight, WifiOff, History, User
} from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { useOfflineSimulation } from '../../hooks/useOfflineSimulation';

/**
 * DashboardLayout — Wraps all authenticated dashboard pages.
 * Provides: Navbar + Sidebar + OfflineBanner + Mobile bottom nav + main content area.
 */
function DashboardLayout({ children, maxWidth = 'max-w-6xl' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    isOffline,
    isSimulating,
    toggleOfflineSimulation,
    disableOfflineSimulation,
  } = useOfflineSimulation();

  return (
    <div className="h-screen flex flex-col bg-[var(--color-gray-50)] text-[var(--color-gray-900)] overflow-hidden">
      {/* Demo watermark banner */}
      <div className="demo-banner">
        OfflinePay Nepal · Educational Prototype (Simulated Money Only)
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
      <div className="flex flex-1 overflow-hidden gap-0 md:gap-6">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto pb-24 md:pb-10"
        >
          <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayout;
