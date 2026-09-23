import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, History, ArrowUpRight, QrCode, Shield
} from 'lucide-react';

/**
 * MobileBottomNav — Mobile-first bottom navigation bar.
 * Emphasizes "Pay" as the center primary floating action.
 */
export function MobileBottomNav() {
  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[var(--color-gray-200)] flex items-center justify-around px-2 py-1.5 z-40 safe-bottom"
      style={{ boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.06)' }}
    >
      {/* 1. Home */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[var(--color-indigo-600)] font-bold' : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'}
        `}
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>Home</span>
          </>
        )}
      </NavLink>

      {/* 2. Activity / Transactions */}
      <NavLink
        to="/transactions"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[var(--color-indigo-600)] font-bold' : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'}
        `}
      >
        {({ isActive }) => (
          <>
            <History size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>Activity</span>
          </>
        )}
      </NavLink>

      {/* 3. Center Emphasized Action: PAY */}
      <div className="flex-1 flex justify-center -mt-5">
        <NavLink
          to="/send"
          className="flex flex-col items-center group no-underline"
          aria-label="Pay Money"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, var(--color-indigo-600), var(--color-indigo-800))' }}
          >
            <ArrowUpRight size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-[var(--color-indigo-600)] mt-1">Pay</span>
        </NavLink>
      </div>

      {/* 4. Receive Hub */}
      <NavLink
        to="/receive"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[var(--color-indigo-600)] font-bold' : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'}
        `}
      >
        {({ isActive }) => (
          <>
            <QrCode size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>Receive</span>
          </>
        )}
      </NavLink>

      {/* 5. Security Center */}
      <NavLink
        to="/security"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[var(--color-indigo-600)] font-bold' : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'}
        `}
      >
        {({ isActive }) => (
          <>
            <Shield size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>Security</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

export default MobileBottomNav;
