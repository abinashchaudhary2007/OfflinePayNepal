import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowUpRight, ArrowDownLeft,
  List, User, Settings, X, QrCode, Shield, Smartphone, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send',         icon: ArrowUpRight,    label: 'Pay / Send' },
  { to: '/receive',      icon: ArrowDownLeft,   label: 'Receive' },
  { to: '/scan',         icon: QrCode,          label: 'Scan QR' },
  { to: '/transactions', icon: List,            label: 'Transactions' },
  { to: '/profile',      icon: User,            label: 'Profile' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
];

/**
 * Sidebar — Deep navy fintech sidebar with generous padding and icon alignment.
 */
function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { device } = useWallet();

  const userInitials = currentUser?.name
    ? currentUser.name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (typeof currentUser?.avatar === 'string' && currentUser.avatar.length <= 3 ? currentUser.avatar : 'AJ');

  const userAvatarUrl = currentUser?.avatarPhotoUrl || (
    typeof currentUser?.avatar === 'string' && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http'))
      ? currentUser.avatar
      : null
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 md:self-stretch w-72 bg-[#0F1E56]
          border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ease-in-out
          shadow-2xl md:shadow-none flex-shrink-0 overflow-hidden select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #132468 0%, #0C1742 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Mobile close header */}
        <div className="md:hidden flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
          <span className="text-xs font-extrabold text-white/80 uppercase tracking-widest">Navigation</span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── User Profile Card ── */}
        {currentUser && (
          <div style={{ padding: '20px 18px 12px 18px' }}>
            <div
              className="group transition-all duration-200 hover:border-white/25"
              style={{
                padding: '14px 16px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: userAvatarUrl ? 'transparent' : 'linear-gradient(135deg, #3B66F5 0%, #1A38B8 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '15px',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>

              {/* Name & Role */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser.name || 'Abinash Jaiz'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#16A66A',
                      boxShadow: '0 0 8px rgba(22, 166, 106, 0.9)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {currentUser.role || 'User'} · Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Section Label ── */}
        <div style={{ padding: '14px 24px 8px 24px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            Menu
          </span>
        </div>

        {/* ── Navigation Links ── */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '4px 14px 16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center transition-all duration-200 no-underline cursor-pointer w-full text-left
                 ${isActive
                   ? 'text-white'
                   : 'text-white/75 hover:text-white hover:bg-white/[0.08]'
                 }`
              }
              style={({ isActive }) => ({
                padding: '12px 16px',
                borderRadius: '16px',
                background: isActive
                  ? 'linear-gradient(135deg, #3862F8 0%, #1D42CF 100%)'
                  : 'transparent',
                boxShadow: isActive ? '0 4px 16px rgba(40, 80, 230, 0.4)' : 'none',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                gap: '14px',
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Icon badge container */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {/* Label text */}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: isActive ? 800 : 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {label}
                  </span>

                  {/* Active subtle chevron indicator */}
                  {isActive && (
                    <ChevronRight size={15} style={{ color: 'rgba(255, 255, 255, 0.8)', flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {currentUser?.role === 'admin' && (
            <div style={{ paddingTop: '10px', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center transition-all duration-200 no-underline cursor-pointer w-full text-left
                   ${isActive
                     ? 'text-[#F2A900]'
                     : 'text-white/70 hover:text-[#F2A900] hover:bg-[#F2A900]/10'
                   }`
                }
                style={({ isActive }) => ({
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isActive ? 'rgba(242, 169, 0, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(242, 169, 0, 0.4)' : '1px solid transparent',
                  gap: '14px',
                })}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'rgba(242, 169, 0, 0.15)',
                    color: '#F2A900',
                  }}
                >
                  <Shield size={18} strokeWidth={2} />
                </div>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  Admin Console
                </span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* ── Footer: Device info with generous padding ── */}
        <div
          style={{
            padding: '16px 18px 20px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(5, 10, 30, 0.5)',
            flexShrink: 0,
          }}
        >
          {device ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  flexShrink: 0,
                }}
              >
                <Smartphone size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.45)',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  Paired Device
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '4px 0 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {device.id}
                </p>
              </div>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#16A66A',
                  boxShadow: '0 0 8px rgba(22, 166, 106, 0.9)',
                  flexShrink: 0,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '12px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#F2A900',
                  boxShadow: '0 0 6px rgba(242, 169, 0, 0.8)',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Hardware keys active</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

