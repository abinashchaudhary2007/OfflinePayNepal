import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, AlertTriangle,
  CheckCircle2, ArrowLeft, Sparkles, User, WifiOff, KeyRound,
  Eye, EyeOff, HelpCircle, X, Check, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { getAllUsers } from '../services/db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// Fallback demo presets if no accounts are found locally yet
const DEFAULT_PRESETS = [
  {
    name: 'Abhi',
    email: 'abinashjaiz7@gmail.com',
    role: 'Standard User',
    avatar: 'A',
    avatarColor: '#4F46E5',
  },
  {
    name: 'Abinash Chaudhary',
    email: 'abinashjayswal1@gmail.com',
    role: 'Primary Account',
    avatar: 'AC',
    avatarColor: '#059669',
  },
];

/**
 * Login page — Modern, user-friendly authentication with offline support,
 * device account auto-detection, caps lock detection, and instant demo quick-fill.
 */
function Login() {
  const { login, resendConfirmationEmail, isLoading, error, clearError } = useAuth();
  const { isOffline } = useOfflineSimulation();
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);

  const [form, setForm] = useState({
    email: localStorage.getItem('offlinepay_remembered_email') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem('offlinepay_remembered_email')
  );
  const [formError, setFormError] = useState({});
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);

  // Load registered device accounts on mount
  useEffect(() => {
    let isMounted = true;
    getAllUsers()
      .then((users) => {
        if (!isMounted) return;
        if (users && users.length > 0) {
          // Filter out dummy test users if any, keep real registered accounts
          const uniqueByEmail = [];
          const seenEmails = new Set();
          for (const u of users) {
            const em = (u.email || '').toLowerCase().trim();
            if (em && !seenEmails.has(em)) {
              seenEmails.add(em);
              uniqueByEmail.push(u);
            }
          }
          setSavedAccounts(uniqueByEmail);
        } else {
          setSavedAccounts(DEFAULT_PRESETS);
        }
      })
      .catch(() => {
        if (isMounted) setSavedAccounts(DEFAULT_PRESETS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    clearError();
    setFormError({});
    setResendMsg(null);
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectAccount = (accountEmail) => {
    clearError();
    setFormError({});
    setForm(prev => ({ ...prev, email: accountEmail }));
    // Auto-focus password input for immediate entry
    setTimeout(() => {
      const passEl = document.getElementById('login-password');
      passEl?.focus();
    }, 50);
  };

  const handleKeyModifier = (e) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address (e.g. name@example.com).';
    }
    if (!form.password) {
      errs.password = 'Please enter your password.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormError(errs);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('offlinepay_remembered_email', form.email.trim());
    } else {
      localStorage.removeItem('offlinepay_remembered_email');
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleResendConfirmation = async () => {
    if (!form.email.trim()) {
      setFormError({ email: 'Please enter your email to resend confirmation.' });
      return;
    }
    setResendLoading(true);
    setResendMsg(null);
    const res = await resendConfirmationEmail(form.email.trim());
    setResendLoading(false);
    if (res.success) {
      setResendMsg('Confirmation email sent! Please check your inbox and spam folder.');
    } else {
      setResendMsg(res.error || 'Failed to resend confirmation email.');
    }
  };

  const displayAccounts = savedAccounts.length > 0 ? savedAccounts : DEFAULT_PRESETS;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-gray-50)] text-[var(--color-gray-900)]">
      {/* ─── Left Panel: Fintech Showcase & Security Value Props ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-10 xl:p-12 hero-bg relative overflow-hidden select-none">
        {/* Ambient Gradient Glows */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}
        />

        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline z-10 group">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--color-indigo-500), var(--color-indigo-700))' }}
          >
            OP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-xl tracking-tight">OfflinePay</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                Nepal
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Simulated Offline Wallet System
            </span>
          </div>
        </Link>

        {/* Main Pitch */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-5 shadow-xs">
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            <span>Next-Gen Offline Fintech Architecture</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.2] tracking-tight mb-4">
            Zero internet?{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Payments still go through.
            </span>
          </h2>
          <p className="text-slate-300 text-sm xl:text-base leading-relaxed max-w-md font-normal">
            Designed specifically for Nepal's connectivity realities. Authorize cryptographic peer payments that verify locally in milliseconds.
          </p>

          {/* Feature Showcase Cards */}
          <div className="mt-8 space-y-3.5 max-w-md">
            {[
              {
                icon: ShieldCheck,
                color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
                title: 'ECDSA P-256 Asymmetric Signatures',
                desc: 'Digital signatures generated locally inside your device’s secure WebCrypto keystore.',
              },
              {
                icon: WifiOff,
                color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
                title: 'Offline QR & Mesh Settlement',
                desc: 'Receivers verify payment tokens and anti-replay counters without cellular connectivity.',
              },
              {
                icon: KeyRound,
                color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
                title: 'Auto Cloud Reconciliation',
                desc: 'Offline transactions automatically synchronize to Supabase once network is restored.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${f.color}`}>
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Prototype Footer Guarantee */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-5 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium text-slate-300">Sandbox Environment Active</span>
          </div>
          <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Simulated NPR Only
          </span>
        </div>
      </div>

      {/* ─── Right Panel: Interactive Sign-In Experience ─── */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 lg:p-10 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto space-y-5">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-indigo-600)] hover:text-[var(--color-indigo-700)] no-underline transition-colors"
            >
              <ArrowLeft size={15} /> Back to Home
            </Link>

            {isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                <WifiOff size={13} className="text-amber-600" /> Offline Mode Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online Sync Ready
              </span>
            )}
          </div>

          {/* Main Card */}
          <div className="bg-white border border-[var(--color-gray-200)] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
            {/* Header Titles */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
                Sign in to your wallet
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-gray-500)] mt-1.5 leading-relaxed">
                Access your offline balance, cryptographic credentials, and transaction ledger.
              </p>
            </div>

            {/* Offline Notification Banner if offline */}
            {isOffline && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <WifiOff size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Offline Device Sign-In: </span>
                  You can sign in to any account previously saved on this device without internet connectivity.
                </div>
              </div>
            )}

            {/* ─── Quick Account Selection (User-Friendly 1-Tap Fill) ─── */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gray-500)] flex items-center gap-1.5">
                  <User size={13} className="text-[var(--color-indigo-600)]" />
                  {savedAccounts.length > 0 ? 'Accounts on this device' : 'Quick Demo Accounts'}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                  1-Tap Fill
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayAccounts.slice(0, 4).map((account) => {
                  const isSelected = form.email.toLowerCase() === (account.email || '').toLowerCase();
                  const initials = account.avatar || account.name?.slice(0, 2).toUpperCase() || 'U';

                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleSelectAccount(account.email)}
                      className={`group relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200 hover:border-indigo-300'
                      }`}
                      title={`Select ${account.name || account.email}`}
                    >
                      {/* Avatar Circle */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{ backgroundColor: account.avatarColor || '#4F46E5' }}
                      >
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[var(--color-gray-900)] truncate">
                            {account.name || 'User'}
                          </p>
                          {isSelected && (
                            <Check size={14} className="text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-gray-500)] truncate">
                          {account.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message with Resend Confirmation Option */}
            {error && (
              <div
                className="p-4 rounded-xl text-xs mb-5 border border-red-200 bg-red-50 text-red-800 space-y-2.5 animate-shake"
                role="alert"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Unable to Sign In</p>
                    <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>

                {error.toLowerCase().includes('not confirmed') && (
                  <div className="pt-2 border-t border-red-200">
                    <p className="text-[11px] text-red-700 mb-2 leading-relaxed">
                      Supabase requires verifying your email before cloud login. Check your inbox or click to resend a verification link.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                        className="text-xs py-1 px-3"
                      >
                        {resendLoading ? 'Sending link...' : 'Resend Verification Link'}
                      </Button>
                      {resendMsg && (
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${resendMsg.includes('sent') ? 'text-emerald-700' : 'text-red-700'}`}>
                          {resendMsg.includes('sent') && <CheckCircle2 size={13} />}
                          {resendMsg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Input */}
              <Input
                id="login-email"
                name="email"
                type="email"
                label="Email address"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                error={formError.email}
                leftIcon={<Mail size={16} />}
                autoComplete="email"
                autoFocus={!form.email}
              />

              {/* Password Input with Caps Lock Alert & Toggle Eye */}
              <div className="space-y-1">
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyModifier}
                  onKeyUp={handleKeyModifier}
                  error={formError.password}
                  leftIcon={<Lock size={16} />}
                  autoComplete="current-password"
                  autoFocus={!!form.email && !form.password}
                  hint="Minimum 6 characters"
                />

                {/* Friendly Caps Lock Warning */}
                {isCapsLockOn && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                    <span>Warning: Caps Lock is ON</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Help Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-[var(--color-gray-600)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-gray-300)] text-[var(--color-indigo-600)] focus:ring-[var(--color-indigo-500)] cursor-pointer"
                  />
                  <span>Remember my email</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-semibold text-[var(--color-indigo-600)] hover:text-[var(--color-indigo-700)] hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In CTA Button */}
              <Button
                type="submit"
                block
                size="lg"
                loading={isLoading}
                rightIcon={<ArrowRight size={18} />}
                id="login-submit-btn"
                className="mt-3 font-bold text-sm shadow-md shadow-indigo-600/20"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Wallet'}
              </Button>
            </form>

            {/* Bottom Register Prompt */}
            <div className="mt-6 pt-5 border-t border-[var(--color-gray-100)] text-center text-xs sm:text-sm text-[var(--color-gray-600)]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[var(--color-indigo-600)] hover:text-[var(--color-indigo-700)] hover:underline"
                id="link-create-account"
              >
                Create an account
              </Link>
              <div className="text-[11px] text-[var(--color-gray-400)] mt-1">
                Includes Rs. 1,000 initial test balance + auto keypair generation
              </div>
            </div>
          </div>

          {/* Educational Sandbox Guarantee */}
          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-gray-500)] bg-slate-100 py-1.5 px-3.5 rounded-full border border-slate-200">
              <span>🎭</span>
              <span>Educational prototype · Uses simulated NPR test tokens only</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Forgot Password / Sandbox Credentials Helper Modal ─── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <HelpCircle size={20} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Prototype Account Access
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              OfflinePay Nepal is an educational prototype. In this sandbox environment, you have several quick options:
            </p>

            <div className="space-y-2.5 text-xs mb-5">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">1. Instant Demo Accounts:</span>
                <p className="text-slate-500 mt-0.5">Use one of the pre-filled demo accounts on the login screen.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">2. Register New Account:</span>
                <p className="text-slate-500 mt-0.5">Create a fresh account in 10 seconds. You will receive an instant Rs. 1,000 test balance.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                block
                size="sm"
                onClick={() => {
                  setShowForgotModal(false);
                  navigate('/register');
                }}
              >
                Create New Account
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowForgotModal(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
