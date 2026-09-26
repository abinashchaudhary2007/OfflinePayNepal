import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Wallet2, Shield, WifiOff, Info, Bell, LogOut, ExternalLink, ChevronRight, Cpu } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatting';

function Settings() {
  const { currentUser, logout } = useAuth();
  const { wallet, device, authorization } = useWallet();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'offline', label: 'Offline Payments', icon: WifiOff },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-7 animate-fade-in pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                color: isDark ? '#4F6FD8' : '#3155B8',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              }}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Manage your account, wallet, and security preferences.
          </p>
        </div>

        {/* 2-Column Tabs & Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Tab Navigation Card */}
          <div
            className="md:col-span-4 lg:col-span-3 rounded-2xl border p-2.5 space-y-1 shadow-xs"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EAF0FF] text-[#172B75] font-bold border-l-4 border-[#3155B8]'
                      : 'text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#3155B8]' : 'text-slate-400'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Active Tab Content Card */}
          <div
            className="md:col-span-8 lg:col-span-9 rounded-2xl border p-6 sm:p-7 space-y-6 shadow-xs"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            {/* TAB 1: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Account
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Manage the account information available to your wallet.
                  </p>
                </div>

                {/* Profile Sub-card */}
                <div
                  className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white text-[#3155B8] flex items-center justify-center flex-shrink-0 shadow-xs border border-[#DCE3F2]">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Profile
                      </h4>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        View your personal information and wallet identity.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="text-xs font-bold text-[#3155B8] hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    <span>View profile</span>
                    <span>→</span>
                  </Link>
                </div>

                {/* Account Controls Box */}
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Email, password, and sign-out controls are managed securely in your active authentication session.
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#DCE3F2]/60">
                    <span className="text-xs text-[#5F6B85]">Active User: <strong>{currentUser?.email || 'Demo User'}</strong></span>
                    <Button variant="outline" size="sm" onClick={handleLogout} leftIcon={<LogOut size={14} />}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WALLET */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Wallet Settings
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Manage wallet preferences, offline spending limits, and balance parameters.
                  </p>
                </div>

                <div
                  className="p-5 rounded-xl border space-y-3 text-xs"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  }}
                >
                  <div className="flex items-center justify-between py-1 border-b border-[#DCE3F2]">
                    <span className="text-[#5F6B85]">Default Currency</span>
                    <span className="font-bold text-[#172033]">NPR (Nepalese Rupee)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#DCE3F2]">
                    <span className="text-[#5F6B85]">Available Balance</span>
                    <span className="font-bold text-[#16A66A]">{formatCurrency(wallet?.availableBalance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#5F6B85]">Offline Limit Allowance</span>
                    <span className="font-bold text-[#3155B8]">NPR {wallet?.offlineLimit ? formatCurrency(wallet.offlineLimit) : '1,000.00'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Security Preferences
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Cryptographic key pairs, anti-replay nonces, and system verification logs.
                  </p>
                </div>

                <div
                  className="p-5 rounded-xl border space-y-4"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-[#3155B8]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#172033]">Security Center</h4>
                      <p className="text-xs text-[#5F6B85]">Inspect hardware keys, nonce counters, and full security logs.</p>
                    </div>
                  </div>

                  <Link
                    to="/security"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3155B8] text-white font-bold text-xs no-underline hover:bg-[#172B75] transition-colors"
                  >
                    <span>Open Security Center</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 4: OFFLINE PAYMENTS */}
            {activeTab === 'offline' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Offline Payments
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Manage device key registrations and offline transaction vouchers.
                  </p>
                </div>

                <div
                  className="p-5 rounded-xl border space-y-3 text-xs"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  }}
                >
                  <div className="flex items-center justify-between py-1 border-b border-[#DCE3F2]">
                    <span className="text-[#5F6B85]">Device Key Status</span>
                    <span className="font-bold text-[#16A66A]">{device?.status || 'Active'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#DCE3F2]">
                    <span className="text-[#5F6B85]">Offline Authorization</span>
                    <span className="font-bold text-[#3155B8]">{authorization?.status || 'ACTIVE'}</span>
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <Link to="/offline-authorization" className="btn btn-outline btn-sm text-xs no-underline">
                      Authorization Settings
                    </Link>
                    <Link to="/devices" className="btn btn-secondary btn-sm text-xs no-underline">
                      Device Management
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    About OfflinePay Nepal
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Offline-first digital payment prototype built for Nepal's network challenges.
                  </p>
                </div>

                <div
                  className="p-5 rounded-xl border space-y-2 text-xs leading-relaxed"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p><strong>Version:</strong> 1.0.0 (Phase 10 Production Prototype)</p>
                  <p><strong>Cryptography:</strong> ECDSA P-256 Asymmetric Signatures + SHA-256 Nonces</p>
                  <p><strong>Currency:</strong> Simulated Nepalese Rupee (NPR)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
