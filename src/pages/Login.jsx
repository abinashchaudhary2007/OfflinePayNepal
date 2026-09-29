import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, AlertTriangle,
  CheckCircle2, ArrowLeft, Sparkles, WifiOff,
  HelpCircle, X
} from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Login page — Centered, modern, secure authentication with spacious padding and gap rhythm
 */
function Login() {
  const { login, resendConfirmationEmail, isLoading, error, clearError } = useAuth();
  const { isOffline } = useOfflineSimulation();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();

  // Enforce light mode on mount for the Login page
  useEffect(() => {
    if (setTheme) {
      setTheme('light');
    }
  }, [setTheme]);

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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F5F7FF] text-[#172033] relative">
      {/* ─── Ambient Glow Effects ─── */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] pointer-events-none opacity-60 blur-3xl -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(49, 85, 184, 0.16) 0%, rgba(23, 43, 117, 0.05) 50%, transparent 75%)',
        }}
      />
      <div
        className="fixed bottom-10 right-10 w-[380px] h-[380px] pointer-events-none opacity-40 blur-3xl rounded-full -z-10"
        style={{ background: '#EAF0FF' }}
      />

      {/* ─── Top Navigation Header ─── */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between z-10 shrink-0">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <img
            src="/logo.png"
            alt="OfflinePay Nepal Logo"
            className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-sm border border-[#DCE3F2] transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#172B75]">OfflinePay</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EAF0FF] text-[#172B75] border border-[#BAC6E0] uppercase tracking-wider">
                Nepal
              </span>
            </div>
            <span className="text-[11px] text-[#5F6B85] font-medium hidden sm:inline">
              Offline Digital Payment Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isOffline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF6DD] text-[#8C6200] border border-[#F2A900]/40 animate-pulse">
              <WifiOff size={13} className="text-[#8C6200]" />
              <span className="hidden sm:inline">Offline Mode Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A]" />
              <span className="hidden sm:inline">Online Sync Ready</span>
            </span>
          )}

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3155B8] hover:text-[#172B75] transition-colors no-underline px-3.5 py-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#DCE3F2]"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* ─── Centered Sign-In Card ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12 z-10 w-full">
        <div className="w-full max-w-lg mx-auto my-auto">
          <div
            className="bg-white rounded-3xl border border-[#DCE3F2] shadow-xl shadow-[#172B75]/6 relative backdrop-blur-sm"
            style={{ padding: 'clamp(24px, 5vw, 44px)' }}
          >
            {/* Top Brand Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#172B75] via-[#3155B8] to-[#4F6FD8]" />

            {/* Header / Intro */}
            <div className="text-center mb-7 sm:mb-8 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAF0FF] text-[#172B75] border border-[#BAC6E0]/60 mb-3.5 shadow-2xs">
                <Sparkles size={13} className="text-[#3155B8]" />
                <span>Secure Wallet Access</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight mb-2">
                Sign in to your wallet
              </h1>
              <p className="text-sm text-[#5F6B85] leading-relaxed max-w-md mx-auto">
                Access your offline balance, cryptographic credentials, and transaction ledger.
              </p>
            </div>

            {/* Offline Notification Banner if offline */}
            {isOffline && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FFF6DD] border border-[#F2A900]/30 text-[#8C6200] text-xs flex items-start gap-3">
                <WifiOff size={16} className="text-[#8C6200] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Offline Device Sign-In: </span>
                  You can sign in to any account previously authenticated on this device without active internet.
                </div>
              </div>
            )}

            {/* Error Message with Resend Confirmation Option */}
            {error && (
              <div
                className="p-4 rounded-2xl text-xs mb-6 border border-[#FDECEC] bg-[#FEF6F6] text-[#A83636] space-y-2.5 shadow-2xs"
                role="alert"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-[#D64545] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-xs sm:text-sm">Unable to Sign In</p>
                    <p className="text-[#A83636] mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>

                {error.toLowerCase().includes('not confirmed') && (
                  <div className="pt-2.5 border-t border-[#D64545]/20">
                    <p className="text-[11px] text-[#A83636] mb-2 leading-relaxed">
                      Supabase requires email confirmation before online sign-in. Check your inbox or request a new verification link below.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                        className="text-xs py-1.5 px-3.5 rounded-lg"
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
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
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

              {/* Password Input */}
              <div>
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
                />

                {/* Friendly Caps Lock Warning */}
                {isCapsLockOn && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6200] bg-[#FFF6DD] border border-[#F2A900]/30 px-3 py-1.5 rounded-xl mt-2">
                    <AlertTriangle size={14} className="text-[#F2A900] shrink-0" />
                    <span>Warning: Caps Lock is ON</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Help Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#5F6B85]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#DCE3F2] text-[#172B75] focus:ring-[#3155B8] cursor-pointer"
                  />
                  <span className="font-medium">Remember my email</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-bold text-[#3155B8] hover:text-[#172B75] hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In CTA Button */}
              <div className="pt-2 sm:pt-3">
                <Button
                  type="submit"
                  block
                  size="lg"
                  loading={isLoading}
                  rightIcon={<ArrowRight size={18} />}
                  id="login-submit-btn"
                  className="w-full h-12 sm:h-13 py-3.5 text-base font-bold shadow-md shadow-[#172B75]/20 hover:shadow-lg transition-all rounded-xl"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Wallet'}
                </Button>
              </div>
            </form>

            {/* Bottom Register Prompt */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-[#DCE3F2] text-center">
              <p className="text-sm text-[#5F6B85]">
                Don't have an account yet?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#172B75] hover:text-[#3155B8] transition-colors underline decoration-2 underline-offset-4"
                  id="link-create-account"
                >
                  Create an account
                </Link>
              </p>
              <div className="text-xs text-[#8993A8] mt-2 flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-[#16A66A]" />
                <span>Includes Rs. 1,000 sandbox test balance</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Bottom Footer ─── */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-5 text-center text-xs text-[#8993A8] z-10 shrink-0">
        <p>OfflinePay Nepal · Cryptographic Offline Digital Wallet · Sandbox Prototype</p>
      </footer>

      {/* ─── Forgot Password / Sandbox Credentials Helper Modal ─── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-[#DCE3F2] relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8993A8] hover:text-[#172033] hover:bg-[#F5F7FF] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center mb-3.5 border border-[#BAC6E0]/60">
              <HelpCircle size={22} />
            </div>

            <h3 className="text-base font-black text-[#172033] mb-1.5">
              Prototype Account Access
            </h3>
            <p className="text-xs leading-relaxed text-[#5F6B85] mb-4">
              OfflinePay Nepal is an educational prototype. In this sandbox environment, you have several quick options:
            </p>

            <div className="space-y-2.5 text-xs mb-5">
              <div className="p-3.5 rounded-xl border border-[#DCE3F2] bg-[#F5F7FF]">
                <span className="font-bold text-[#172033]">1. Account Credentials:</span>
                <p className="mt-0.5 text-[#5F6B85]">
                  Enter your registered email and password to sign in.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-[#DCE3F2] bg-[#F5F7FF]">
                <span className="font-bold text-[#172033]">2. Register New Account:</span>
                <p className="mt-0.5 text-[#5F6B85]">
                  Create a fresh account in 10 seconds. You will receive an instant Rs. 1,000 test balance.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
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
