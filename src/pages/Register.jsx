import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/DemoAuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { DemoBadge } from '../components/ui/Badge';

/**
 * Register page — Create a demo account.
 */
function Register() {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [formError, setFormError] = useState({});

  const handleChange = (e) => {
    clearError();
    setFormError(prev => ({ ...prev, [e.target.name]: undefined }));
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.phone) errs.phone = 'Phone number is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormError(errs); return; }

    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (result.success) navigate('/dashboard');
  };

  const features = [
    'Cryptographic transaction signing',
    'Offline QR payment transfers',
    'Real-time synchronization',
    'Security event monitoring',
  ];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: 'var(--color-gray-50)' }}
    >
      {/* ─── Left Panel ─── */}
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
            Create your
            <br />
            demo wallet.
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-6">
            Start with a Rs. 1,000 demo balance and explore all offline payment features.
          </p>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <CheckCircle2 size={16} color="var(--color-emerald-400)" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 relative z-10">
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-white/60 text-xs mb-1">Starting demo balance</p>
            <p className="text-white text-2xl font-bold">Rs. 1,000.00</p>
          </div>
          <DemoBadge />
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-6 sm:py-8">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 no-underline mb-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: 'linear-gradient(135deg, var(--color-navy-900), var(--color-indigo-600))' }}
            >
              OP
            </div>
            <span className="font-bold text-lg text-[var(--color-navy-900)]">OfflinePay Nepal</span>
          </Link>

          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)] mb-1">Create account</h1>
          <p className="text-[var(--color-gray-500)] mb-5 sm:mb-6 text-sm">Set up your demo wallet — no real money involved.</p>

          {/* Server error */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm mb-5"
              style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="register-name"
              name="name"
              type="text"
              label="Full Name"
              placeholder="Abinash Shrestha"
              value={form.name}
              onChange={handleChange}
              error={formError.name}
              leftIcon={<User size={16} />}
              autoComplete="name"
            />
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
            <Input
              id="register-password"
              name="password"
              type="password"
              label="Password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              error={formError.password}
              leftIcon={<Lock size={16} />}
              autoComplete="new-password"
            />
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={formError.confirmPassword}
              leftIcon={<Lock size={16} />}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              block
              size="lg"
              loading={isLoading}
              rightIcon={<ArrowRight size={18} />}
              id="register-submit-btn"
            >
              Create Demo Account
            </Button>
          </form>

          {/* Demo disclaimer */}
          <div
            className="mt-5 p-3 rounded-xl text-xs text-center"
            style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}
          >
            🎭 This is a demo account. Starting balance of Rs. 1,000 is simulated fictional money.
          </div>

          <p className="text-center text-sm text-[var(--color-gray-500)] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-indigo-600)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
