import { Link } from 'react-router-dom';
import {
  Wifi, WifiOff, QrCode, Shield, RefreshCw, Lock, CheckCircle2,
  ArrowRight, Zap, Menu, X, Smartphone
} from 'lucide-react';
import { useState } from 'react';

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-gray-50)' }}>
      {/* ─── Slim Top Notice ─────────────────────────── */}
      <div className="demo-banner">
        OfflinePay Nepal · Prototype Demo
      </div>

      {/* ─── NAVBAR ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[var(--color-gray-100)]">
        <div className="landing-container h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ background: 'linear-gradient(135deg, var(--color-navy-900), var(--color-indigo-600))' }}
            >
              OP
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[var(--color-navy-900)] tracking-tight">OfflinePay</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                Nepal
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-gray-500)]">
            <a href="#how-it-works" className="hover:text-[var(--color-navy-900)] transition-colors no-underline">How It Works</a>
            <a href="#security" className="hover:text-[var(--color-navy-900)] transition-colors no-underline">Security</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-1.5 rounded-lg text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-gray-100)] bg-white px-5 py-4 space-y-2 animate-fade-in">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[var(--color-gray-700)] py-2 no-underline">How It Works</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[var(--color-gray-700)] py-2 no-underline">Security</a>
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn btn-outline btn-sm flex-1 justify-center">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm flex-1 justify-center">Register</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="hero-bg text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="landing-container relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold mb-6">
            <Zap size={13} className="text-amber-300" />
            Zero-Internet Payments
          </div>

          <h1
            className="font-black mb-4 tracking-tight text-balance"
            style={{ fontSize: 'clamp(2rem, 5.5vw, 3.75rem)', lineHeight: 1.1 }}
          >
            Pay anyone in Nepal,
            <br />
            <span className="gradient-text">even with zero internet.</span>
          </h1>

          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed text-balance">
            Peer-to-peer wallet using offline QR codes and cryptographic signatures to complete transactions anywhere.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto px-8 justify-center shadow-lg">
              Open Demo Wallet <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn btn-outline-white btn-lg w-full sm:w-auto px-8 justify-center">
              Try Demo Accounts
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3-STEP FLOW ─────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-[var(--color-gray-100)]">
        <div className="landing-container">
          <div className="text-center max-w-md mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
              How it works
            </h2>
            <p className="text-[var(--color-gray-500)] text-sm mt-1">
              Simple 3-step offline transfer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center mb-4">
                <Wifi size={24} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-indigo-600)] mb-1">Step 1</span>
              <h3 className="text-base font-bold text-[var(--color-gray-900)] mb-1.5">Reserve Limit</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Set aside an offline spending allowance while you have internet.
              </p>
            </div>

            <div className="card p-6 flex flex-col items-center text-center ring-2 ring-[var(--color-indigo-500)]/20">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[var(--color-amber-600)] flex items-center justify-center mb-4">
                <QrCode size={24} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-amber-600)] mb-1">Step 2</span>
              <h3 className="text-base font-bold text-[var(--color-gray-900)] mb-1.5">Pay via QR</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Generate and scan signed offline QR codes without mobile data.
              </p>
            </div>

            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[var(--color-emerald-600)] flex items-center justify-center mb-4">
                <RefreshCw size={24} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-emerald-600)] mb-1">Step 3</span>
              <h3 className="text-base font-bold text-[var(--color-gray-900)] mb-1.5">Auto-Sync</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Transactions verify and settle automatically upon reconnecting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY ────────────────────────────────── */}
      <section id="security" className="py-16 sm:py-20" style={{ background: 'var(--color-gray-50)' }}>
        <div className="landing-container">
          <div className="text-center max-w-md mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-gray-900)] tracking-tight">
              Security built-in
            </h2>
            <p className="text-[var(--color-gray-500)] text-sm mt-1">
              Protected against tampering and replay attacks
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center mb-3">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)] mb-1">ECDSA P-256 Signatures</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Every transaction is signed using hardware-backed private keys stored securely on your device.
              </p>
            </div>

            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[var(--color-emerald-600)] flex items-center justify-center mb-3">
                <Shield size={18} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)] mb-1">Replay Prevention</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Unique nonces and strictly advancing sequence counters stop transactions from being reused.
              </p>
            </div>

            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Smartphone size={18} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)] mb-1">Double-Spend Shield</h3>
              <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">
                Local limit tracking and central ledger reconciliation ensure funds cannot be spent twice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPACT FOOTER ──────────────────────────── */}
      <footer className="mt-auto py-8 bg-[var(--color-navy-900)] text-white/50 text-xs">
        <div className="landing-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-[10px]">
              OP
            </div>
            <span className="text-white/80 font-bold">OfflinePay Nepal</span>
          </div>
          <p className="text-white/40 text-[11px] text-center">
            Educational Prototype · Simulated Currency Only
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition-colors no-underline">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors no-underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
