import { Link } from 'react-router-dom';
import {
  Wifi, WifiOff, QrCode, Shield, RefreshCw, Lock, CheckCircle2,
  ArrowRight, ChevronRight, Zap, Globe, Smartphone, Menu, X, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-gray-50)' }}>
      {/* Demo banner — single, slim, at top */}
      <div className="demo-banner">
        🎭 DEMO — SIMULATED MONEY ONLY — NOT A REAL PAYMENT SYSTEM
      </div>

      {/* ─── NAVBAR ─────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--color-gray-100)]">
        <div className="landing-container h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, var(--color-navy-900), var(--color-indigo-600))' }}
            >
              OP
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[var(--color-navy-900)]">OfflinePay</span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ background: 'var(--color-indigo-600)' }}
              >
                Nepal
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--color-gray-500)]">
            <a href="#how-it-works" className="hover:text-[var(--color-navy-900)] transition-colors no-underline">How It Works</a>
            <a href="#security"     className="hover:text-[var(--color-navy-900)] transition-colors no-underline">Security</a>
            <a href="#technology"   className="hover:text-[var(--color-navy-900)] transition-colors no-underline">Technology</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/login"    className="hidden sm:inline-flex btn btn-outline btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-gray-100)] bg-white px-4 py-4 space-y-1 animate-fade-in">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-[var(--color-gray-700)] py-2.5 no-underline border-b border-[var(--color-gray-50)]">How It Works</a>
            <a href="#security"     onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-[var(--color-gray-700)] py-2.5 no-underline border-b border-[var(--color-gray-50)]">Security</a>
            <a href="#technology"   onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-[var(--color-gray-700)] py-2.5 no-underline">Technology</a>
            <div className="flex gap-2 pt-3">
              <Link to="/login"    className="btn btn-outline btn-sm flex-1 justify-center">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm flex-1 justify-center">Register</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─────────────────────── */}
      <section className="hero-bg text-white" style={{ paddingTop: '56px', paddingBottom: '48px' }}>
        <div className="landing-container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {/* Tag */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-white/60 text-xs font-medium mb-5 animate-fade-in"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Zap size={12} className="text-amber-300" />
              Built for Nepal's connectivity challenges
            </div>

            <h1
              className="font-black mb-4 animate-fade-in text-balance"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', lineHeight: 1.15, animationDelay: '80ms' }}
            >
              Offline payments,
              <br />
              <span className="gradient-text">even without the internet.</span>
            </h1>

            <p
              className="text-white/65 mb-7 max-w-xl mx-auto text-balance animate-fade-in"
              style={{ fontSize: 'clamp(0.875rem, 2vw, 1.0625rem)', animationDelay: '160ms', lineHeight: 1.65 }}
            >
              A secure offline payment wallet prototype demonstrating cryptographically
              signed peer-to-peer transactions — no internet required.
            </p>

            {/* CTAs — indigo primary, outlined secondary */}
            <div className="flex flex-col xs:flex-row items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '240ms' }}>
              <Link to="/register" className="btn btn-primary btn-lg w-full xs:w-auto justify-center" style={{ minWidth: '180px' }}>
                Try Demo Wallet <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className="btn btn-outline-white btn-lg w-full xs:w-auto justify-center">
                How It Works
              </a>
            </div>
          </div>

          {/* ─── Flow diagram ─────────────── */}
          <div className="mt-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '320ms' }}>
            <div
              className="rounded-2xl px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="scroll-x">
                <div className="flex items-center justify-start sm:justify-center gap-0 min-w-max sm:min-w-0">
                  {[
                    { icon: Wifi,      label: 'Online',   sub: 'Authorization', color: '#34D399' },
                    { icon: WifiOff,   label: 'Offline',  sub: 'Payment',       color: '#FCD34D' },
                    { icon: QrCode,    label: 'QR',       sub: 'Transfer',      color: '#818CF8' },
                    { icon: Shield,    label: 'Offline',  sub: 'Verification',  color: '#FCD34D' },
                    { icon: RefreshCw, label: 'Online',   sub: 'Settlement',    color: '#34D399' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center px-4 py-4 group">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                          style={{ background: `${step.color}18`, border: `1.5px solid ${step.color}35` }}
                        >
                          <step.icon size={18} style={{ color: step.color }} />
                        </div>
                        <p className="text-white/80 font-semibold text-xs whitespace-nowrap">{step.label}</p>
                        <p className="text-white/35 text-[10px] whitespace-nowrap">{step.sub}</p>
                      </div>
                      {i < 4 && <ChevronRight size={14} className="text-white/20 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="landing-container">
          <SectionHeader
            badge="How It Works"
            title="The Offline Payment Flow"
            subtitle="From authorization to settlement — completely secure, even offline."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 stagger-children">
            <FlowCard
              step="01"
              icon={<Wifi size={22} color="var(--color-indigo-600)" />}
              iconBg="#EEF2FF"
              title="Online Authorization"
              points={[
                'User logs in and gets authenticated',
                'Server issues cryptographic spending allowance',
                'Device generates ECDSA P-256 key pair',
                'Public key registered on server',
              ]}
            />
            <FlowCard
              step="02"
              icon={<QrCode size={22} color="var(--color-amber-600)" />}
              iconBg="#FEF3C7"
              title="Offline QR Payment"
              points={[
                'Sender creates signed transaction',
                'Payload is cryptographically signed',
                'QR code generated from transaction',
                'Receiver scans and verifies locally',
              ]}
              highlighted
            />
            <FlowCard
              step="03"
              icon={<CheckCircle2 size={22} color="var(--color-emerald-600)" />}
              iconBg="#D1FAE5"
              title="Online Settlement"
              points={[
                'Internet connection restored',
                'Pending transactions uploaded',
                'Server verifies signature & nonce',
                'Anti-replay and double-spend checks',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─────────────────── */}
      <section id="security" className="py-16 sm:py-20" style={{ background: 'var(--color-gray-50)' }}>
        <div className="landing-container">
          <SectionHeader
            badge="Security"
            title="Security Architecture"
            subtitle="Designed to demonstrate secure offline transaction architecture."
          />

          {/* 3×2 grid — always 3 columns on desktop */}
          <div
            className="mt-10 grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {[
              { icon: Lock,       title: 'ECDSA P-256 Signatures',  desc: 'Every transaction is signed with the sender\'s private key using ECDSA P-256. Tampering makes signatures invalid.' },
              { icon: Shield,     title: 'Replay Attack Prevention', desc: 'Monotonic counters and nonces prevent the same transaction from being replayed.' },
              { icon: RefreshCw,  title: 'Double-Spend Detection',   desc: 'Server-side reconciliation catches offline double-spending during sync.' },
              { icon: Globe,      title: 'Offline Authorization',    desc: 'Spending limits and expiry set online prevent excessive offline transactions.' },
              { icon: Smartphone, title: 'Device Registration',      desc: 'Each device has its own key pair. Revoked devices are rejected by the server.' },
              { icon: Zap,        title: 'Security Events',          desc: 'All suspicious activity is logged: replay attempts, invalid signatures, revoked devices.' },
            ].map((item, i) => (
              <div key={i} className="card p-5 flex flex-col">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
                  style={{ background: 'var(--color-gray-100)' }}>
                  <item.icon size={18} color="var(--color-navy-900)" />
                </div>
                <h3 className="font-bold text-[var(--color-gray-900)] mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY ─────────────── */}
      <section id="technology" className="py-16 sm:py-20 bg-white">
        <div className="landing-container">
          <SectionHeader
            badge="Technology"
            title="Built with Modern Tech"
            subtitle="A robust stack designed to demonstrate offline payment architecture."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Frontend',     color: 'var(--color-indigo-600)', techs: ['React 19', 'Vite', 'Tailwind CSS v4', 'React Router'] },
              { label: 'Cryptography', color: 'var(--color-navy-900)',   techs: ['ECDSA P-256 Signatures', 'Web Crypto API', 'IndexedDB Key Storage', 'Canonical JSON Signing'] },
              { label: 'Storage',      color: '#0284C7',                 techs: ['IndexedDB (idb)', 'Offline Sync Queue', 'Nonce Registry', 'Persistent Sessions'] },
              { label: 'Offline',      color: '#059669',                 techs: ['QR Code Transfer', 'Local Verification', 'Authorization TTL', 'Sync Engine'] },
            ].map((col, i) => (
              <div key={i} className="card p-5">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: col.color }}
                >{col.label}</p>
                <ul className="space-y-2">
                  {col.techs.map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-[var(--color-gray-700)]">
                      <CheckCircle2 size={11} color="var(--color-emerald-500)" className="flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DISCLAIMER ─────────────── */}
      <section className="py-10 sm:py-12 border-t border-[var(--color-amber-200)]" style={{ background: '#FFFBEB' }}>
        <div className="landing-container max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'var(--color-amber-100)' }}>
              <AlertTriangle size={18} color="var(--color-amber-600)" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[var(--color-amber-800)] text-sm mb-1">Educational Prototype — Simulated Money Only</p>
              <p className="text-xs text-[var(--color-amber-700)] leading-relaxed">
                This is a <strong>simulated-money educational prototype</strong> and is not a real payment system.
                All balances and transactions use fictional demo money. This project does not integrate with real banks,
                payment gateways, or financial accounts. Designed for academic and portfolio demonstration purposes only.
              </p>
              <Link to="/register" className="btn btn-navy btn-sm mt-4 inline-flex">
                Try the Demo Wallet →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────── */}
      <footer className="py-6 bg-[var(--color-navy-900)]">
        <div className="landing-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              OP
            </div>
            <div>
              <p className="text-white/80 text-xs font-semibold">OfflinePay Nepal</p>
              <p className="text-white/35 text-[10px]">Secure offline payment prototype</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs text-white/40">
            <a href="#how-it-works" className="hover:text-white/60 transition-colors no-underline">How It Works</a>
            <a href="#security"     className="hover:text-white/60 transition-colors no-underline">Security</a>
            <a href="#technology"   className="hover:text-white/60 transition-colors no-underline">Technology</a>
          </div>
          <p className="text-white/25 text-[10px]">DEMO • SIMULATED MONEY ONLY</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────── */

function SectionHeader({ badge, title, subtitle }) {
  return (
    <div className="text-center max-w-xl mx-auto">
      <span
        className="inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
        style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-indigo-600)' }}
      >
        {badge}
      </span>
      <h2
        className="font-black text-[var(--color-gray-900)] mb-2"
        style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}
      >
        {title}
      </h2>
      <p className="text-[var(--color-gray-500)] text-sm sm:text-base">{subtitle}</p>
    </div>
  );
}

function FlowCard({ step, icon, iconBg, title, points, highlighted }) {
  return (
    <div className={`card p-5 animate-fade-in ${highlighted ? 'ring-2 ring-[var(--color-indigo-500)] ring-offset-2' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
        <span className="text-2xl font-black text-[var(--color-gray-100)]">{step}</span>
      </div>
      <h3 className="font-bold text-[var(--color-gray-900)] text-sm mb-2.5">{title}</h3>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-gray-500)]">
            <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" color="var(--color-emerald-500)" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Landing;
