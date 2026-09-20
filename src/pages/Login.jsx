import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * Login page — Secure authentication with Supabase and offline session support.
 */
function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState({});

  const handleChange = (e) => {
    clearError();
    setFormError({});
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormError(errs); return; }

    const result = await login(form.email, form.password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: 'var(--color-gray-50)' }}
    >
      {/* ─── Left Panel ───── */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-10 hero-bg">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            OP
          </div>
          <span className="text-white font-bold text-lg">OfflinePay Nepal</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-4">
            Secure offline payments
            <br />
            at your fingertips.
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Cryptographically signed peer-to-peer transactions
            that work without internet connectivity.
          </p>

          {/* Mini flow */}
          <div className="mt-8 space-y-3">
            {[
              { label: 'Get offline authorization', done: true },
              { label: 'Send money via QR', done: true },
              { label: 'Receiver verifies signature', done: true },
              { label: 'Sync when back online', done: true },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: step.done ? 'var(--color-emerald-500)' : 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-white/70 text-sm">{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>ECDSA P-256 Device Identity Protected</span>
        </div>
      </div>

      {/* ─── Right Panel ───── */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 lg:p-10 py-10">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 no-underline mb-6 sm:mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: 'var(--color-navy-900)' }}
            >
              OP
            </div>
            <span className="font-bold text-base sm:text-lg text-[var(--color-navy-900)]">OfflinePay Nepal</span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-gray-900)] mb-1">Sign in to your wallet</h1>
          <p className="text-[var(--color-gray-500)] mb-6 text-sm">Enter your registered email and password to access your account.</p>

          {/* Server error */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm mb-5 border border-red-200"
              style={{ background: 'var(--color-red-50)', color: 'var(--color-red-700)' }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            />
            <Input
              id="login-password"
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={formError.password}
              leftIcon={<Lock size={16} />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              block
              size="lg"
              loading={isLoading}
              rightIcon={<ArrowRight size={18} />}
              id="login-submit-btn"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-gray-200)] text-center text-sm text-[var(--color-gray-500)]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-[var(--color-indigo-600)] hover:text-[var(--color-indigo-700)] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
