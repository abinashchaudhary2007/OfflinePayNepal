import { Link } from 'react-router-dom';
import { Plus, User, Store } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/DemoAuthContext';

const DEFAULT_PAYEES = [
  { id: 'usr-abinash', name: 'Abinash', fullName: 'Abinash Chaudhary', phone: '+977 9801234567', type: 'person', initial: 'A', bg: '#4F6FD8' },
  { id: 'usr-superstore', name: 'Superstore', fullName: 'City Mart Superstore', phone: '+977 9811223344', type: 'merchant', initial: 'S', bg: '#16A66A' },
  { id: 'usr-suman', name: 'Suman', fullName: 'Suman Shrestha', phone: '+977 9841987654', type: 'person', initial: 'S', bg: '#8B5CF6' },
  { id: 'usr-sita', name: 'Sita', fullName: 'Sita Sharma', phone: '+977 9865123456', type: 'person', initial: 'S', bg: '#EC4899' },
  { id: 'usr-bhatbhateni', name: 'Bhatbhateni', fullName: 'Bhatbhateni Store', phone: '+977 9800112233', type: 'merchant', initial: 'B', bg: '#F59E0B' },
];

function QuickPayees() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  return (
    <div
      style={{
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        padding: '14px 20px',
        boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
      }}
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Quick Pay & Frequent Contacts
        </h4>
        <Link
          to="/send"
          style={{
            fontSize: '0.72rem', fontWeight: 600,
            color: isDark ? '#738EE4' : '#3155B8',
            textDecoration: 'none',
          }}
          className="hover:underline"
        >
          New Payee
        </Link>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-0.5 pt-0.5 scroll-x">
        {/* Add New Payee Button */}
        <Link
          to="/send"
          style={{
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
            color: isDark ? '#BAC6E0' : '#172B75',
          }}
          className="flex flex-col items-center gap-1 shrink-0 group no-underline"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#BAC6E0] flex items-center justify-center transition-all group-hover:border-[#3155B8] group-hover:bg-[#EAF0FF]">
            <Plus size={16} className="transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-semibold text-center w-12 truncate" style={{ color: 'var(--text-secondary)' }}>
            Add New
          </span>
        </Link>

        {/* Payee Avatar Chips */}
        {DEFAULT_PAYEES.map((payee) => {
          const isMerchant = payee.type === 'merchant';
          return (
            <Link
              key={payee.id}
              to={`/send?to=${encodeURIComponent(payee.fullName)}&phone=${encodeURIComponent(payee.phone)}`}
              className="flex flex-col items-center gap-1 shrink-0 group no-underline"
            >
              <div
                style={{ background: payee.bg }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:shadow-md relative"
              >
                {isMerchant ? <Store size={15} /> : payee.initial}
                {isMerchant && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#172033] border border-white flex items-center justify-center text-[7px] text-white">
                    M
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold text-center w-12 truncate transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {payee.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default QuickPayees;
