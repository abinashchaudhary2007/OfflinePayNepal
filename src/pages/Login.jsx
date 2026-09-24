import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, AlertTriangle,
  CheckCircle2, ArrowLeft, Sparkles, WifiOff, KeyRound,
  Eye, EyeOff, HelpCircle, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';

/**
 * Login page — Modern, secure authentication with offline support,
 * password validation, and caps lock detection.
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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);

  const handleChange = (e) => {
    clearError();
    setFormError({});
    setResendMsg(null);
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F7FF] text-[#172033]">
      {/* ─── Left Panel: Fintech Showcase & Security Value Props ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-10 xl:p-12 bg-gradient-to-br from-[#172B75] to-[#3155B8] relative overflow-hidden select-none text-white">
        {/* Ambient Gradient Glows */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: '#4F6FD8' }}
        />
        <div
          className="absolute bottom-10 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: '#EAF0FF' }}
        />

        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline z-10 group">
          <img
            src="/logo.png"
            alt="OfflinePay Nepal Logo"
            className="w-12 h-12 rounded-2xl object-contain bg-white p-1 shadow-md transition-transform group-hover:scale-105 border border-white/20"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-extrabold text-xl tracking-tight">OfflinePay</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                Nepal
              </span>
            </div>
            <span className="text-[11px] text-[#EAF0FF]/80 font-medium tracking-wide">
              Nepali Digital Payment Platform
            </span>
          </div>
        </Link>

        {/* Main Pitch */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/25 mb-5 shadow-xs">
            <Sparkles size={14} className="text-[#EAF0FF] animate-pulse" />
            <span>Secure Offline Payment Architecture</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] tracking-tight mb-4">
            Zero internet?{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#EAF0FF] to-white">
              Payments still go through.
            </span>
          </h2>
          <p className="text-[#EAF0FF]/90 text-sm xl:text-base leading-relaxed max-w-md font-normal">
            Designed specifically for Nepal's connectivity realities. Authorize cryptographic peer payments that verify locally in milliseconds.
          </p>

          {/* Feature Showcase Cards */}
          <div className="mt-8 space-y-3.5 max-w-md">
            {[
              {
                icon: ShieldCheck,
                color: 'text-white bg-white/15 border-white/20',
                title: 'ECDSA P-256 Asymmetric Signatures',
                desc: 'Digital signatures generated locally inside your device’s secure WebCrypto keystore.',
              },
              {
                icon: WifiOff,
                color: 'text-white bg-white/15 border-white/20',
                title: 'Offline QR & Mesh Settlement',
                desc: 'Receivers verify payment tokens and anti-replay counters without cellular connectivity.',
              },
              {
                icon: KeyRound,
                color: 'text-white bg-white/15 border-white/20',
                title: 'Auto Cloud Reconciliation',
                desc: 'Offline transactions automatically synchronize to Supabase once network is restored.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm shadow-xs"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${f.color}`}>
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-[11px] text-[#EAF0FF]/80 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Prototype Footer Guarantee */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#EAF0FF]/80 pt-5 border-t border-white/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A66A] animate-ping" />
            <span className="font-medium text-white">Trust & Security Certified</span>
          </div>
          <span className="font-mono text-[11px] bg-white/15 px-2 py-0.5 rounded text-white border border-white/20">
            NPR Ledger
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3155B8] hover:text-[#172B75] no-underline transition-colors"
            >
              <ArrowLeft size={15} /> Back to Home
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle size="sm" />
              {isOffline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF6DD] text-[#8C6200] border border-[#F2A900]/40 animate-pulse">
                  <WifiOff size={13} className="text-[#8C6200]" /> Offline Mode Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A]" /> Online Sync Ready
                </span>
              )}
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white border border-[#DCE3F2] rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow">
            {/* Header Titles */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                Sign in to your wallet
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6B85] mt-1.5 leading-relaxed">
                Access your offline balance, cryptographic credentials, and transaction ledger.
              </p>
            </div>

            {/* Offline Notification Banner if offline */}
            {isOffline && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FFF6DD] border border-[#F2A900]/30 text-[#8C6200] text-xs flex items-start gap-2.5">
                <WifiOff size={16} className="text-[#8C6200] shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Offline Device Sign-In: </span>
                  You can sign in to any account previously saved on this device without internet connectivity.
                </div>
              </div>
            )}

            {/* Error Message with Resend Confirmation Option */}
            {error && (
              <div
                className="p-4 rounded-xl text-xs mb-5 border border-[#D64545]/30 bg-[#FDECEC] text-[#D64545] space-y-2.5 animate-shake"
                role="alert"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#D64545] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Unable to Sign In</p>
                    <p className="text-[#D64545] mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>

                {error.toLowerCase().includes('not confirmed') && (
                  <div className="pt-2 border-t border-[#D64545]/20">
                    <p className="text-[11px] text-[#D64545] mb-2 leading-relaxed">
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
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${resendMsg.includes('sent') ? 'text-[#16A66A]' : 'text-[#D64545]'}`}>
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
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C6200] bg-[#FFF6DD] border border-[#F2A900]/30 px-2.5 py-1 rounded-lg">
                    <AlertTriangle size={13} className="text-[#F2A900] shrink-0" />
                    <span>Warning: Caps Lock is ON</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Help Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-[#5F6B85] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#DCE3F2] text-[#172B75] focus:ring-[#3155B8] cursor-pointer"
                  />
                  <span>Remember my email</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-semibold text-[#3155B8] hover:text-[#172B75] hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In CTA Button (Primary CTA: Background #172B75, Text #FFFFFF) */}
              <Button
                type="submit"
                block
                size="lg"
                loading={isLoading}
                rightIcon={<ArrowRight size={18} />}
                id="login-submit-btn"
                className="mt-3 font-bold text-sm shadow-sm"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Wallet'}
              </Button>
            </form>

            {/* Bottom Register Prompt */}
            <div className="mt-6 pt-5 border-t border-[#DCE3F2] text-center text-xs sm:text-sm text-[#5F6B85]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[#3155B8] hover:text-[#172B75] hover:underline"
                id="link-create-account"
              >
                Create an account
              </Link>
              <div className="text-[11px] text-[#8993A8] mt-1">
                Includes Rs. 1,000 initial test balance + auto keypair generation
              </div>
            </div>
          </div>

          {/* Educational Sandbox Guarantee */}
          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5F6B85] bg-white py-1.5 px-3.5 rounded-full border border-[#DCE3F2] shadow-xs">
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
                <span className="font-bold text-slate-800">1. Account Credentials:</span>
                <p className="text-slate-500 mt-0.5">Enter your registered email and password to sign in.</p>
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
