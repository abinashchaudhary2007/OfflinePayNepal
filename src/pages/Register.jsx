import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, ArrowRight, ArrowLeft,
  CheckCircle2, ShieldCheck, Sparkles, WifiOff, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Calculates a quick password strength score (0 to 4)
 */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-transparent' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-[#D64545]' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-[#F2A900]' };
    case 3:
      return { score: 3, label: 'Good', color: 'bg-[#3155B8]' };
    case 4:
      return { score: 4, label: 'Strong', color: 'bg-[#16A66A]' };
    default:
      return { score: 0, label: 'Too short', color: 'bg-[#BAC6E0]' };
  }
}

/**
 * Register page — Centered, modern, cryptographic wallet onboarding with spacious padding and layout
 */
function Register() {
  const { register, isLoading, error, clearError } = useAuth();
  const { setTheme } = useTheme();
  const { isOffline } = useOfflineSimulation();
  const navigate = useNavigate();

  // Enforce light mode on mount for the Register page
  useEffect(() => {
    if (setTheme) {
      setTheme('light');
    }
  }, [setTheme]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState({});

  const strength = getPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleChange = (e) => {
    clearError();
    setFormError(prev => ({ ...prev, [e.target.name]: undefined }));
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Full name is required.';
    }
    if (!form.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) {
      errs.phone = 'Please enter a valid phone number (e.g. 98XXXXXXXX).';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please repeat your password.';
    } else if (form.confirmPassword !== form.password) {
      errs.confirmPassword = 'Passwords do not match.';
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

    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (result.success) {
      navigate('/dashboard');
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF6DD] text-[#8C6200] border border-[#F2A900]/40">
              <WifiOff size={13} />
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

      {/* ─── Centered Form Card ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12 z-10 w-full">
        <div className="w-full max-w-xl mx-auto my-auto">
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
                <span>Zero Internet Required for Transfers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight mb-2">
                Create an account
              </h1>
              <p className="text-sm text-[#5F6B85] leading-relaxed max-w-md mx-auto mb-4">
                Set up your cryptographic offline digital wallet and start transacting seamlessly across Nepal.
              </p>

              {/* Value proposition badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F5F7FF] text-[#2C354C] border border-[#DCE3F2]">
                  <CheckCircle2 size={13} className="text-[#16A66A]" />
                  Offline QR Payments
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F5F7FF] text-[#2C354C] border border-[#DCE3F2]">
                  <ShieldCheck size={13} className="text-[#3155B8]" />
                  Local ECDSA Security
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F5F7FF] text-[#2C354C] border border-[#DCE3F2]">
                  <span className="font-bold text-[#16A66A]">Rs. 1,000</span> Sandbox Grant
                </span>
              </div>
            </div>

            {/* Server Error Alert */}
            {error && (
              <div
                className="flex items-start gap-2.5 p-4 rounded-2xl text-sm mb-6 border border-[#FDECEC] bg-[#FEF6F6] text-[#A83636] shadow-2xs"
                role="alert"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#D64545]" />
                <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Abinash Kumar Chaudhary"
                    value={form.name}
                    onChange={handleChange}
                    error={formError.name}
                    leftIcon={<User size={16} />}
                    autoComplete="name"
                  />
                </div>

                {/* Email address */}
                <div className="sm:col-span-1">
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    label="Email address"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={handleChange}
                    error={formError.email}
                    leftIcon={<Mail size={16} />}
                    autoComplete="email"
                  />
                </div>

                {/* Phone number */}
                <div className="sm:col-span-1">
                  <Input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    label="Phone number"
                    placeholder="+977-98XXXXXXXX"
                    value={form.phone}
                    onChange={handleChange}
                    error={formError.phone}
                    leftIcon={<Phone size={16} />}
                    autoComplete="tel"
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-1">
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    error={formError.password}
                    leftIcon={<Lock size={16} />}
                    autoComplete="new-password"
                  />
                  {form.password && (
                    <div className="mt-2 px-0.5">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                        <span className="text-[#8993A8]">Strength:</span>
                        <span
                          className="font-bold"
                          style={{
                            color:
                              strength.score === 1
                                ? '#D64545'
                                : strength.score === 2
                                ? '#D49400'
                                : strength.score === 3
                                ? '#3155B8'
                                : '#16A66A',
                          }}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#EAF0FF] rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full rounded-full transition-all duration-300 ${
                              strength.score >= step ? strength.color : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="sm:col-span-1">
                  <Input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={formError.confirmPassword}
                    leftIcon={<Lock size={16} />}
                    autoComplete="new-password"
                  />
                  {form.confirmPassword && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] px-0.5">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 size={13} className="text-[#16A66A]" />
                          <span className="text-[#16A66A] font-semibold">Passwords match</span>
                        </>
                      ) : passwordsMismatch ? (
                        <>
                          <AlertCircle size={13} className="text-[#D64545]" />
                          <span className="text-[#D64545] font-medium">Passwords do not match</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Keystore Informative Pill */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F5F7FF] border border-[#DCE3F2] flex items-start gap-3 text-xs text-[#444E66] leading-relaxed">
                <ShieldCheck size={18} className="text-[#3155B8] shrink-0 mt-0.5" />
                <span>
                  Your device will generate a local <strong>ECDSA P-256</strong> cryptographic key pair in your browser keystore. Private signing keys never leave your phone.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 sm:pt-3">
                <Button
                  type="submit"
                  block
                  size="lg"
                  loading={isLoading}
                  rightIcon={<ArrowRight size={18} />}
                  id="register-submit-btn"
                  className="w-full h-12 sm:h-13 py-3.5 text-base font-bold shadow-md shadow-[#172B75]/20 hover:shadow-lg transition-all rounded-xl"
                >
                  Create Account
                </Button>
              </div>
            </form>

            {/* Bottom Navigation */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-[#DCE3F2] text-center">
              <p className="text-sm text-[#5F6B85]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#172B75] hover:text-[#3155B8] transition-colors underline decoration-2 underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Bottom Footer ─── */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-5 text-center text-xs text-[#8993A8] z-10 shrink-0">
        <p>OfflinePay Nepal · Cryptographic Offline Digital Wallet · Sandbox Prototype</p>
      </footer>
    </div>
  );
}

export default Register;
