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
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#DCE3F2] flex items-center justify-around px-2 py-1.5 z-40 safe-bottom"
      style={{ boxShadow: '0 -4px 16px rgba(23, 43, 117, 0.06)' }}
    >
      {/* 1. Home */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[#172B75] font-bold' : 'text-[#5F6B85] hover:text-[#172B75]'}
        `}
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#3155B8]' : ''} />
            <span>Home</span>
          </>
        )}
      </NavLink>

      {/* 2. Activity / Transactions */}
      <NavLink
        to="/transactions"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[#172B75] font-bold' : 'text-[#5F6B85] hover:text-[#172B75]'}
        `}
      >
        {({ isActive }) => (
          <>
            <History size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#3155B8]' : ''} />
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
            className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-[#172B75] shadow-lg shadow-[#172B75]/30 group-active:scale-95 transition-all hover:bg-[#12215B]"
          >
            <ArrowUpRight size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-[#172B75] mt-1">Pay</span>
        </NavLink>
      </div>

      {/* 4. Receive Hub */}
      <NavLink
        to="/receive"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[#172B75] font-bold' : 'text-[#5F6B85] hover:text-[#172B75]'}
        `}
      >
        {({ isActive }) => (
          <>
            <QrCode size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#3155B8]' : ''} />
            <span>Receive</span>
          </>
        )}
      </NavLink>

      {/* 5. Security Center */}
      <NavLink
        to="/security"
        className={({ isActive }) => `
          flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-semibold transition-colors
          ${isActive ? 'text-[#172B75] font-bold' : 'text-[#5F6B85] hover:text-[#172B75]'}
        `}
      >
        {({ isActive }) => (
          <>
            <Shield size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#3155B8]' : ''} />
            <span>Security</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

export default MobileBottomNav;
