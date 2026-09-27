/**
 * Settings.jsx — OfflinePay Nepal Settings & Preferences Center
 *
 * Comprehensive configuration suite for user identity, cryptographic keys,
 * wallet offline allowances, interactive preferences, and protocol policies.
 * Styled with OfflinePay Nepali fintech design system:
 * Deep Navy (#172B75), Royal Blue (#3155B8), Light Blue (#EAF0FF), Crisp White (#FFFFFF)
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Wallet2, Shield, WifiOff, Info, LogOut, ChevronRight,
  Sun, Moon, Smartphone, Key, Lock, CheckCircle2,
  Sliders, ShieldCheck, ArrowUpRight, Copy, Check,
  Volume2, SmartphoneCharging, Globe, Zap, AlertCircle
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatting';

function Settings() {
  const { currentUser, logout } = useAuth();
  const { wallet, device, authorization, setOfflineAllowance } = useWallet();
  const { theme, isDark, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState(wallet?.offlineLimit || 1000);
  const [limitSavedMsg, setLimitSavedMsg] = useState(false);

  // Preference switches (stored in localStorage)
  const [prefHaptics, setPrefHaptics] = useState(() => {
    return localStorage.getItem('offlinepay_pref_haptics') !== 'false';
  });
  const [prefInstantAck, setPrefInstantAck] = useState(() => {
    return localStorage.getItem('offlinepay_pref_instant_ack') !== 'false';
  });
  const [prefSound, setPrefSound] = useState(() => {
    return localStorage.getItem('offlinepay_pref_sound') !== 'false';
  });
  const [prefAutoSync, setPrefAutoSync] = useState(() => {
    return localStorage.getItem('offlinepay_pref_autosync') !== 'false';
  });
  const [prefLanguage, setPrefLanguage] = useState(() => {
    return localStorage.getItem('offlinepay_pref_lang') || 'en';
  });

  const toggleHaptics = () => {
    const next = !prefHaptics;
    setPrefHaptics(next);
    localStorage.setItem('offlinepay_pref_haptics', String(next));
  };

  const toggleInstantAck = () => {
    const next = !prefInstantAck;
    setPrefInstantAck(next);
    localStorage.setItem('offlinepay_pref_instant_ack', String(next));
  };

  const toggleSound = () => {
    const next = !prefSound;
    setPrefSound(next);
    localStorage.setItem('offlinepay_pref_sound', String(next));
  };

  const toggleAutoSync = () => {
    const next = !prefAutoSync;
    setPrefAutoSync(next);
    localStorage.setItem('offlinepay_pref_autosync', String(next));
  };

  const handleLanguageChange = (lang) => {
    setPrefLanguage(lang);
    localStorage.setItem('offlinepay_pref_lang', lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const copyDeviceId = () => {
    const idToCopy = device?.id || 'DEV-MUF9XP7M-660A';
    navigator.clipboard.writeText(idToCopy);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyUserId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const handleSaveLimitPreset = async (amt) => {
    setSelectedLimit(amt);
    if (typeof setOfflineAllowance === 'function') {
      try {
        await setOfflineAllowance(amt);
      } catch (e) {
        console.warn('Could not set allowance:', e);
      }
    }
    setLimitSavedMsg(true);
    setTimeout(() => setLimitSavedMsg(false), 2500);
  };

  // Avatar handling — properly extract photo URL or calculate clean 2-letter initials
  const userAvatarUrl = currentUser?.avatarPhotoUrl || (
    typeof currentUser?.avatar === 'string' && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http'))
      ? currentUser.avatar
      : null
  );

  const userInitials = currentUser?.name
    ? currentUser.name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (typeof currentUser?.avatar === 'string' && currentUser.avatar.length <= 3 ? currentUser.avatar : 'AJ');

  const tabs = [
    {
      group: 'IDENTITY & FINANCE',
      items: [
        { id: 'account', label: 'Account & Identity', icon: User, badge: currentUser?.role || 'User' },
        { id: 'wallet', label: 'Wallet & Spending Limits', icon: Wallet2, badge: 'NPR' },
      ],
    },
    {
      group: 'CRYPTOGRAPHY & ENGINE',
      items: [
        { id: 'security', label: 'Security & Key Pairs', icon: Shield, badge: 'ECDSA' },
        { id: 'offline', label: 'Offline Engine & Sync', icon: WifiOff, badge: authorization?.status === 'ACTIVE' ? 'Active' : 'Offline' },
      ],
    },
    {
      group: 'APPLICATION',
      items: [
        { id: 'preferences', label: 'Preferences & Experience', icon: Sliders, badge: isDark ? 'Dark' : 'Light' },
        { id: 'about', label: 'About & Compliance', icon: Info },
      ],
    },
  ];

  return (
    <DashboardLayout maxWidth="max-w-7xl">
      <div className="w-full space-y-8 animate-fade-in pb-16">
        {/* Page Banner Header */}
        <div
          className="rounded-3xl relative overflow-hidden border shadow-sm"
          style={{
            padding: '30px 36px',
            background: isDark
              ? 'linear-gradient(135deg, #101E4A 0%, #172B75 100%)'
              : 'linear-gradient(135deg, #172B75 0%, #203CA8 100%)',
            borderColor: isDark ? 'var(--border-color)' : '#1B3593',
            color: '#FFFFFF',
            borderRadius: '24px',
          }}
        >
          {/* Subtle decorative background circles */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl" />
          <div className="absolute right-32 -top-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none blur-lg" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg text-white">
                <Sliders size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Settings & System Control
                  </h1>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#16A66A] text-white uppercase tracking-wider shadow-xs">
                    Verified Node
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                  Manage personal identity credentials, local ECDSA P-256 keys, offline spending limits, and application interface settings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A66A] animate-pulse" />
                <span className="font-bold">Local Ledger: Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Tab Navigation Rail with Guaranteed Padding */}
          <div
            className="lg:col-span-4 rounded-3xl border shadow-sm flex flex-col justify-between"
            style={{
              padding: '28px 24px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              borderRadius: '24px',
              gap: '24px',
            }}
          >
            <div className="space-y-6">
              {tabs.map((tabGroup, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="px-2 pt-1 pb-1">
                    <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                      {tabGroup.group}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {tabGroup.items.map(({ id, label, icon: Icon, badge }) => {
                      const isActive = activeTab === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setActiveTab(id)}
                          className="w-full flex items-center justify-between rounded-2xl text-xs sm:text-sm font-semibold text-left transition-all cursor-pointer"
                          style={{
                            padding: '14px 18px',
                            background: isActive
                              ? (isDark ? '#233876' : '#EAF0FF')
                              : 'transparent',
                            color: isActive
                              ? (isDark ? '#FFFFFF' : '#172B75')
                              : 'var(--text-secondary)',
                            borderLeft: isActive
                              ? '4px solid #3155B8'
                              : '4px solid transparent',
                            fontWeight: isActive ? 700 : 500,
                            borderRadius: '16px',
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                background: isActive
                                  ? (isDark ? '#172B75' : '#D4E2FF')
                                  : (isDark ? 'var(--bg-elevated)' : '#F1F5F9'),
                                color: isActive
                                  ? '#3155B8'
                                  : 'var(--text-secondary)',
                              }}
                            >
                              <Icon size={17} />
                            </div>
                            <span className="truncate">{label}</span>
                          </div>

                          {badge && (
                            <span
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                              style={{
                                background: isActive
                                  ? '#3155B8'
                                  : (isDark ? 'var(--bg-elevated)' : '#F1F5F9'),
                                color: isActive
                                  ? '#FFFFFF'
                                  : 'var(--text-secondary)',
                              }}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Helper Banner in Sidebar */}
            <div
              className="rounded-2xl border text-xs space-y-2 mt-4"
              style={{
                padding: '20px 22px',
                background: isDark ? 'var(--bg-elevated)' : '#F8FAFF',
                borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                borderRadius: '18px',
              }}
            >
              <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck size={16} className="text-[#16A66A]" />
                <span>Zero-Trust Security</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Your private ECDSA cryptographic key never leaves this device. All offline transfers are signed locally.
              </p>
            </div>
          </div>

          {/* Right Active Tab Panel with Guaranteed Padding */}
          <div
            className="lg:col-span-8 rounded-3xl border shadow-sm space-y-7"
            style={{
              padding: '32px 36px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              borderRadius: '24px',
            }}
          >
            {/* ─────────────────────────────────────────────────────────────
                TAB 1: ACCOUNT & IDENTITY
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'account' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Account & Personal Identity
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Manage profile information, linked citizen identifiers, and active local session tokens.
                  </p>
                </div>

                {/* Profile Hero Card with Generous Padding */}
                <div
                  className="rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div
                      className="flex items-center justify-center flex-shrink-0 text-white font-black text-xl shadow-md overflow-hidden"
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                      }}
                    >
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black tracking-wider text-xl sm:text-2xl">{userInitials}</span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-lg sm:text-xl font-black tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                          {currentUser?.name || 'Abinash Chaudhary'}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#16A66A] border border-[#B3ECD2]">
                          <CheckCircle2 size={12} /> Verified Citizen
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                        {currentUser?.email || 'abinash@example.com'}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-[#3155B8]">
                        <span>Role: <strong className="capitalize">{currentUser?.role || 'User'}</strong></span>
                        <span>•</span>
                        <span>Node Status: <strong>Online / Synced</strong></span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm shadow-xs transition-all flex-shrink-0 no-underline text-white"
                    style={{
                      padding: '14px 22px',
                      borderRadius: '14px',
                      background: '#3155B8',
                    }}
                  >
                    <span>Edit Profile Details</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>

                {/* Session Details Box with Generous Padding */}
                <div
                  className="rounded-2xl border space-y-5"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        Local Session & Authentication Token
                      </h4>
                      <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Persisted in encrypted client storage for secure offline payment operations.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EAF0FF] text-[#3155B8] border border-[#D4E2FF]">
                      Session Active
                    </span>
                  </div>

                  <div
                    className="text-xs sm:text-sm font-mono space-y-3"
                    style={{
                      padding: '22px 26px',
                      background: isDark ? 'var(--bg-surface)' : '#F1F5F9',
                      color: isDark ? 'var(--text-primary)' : '#334155',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                      borderRadius: '16px',
                    }}
                  >
                    <div className="flex justify-between items-center gap-4 py-1">
                      <span className="text-[#64748B]">User Account ID:</span>
                      <div className="flex items-center gap-2 font-bold">
                        <span className="truncate max-w-[220px] sm:max-w-none">{currentUser?.id || 'demo-user-1'}</span>
                        <button
                          onClick={copyUserId}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{
                            background: isDark ? 'var(--bg-elevated)' : '#E2E8F0',
                            color: 'var(--text-primary)'
                          }}
                          title="Copy User ID"
                        >
                          {copiedUserId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-4 py-1 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                      <span className="text-[#64748B]">Primary Email:</span>
                      <span className="font-bold">{currentUser?.email || 'abinashjaiz5@gmail.com'}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t mt-4" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      End your session safely across all browser tabs.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      leftIcon={<LogOut size={15} />}
                      className="text-[#D64545] border-[#FACDCD] hover:bg-[#FDECEC] hover:border-[#D64545] font-bold px-5 py-2.5"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 2: WALLET & SPENDING LIMITS
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'wallet' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Wallet & Spending Limits
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Set offline reserve thresholds, max single transaction caps, and auto-refund policies.
                  </p>
                </div>

                {/* Balances Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div
                    className="border rounded-2xl space-y-2.5"
                    style={{
                      padding: '26px 28px',
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                      borderRadius: '20px',
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Operating Currency
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🇳🇵</span>
                      <div>
                        <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                          NPR (Nepalese Rupee)
                        </div>
                        <p className="text-[11px] text-[#64748B]">Simulated legal tender</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="border rounded-2xl space-y-2.5"
                    style={{
                      padding: '26px 28px',
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                      borderRadius: '20px',
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Available Online Balance
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#16A66A]">
                      {formatCurrency(wallet?.availableBalance || 0)}
                    </div>
                    <p className="text-[11px] text-[#64748B]">Available for online transfer or offline reserve</p>
                  </div>
                </div>

                {/* Offline Limit Preset Picker */}
                <div
                  className="rounded-2xl border space-y-5"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        Offline Allowance Preset
                      </h4>
                      <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Choose the maximum funds reserved for peer-to-peer offline payments.
                      </p>
                    </div>
                    {limitSavedMsg && (
                      <span className="text-xs font-bold text-[#16A66A] animate-fade-in flex items-center gap-1.5">
                        <Check size={15} /> Allowance Updated!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    {[500, 1000, 2000, 5000].map((amt) => {
                      const isSelected = selectedLimit === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => handleSaveLimitPreset(amt)}
                          className="border text-center transition-all cursor-pointer font-bold"
                          style={{
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: isSelected
                              ? '#3155B8'
                              : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                            borderColor: isSelected
                              ? '#172B75'
                              : (isDark ? 'var(--border-color)' : '#E2E8F0'),
                            color: isSelected
                              ? '#FFFFFF'
                              : 'var(--text-primary)',
                            transform: isSelected ? 'scale(1.02)' : 'none',
                          }}
                        >
                          <div className="text-xs opacity-80">Reserve</div>
                          <div className="text-base sm:text-lg font-extrabold mt-1">Rs. {amt.toLocaleString()}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Protection Rules Breakdown */}
                <div
                  className="rounded-2xl border space-y-4 text-xs sm:text-sm"
                  style={{
                    padding: '26px 30px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    borderRadius: '20px',
                  }}
                >
                  <h4 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Safety & Protection Rules
                  </h4>

                  <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Max Single Offline Transaction</span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Enforced client-side ceiling to minimize single voucher loss</p>
                    </div>
                    <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      NPR 5,000.00
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>5-Minute Voucher Auto-Refund</span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Unclaimed QR vouchers automatically expire and refund local reserve</p>
                    </div>
                    <span className="font-extrabold text-[#16A66A]">
                      300 Seconds
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Link
                    to="/offline-authorization"
                    className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm no-underline shadow-xs transition-colors text-white"
                    style={{
                      padding: '14px 24px',
                      borderRadius: '14px',
                      background: '#3155B8',
                    }}
                  >
                    <span>Open Offline Authorization Manager</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 3: SECURITY & CRYPTOGRAPHIC KEYS
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Security & Cryptographic Keys
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Inspect hardware-bound ECDSA keypairs, anti-replay monotonic counters, and zero-trust ledgers.
                  </p>
                </div>

                {/* Keypair Card */}
                <div
                  className="rounded-2xl border space-y-5"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Key size={22} />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                          ECDSA P-256 Hardware Keypair
                        </h4>
                        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                          NIST P-256 / secp256r1 Asymmetric Signature Engine
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Bound to Device</Badge>
                  </div>

                  <div
                    className="text-xs sm:text-sm space-y-3 font-mono border"
                    style={{
                      padding: '22px 26px',
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                      color: isDark ? 'var(--text-primary)' : '#334155',
                      borderRadius: '16px',
                    }}
                  >
                    <div className="flex justify-between items-center gap-3 py-1">
                      <span className="text-[#64748B]">Device ID:</span>
                      <div className="flex items-center gap-2 font-bold">
                        <span>{device?.id ? `${device.id.slice(0, 24)}...` : 'DEV-MUF9XP7M-660A'}</span>
                        <button
                          onClick={copyDeviceId}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{
                            background: isDark ? 'var(--bg-elevated)' : '#E2E8F0',
                            color: 'var(--text-primary)'
                          }}
                          title="Copy Device ID"
                        >
                          {copiedKey ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-3 py-1 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                      <span className="text-[#64748B]">Curve & Algorithm:</span>
                      <span className="font-bold text-[#3155B8]">ECDSA / SHA-256 (NIST P-256)</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 py-1 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                      <span className="text-[#64748B]">Anti-Replay Defense:</span>
                      <span className="font-bold text-[#16A66A]">IndexedDB Monotonic Nonce Registry</span>
                    </div>
                  </div>
                </div>

                {/* Direct Security Navigation Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Link
                    to="/security"
                    className="border text-left no-underline transition-all group rounded-2xl"
                    style={{
                      padding: '26px 28px',
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                      borderRadius: '20px',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#E8F8F1] text-[#16A66A] flex items-center justify-center">
                        <ShieldCheck size={22} />
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#3155B8] transition-colors" />
                    </div>
                    <h5 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      Security Center
                    </h5>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Audit security alerts, tamper detection logs, and live hardware health.
                    </p>
                  </Link>

                  <Link
                    to="/devices"
                    className="border text-left no-underline transition-all group rounded-2xl"
                    style={{
                      padding: '26px 28px',
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                      borderRadius: '20px',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center">
                        <Smartphone size={22} />
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#3155B8] transition-colors" />
                    </div>
                    <h5 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      Device Management
                    </h5>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Register new devices or revoke lost hardware keys instantly.
                    </p>
                  </Link>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 4: OFFLINE ENGINE & SYNCHRONIZATION
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'offline' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Offline Engine & Synchronization
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Two-Way P2P handshake specification, offline transaction validation, and automatic cloud settlement.
                  </p>
                </div>

                {/* Handshake Flow Stepper */}
                <div
                  className="rounded-2xl border space-y-5"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      2-Way P2P Dual-Ack Protocol Flow
                    </h4>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF0FF] text-[#3155B8]">
                      Zero Trust
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs sm:text-sm">
                    <div
                      className="border space-y-2"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                        borderRadius: '16px',
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#172B75] text-white flex items-center justify-center font-bold text-xs">1</div>
                      <div className="font-bold pt-1" style={{ color: 'var(--text-primary)' }}>Sender Sign</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Sender generates ECDSA-signed payment QR</p>
                    </div>

                    <div
                      className="border space-y-2"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                        borderRadius: '16px',
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#3155B8] text-white flex items-center justify-center font-bold text-xs">2</div>
                      <div className="font-bold pt-1" style={{ color: 'var(--text-primary)' }}>Receiver Ack</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Receiver verifies and signs return Ack QR</p>
                    </div>

                    <div
                      className="border space-y-2"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                        borderRadius: '16px',
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#16A66A] text-white flex items-center justify-center font-bold text-xs">3</div>
                      <div className="font-bold pt-1" style={{ color: 'var(--text-primary)' }}>Auto Settle</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Settles idempotently when internet reconnects</p>
                    </div>
                  </div>
                </div>

                {/* Auto Sync Toggle */}
                <div
                  className="rounded-2xl border space-y-4"
                  style={{
                    padding: '26px 30px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    borderRadius: '20px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Automatic Background Synchronization
                      </span>
                      <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Automatically settle queued offline vouchers the instant network returns.
                      </p>
                    </div>
                    <button
                      onClick={toggleAutoSync}
                      className="w-12 h-6 rounded-full transition-colors cursor-pointer relative p-0.5"
                      style={{
                        background: prefAutoSync
                          ? '#3155B8'
                          : (isDark ? '#334155' : '#CBD5E1')
                      }}
                      aria-label="Toggle auto sync"
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          prefAutoSync ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 5: PREFERENCES & THEME
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'preferences' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Application Preferences & Theme
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Customize visual themes, feedback sounds, haptics, and language options.
                  </p>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-xs sm:text-sm font-bold block mb-3.5" style={{ color: 'var(--text-primary)' }}>
                    Visual Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <button
                      onClick={() => setTheme('light')}
                      className="border text-left transition-all cursor-pointer flex items-center justify-between"
                      style={{
                        padding: '24px 28px',
                        borderRadius: '20px',
                        background: !isDark ? '#EAF0FF' : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        borderColor: !isDark ? '#3155B8' : (isDark ? 'var(--border-color)' : '#E2E8F0'),
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                          style={{
                            background: !isDark ? '#3155B8' : (isDark ? 'var(--bg-elevated)' : '#F1F5F9'),
                            color: !isDark ? '#FFFFFF' : 'var(--text-secondary)'
                          }}
                        >
                          <Sun size={22} />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>Light Mode</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Clean blue fintech palette</div>
                        </div>
                      </div>
                      {!isDark && <CheckCircle2 size={22} className="text-[#3155B8]" />}
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className="border text-left transition-all cursor-pointer flex items-center justify-between"
                      style={{
                        padding: '24px 28px',
                        borderRadius: '20px',
                        background: isDark ? '#1E293B' : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        borderColor: isDark ? '#3155B8' : (isDark ? 'var(--border-color)' : '#E2E8F0'),
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                          style={{
                            background: isDark ? '#3155B8' : (isDark ? 'var(--bg-elevated)' : '#F1F5F9'),
                            color: isDark ? '#FFFFFF' : 'var(--text-secondary)'
                          }}
                        >
                          <Moon size={22} />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>Dark Mode</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Deep contrast navy palette</div>
                        </div>
                      </div>
                      {isDark && <CheckCircle2 size={22} className="text-[#3155B8]" />}
                    </button>
                  </div>
                </div>

                {/* Experience & Feedback Toggles */}
                <div
                  className="rounded-2xl border space-y-5"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    borderRadius: '22px',
                  }}
                >
                  <h4 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Feedback & Hardware Cues
                  </h4>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3.5">
                      <Volume2 size={20} className="text-[#3155B8]" />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Audio Sound Cues</span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Play chime on successful transfer or QR scan</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSound}
                      className="w-12 h-6 rounded-full transition-colors cursor-pointer relative p-0.5"
                      style={{
                        background: prefSound
                          ? '#3155B8'
                          : (isDark ? '#334155' : '#CBD5E1')
                      }}
                      aria-label="Toggle sound feedback"
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          prefSound ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Haptics Toggle */}
                  <div className="flex items-center justify-between py-1.5 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                    <div className="flex items-center gap-3.5">
                      <SmartphoneCharging size={20} className="text-[#3155B8]" />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Haptic Vibration</span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Vibrate on camera viewfinder lock</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleHaptics}
                      className="w-12 h-6 rounded-full transition-colors cursor-pointer relative p-0.5"
                      style={{
                        background: prefHaptics
                          ? '#3155B8'
                          : (isDark ? '#334155' : '#CBD5E1')
                      }}
                      aria-label="Toggle haptics"
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          prefHaptics ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Instant Ack Toggle */}
                  <div className="flex items-center justify-between py-1.5 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                    <div className="flex items-center gap-3.5">
                      <Zap size={20} className="text-[#3155B8]" />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Fast Handshake Mode</span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Auto-generate receiver signature immediately after scanning</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleInstantAck}
                      className="w-12 h-6 rounded-full transition-colors cursor-pointer relative p-0.5"
                      style={{
                        background: prefInstantAck
                          ? '#3155B8'
                          : (isDark ? '#334155' : '#CBD5E1')
                      }}
                      aria-label="Toggle instant acknowledgment"
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          prefInstantAck ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Language Picker */}
                <div
                  className="rounded-2xl border space-y-4"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={20} className="text-[#3155B8]" />
                    <h4 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      Language & Regional Display
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className="border text-center transition-all cursor-pointer font-bold text-xs sm:text-sm"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '16px',
                        background: prefLanguage === 'en'
                          ? '#3155B8'
                          : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        borderColor: prefLanguage === 'en'
                          ? '#172B75'
                          : (isDark ? 'var(--border-color)' : '#E2E8F0'),
                        color: prefLanguage === 'en'
                          ? '#FFFFFF'
                          : 'var(--text-primary)'
                      }}
                    >
                      English (Standard)
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ne')}
                      className="border text-center transition-all cursor-pointer font-bold text-xs sm:text-sm"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '16px',
                        background: prefLanguage === 'ne'
                          ? '#3155B8'
                          : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        borderColor: prefLanguage === 'ne'
                          ? '#172B75'
                          : (isDark ? 'var(--border-color)' : '#E2E8F0'),
                        color: prefLanguage === 'ne'
                          ? '#FFFFFF'
                          : 'var(--text-primary)'
                      }}
                    >
                      नेपाली (Nepal)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 6: ABOUT & COMPLIANCE
            ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'about' && (
              <div className="space-y-7">
                <div className="border-b pb-5" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    About OfflinePay Nepal
                  </h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Next-generation offline-first payment architecture engineered for Nepal's mountainous topography.
                  </p>
                </div>

                <div
                  className="rounded-2xl border space-y-5 text-xs sm:text-sm leading-relaxed"
                  style={{
                    padding: '28px 32px',
                    background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    color: 'var(--text-secondary)',
                    borderRadius: '22px',
                  }}
                >
                  <p className="font-medium text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    <strong>OfflinePay Nepal</strong> is an educational fintech prototype showcasing zero-trust asymmetric cryptography (ECDSA P-256) for peer-to-peer offline mobile transactions without internet connectivity.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div
                      className="border space-y-1.5"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                        borderRadius: '16px',
                      }}
                    >
                      <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Application Version</span>
                      <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>v1.2.0 Production Prototype</span>
                    </div>

                    <div
                      className="border space-y-1.5"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                        borderRadius: '16px',
                      }}
                    >
                      <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Cryptography Engine</span>
                      <span className="font-bold text-sm sm:text-base text-[#3155B8]">W3C Web Crypto (ECDSA P-256)</span>
                    </div>

                    <div
                      className="border space-y-1.5"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                        borderRadius: '16px',
                      }}
                    >
                      <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Currency System</span>
                      <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Simulated NPR (Nepalese Rupee)</span>
                    </div>

                    <div
                      className="border space-y-1.5"
                      style={{
                        padding: '20px 22px',
                        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                        borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                        borderRadius: '16px',
                      }}
                    >
                      <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>Local Storage Ledger</span>
                      <span className="font-bold text-sm sm:text-base text-[#16A66A]">IndexedDB with Strict ACID Nonces</span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl border border-dashed text-xs sm:text-sm space-y-2"
                  style={{
                    padding: '24px 28px',
                    background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                    borderColor: isDark ? 'var(--border-color)' : '#CBD5E1',
                    color: 'var(--text-secondary)',
                    borderRadius: '20px',
                  }}
                >
                  <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Nepal Fintech Research Sandbox</p>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    Built for demonstration of resilient transactions in hilly and rural regions of Nepal where cellular data connectivity is intermittent or unavailable.
                  </p>
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
