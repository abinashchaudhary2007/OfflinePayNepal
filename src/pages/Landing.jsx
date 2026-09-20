import { Link } from 'react-router-dom';
import {
  Wifi, WifiOff, QrCode, Shield, RefreshCw, Lock, CheckCircle2,
  ArrowRight, Zap, Menu, X, Smartphone, Check, ChevronDown,
  ExternalLink, Layers, ShieldCheck, Key, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { useState } from 'react';

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('sender'); // 'sender' | 'receiver'
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[var(--color-gray-900)]">
      {/* ─── Top Prototype Disclaimer Banner ──────────────────────── */}
      <aside aria-label="Prototype notice" className="demo-banner">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Educational Prototype
        </span>
        <span className="text-slate-500 hidden sm:inline">·</span>
        <span className="text-slate-400">
          Simulated NPR Currency Only — No real monetary transactions
        </span>
      </aside>

      {/* ─── Minimal Sticky Navbar ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="landing-container h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-indigo-600)] flex items-center justify-center text-white font-semibold text-sm shadow-xs transition-transform group-hover:scale-105">
              OP
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-[var(--color-gray-900)] tracking-tight">
                OfflinePay
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Nepal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors no-underline">How It Works</a>
            <a href="#security" className="hover:text-gray-900 transition-colors no-underline">Security</a>
            <a href="#see-in-action" className="hover:text-gray-900 transition-colors no-underline">See in Action</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors no-underline">FAQ</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Open Demo Wallet
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white px-5 py-4 space-y-3 animate-fade-in shadow-lg">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1.5 no-underline hover:text-indigo-600"
            >
              How It Works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1.5 no-underline hover:text-indigo-600"
            >
              Security Architecture
            </a>
            <a
              href="#see-in-action"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1.5 no-underline hover:text-indigo-600"
            >
              Product Preview
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1.5 no-underline hover:text-indigo-600"
            >
              FAQ
            </a>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link to="/login" className="btn btn-outline btn-sm flex-1 justify-center">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm flex-1 justify-center">
                Open Wallet
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION (Fintech Minimal) ───────────────────────── */}
      <section className="hero-bg text-white py-20 sm:py-24 relative">
        <div className="landing-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Prototype Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Educational Prototype · Simulated NPR Currency
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.15] text-white mb-5">
              Instant peer-to-peer payments,
              <br />
              <span className="text-indigo-300">even with zero internet.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
              Built for network blackouts across Nepal. Transact offline using asymmetric
              cryptographic QR vouchers that verify locally and settle automatically upon reconnecting.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
              <Link
                to="/register"
                className="btn btn-primary btn-lg w-full sm:w-auto px-7 justify-center shadow-sm"
              >
                Open Demo Wallet <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline-white btn-lg w-full sm:w-auto px-7 justify-center"
              >
                Explore Demo Accounts
              </Link>
            </div>
          </div>

          {/* ─── HERO VISUAL: Realistic Fintech Product Mockup ──────── */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              {/* Mockup Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">offlinepay.local/exchange</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                  <WifiOff size={12} />
                  Offline Mode · Zero Cellular Data
                </div>
              </div>

              {/* Dual-Pane Exchange Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Sender Offline Voucher */}
                <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Sender View
                      </span>
                      <span className="badge badge-pending text-[10px]">
                        Cryptographically Signed
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-slate-400 mb-0.5">Transfer Amount</div>
                      <div className="text-2xl font-semibold text-white font-mono tracking-tight">
                        NPR 1,250.00
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        To: <span className="text-slate-200 font-medium">Anshu Tamang (anshu@offlinepay.local)</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800/80 space-y-1.5 text-[11px] font-mono mb-4">
                      <div className="flex justify-between text-slate-400">
                        <span>Algorithm:</span>
                        <span className="text-indigo-300">ECDSA P-256 (SHA-256)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Nonce:</span>
                        <span className="text-slate-300 truncate max-w-[140px]">7f3c9a10bf82...</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Reserve Remaining:</span>
                        <span className="text-emerald-400">NPR 3,750.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-500" /> Valid for 14m 42s
                    </span>
                    <span className="text-indigo-400 font-medium">Ready for QR scan →</span>
                  </div>
                </div>

                {/* Right Card: Receiver Verification Result */}
                <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Receiver Scanner
                      </span>
                      <span className="badge badge-settled text-[10px]">
                        Validated Locally
                      </span>
                    </div>

                    <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-3.5 mb-4 text-center">
                      <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-1.5" />
                      <div className="text-xs font-semibold text-emerald-300">
                        Payment Accepted Offline
                      </div>
                      <div className="text-lg font-semibold text-white font-mono mt-0.5">
                        + NPR 1,250.00
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Public key signature verified via WebCrypto</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Sequence counter #004 verified (anti-replay)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Stored in offline settlement queue (IndexedDB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/60 mt-3">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={13} className="text-slate-500" /> Auto-syncs on reconnect
                    </span>
                    <span className="text-emerald-400 font-medium">Receipt saved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="landing-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700">
              <ShieldCheck size={18} className="text-[var(--color-indigo-600)] flex-shrink-0" />
              <span>ECDSA P-256 Signatures</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700">
              <WifiOff size={18} className="text-amber-600 flex-shrink-0" />
              <span>Zero Internet Required</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700">
              <Lock size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Anti-Replay Nonce Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700">
              <Layers size={18} className="text-slate-600 flex-shrink-0" />
              <span>Educational Sandbox</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (3-Step Connected Flow) ─────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-white border-b border-gray-200">
        <div className="landing-container">
          <div className="max-w-xl mx-auto text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-indigo-600)] mb-2 block">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              How offline payments work
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Decentralized peer-to-peer digital transactions in three predictable steps.
            </p>
          </div>

          {/* 3 Step Cards with visual connectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="card p-7 flex flex-col justify-between relative bg-white">
              <div>
                <div className="w-11 h-11 rounded-lg bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center mb-5">
                  <Wifi size={22} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-indigo-600)] mb-1">
                  Step 01
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reserve Spending Limit
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  While connected to the internet, allocate an offline allowance from your
                  account balance. This amount is reserved locally in tamper-evident storage.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" /> Backed by central balance
              </div>
            </div>

            {/* Step 2 */}
            <div className="card p-7 flex flex-col justify-between relative bg-white border-indigo-200">
              <div>
                <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <QrCode size={22} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
                  Step 02
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Exchange Signed QR
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  In a blackout, generate a cryptographic payment voucher. The receiver scans the
                  QR code and verifies the ECDSA signature locally without internet access.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" /> Instant local verification
              </div>
            </div>

            {/* Step 3 */}
            <div className="card p-7 flex flex-col justify-between relative bg-white">
              <div>
                <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <RefreshCw size={22} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                  Step 03
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Auto-Sync & Settle
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  Once either phone reconnects to cellular data or Wi-Fi, the queued voucher
                  automatically synchronizes with the central ledger and settles permanently.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" /> Automatic double-spend shield
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY SECTION (3 Pillars) ─────────────────────────── */}
      <section id="security" className="py-20 sm:py-24 bg-slate-50 border-b border-gray-200">
        <div className="landing-container">
          <div className="max-w-xl mx-auto text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-indigo-600)] mb-2 block">
              Cryptographic Safeguards
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              Security built for zero-trust environments
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              How OfflinePay prevents fraud, counterfeiting, and duplicate spending when servers are unreachable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Security Pillar 1 */}
            <div className="card p-7 bg-white">
              <div className="w-11 h-11 rounded-lg bg-indigo-50 text-[var(--color-indigo-600)] flex items-center justify-center mb-5">
                <Key size={22} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Client-Side ECDSA P-256
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Private keys are generated using the browser’s WebCrypto API and stored securely in
                IndexedDB. Private keys never travel across networks or leave the device.
              </p>
            </div>

            {/* Security Pillar 2 */}
            <div className="card p-7 bg-white">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Lock size={22} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Monotonic Nonce Tracking
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Every generated voucher incorporates a sequential counter and cryptographically
                unpredictable nonce. The receiver’s scanner rejects any duplicate or replayed tokens.
              </p>
            </div>

            {/* Security Pillar 3 */}
            <div className="card p-7 bg-white">
              <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Pre-Allocated Limit Locks
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                Double spending is eliminated at the architecture level by locking funds in an offline
                pool. Users cannot authorize payments beyond their verified reserved limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── "SEE IT IN ACTION" SECTION ───────────────────────────── */}
      <section id="see-in-action" className="py-20 sm:py-24 bg-white border-b border-gray-200">
        <div className="landing-container">
          <div className="max-w-xl mx-auto text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-indigo-600)] mb-2 block">
              Product Walkthrough
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              See the wallet interface in action
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Explore how the wallet presents balances, generates vouchers, and processes scanner inputs.
            </p>

            {/* Perspective Selector Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200 mt-6 text-xs font-medium">
              <button
                onClick={() => setActiveActionTab('sender')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeActionTab === 'sender'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sender: Generate Offline QR
              </button>
              <button
                onClick={() => setActiveActionTab('receiver')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeActionTab === 'receiver'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Receiver: QR Scanner
              </button>
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="max-w-3xl mx-auto bg-slate-50 border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {activeActionTab === 'sender' ? (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Generate Offline Voucher</h4>
                    <p className="text-xs text-gray-500">Signs transaction with device private key</p>
                  </div>
                  <span className="badge badge-settled">Limit Available</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500">Recipient</div>
                      <div className="text-sm font-semibold text-gray-900">Anshu Tamang</div>
                      <div className="text-xs text-gray-500 font-mono">9841234567</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="text-lg font-semibold text-indigo-600 font-mono">NPR 1,250.00</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500">Security Signature Status</div>
                      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <Check size={13} /> ECDSA signature generated locally
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-36 h-36 bg-slate-900 rounded-xl p-3 flex items-center justify-center text-white mb-2 shadow-inner">
                      <QrCode size={110} className="text-white" />
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">Token Nonce: #004-98F2</span>
                    <span className="text-[11px] text-amber-600 font-medium mt-1">Expiring in 14:38</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Try this in live demo wallet →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Offline Camera Scanner</h4>
                    <p className="text-xs text-gray-500">Verifies ECDSA signature without internet connection</p>
                  </div>
                  <span className="badge badge-pending">Ready to Scan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center text-center text-white relative min-h-[180px]">
                    <div className="w-28 h-28 border-2 border-indigo-400 border-dashed rounded-xl flex items-center justify-center mb-2 animate-pulse">
                      <QrCode size={48} className="text-indigo-400" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Point at sender's offline QR</span>
                  </div>

                  <div className="space-y-2.5 flex flex-col justify-center">
                    <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs">
                      <div className="font-semibold text-emerald-800 flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Signature Authenticity: Valid
                      </div>
                      <p className="text-gray-600">Calculated over sender public key #pk_anshu_01</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs">
                      <div className="font-semibold text-gray-800 mb-0.5">Replay Check: Passed</div>
                      <p className="text-gray-600">Counter is strictly higher than previous record</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs">
                      <div className="font-semibold text-gray-800 mb-0.5">Storage Status: Queued</div>
                      <p className="text-gray-600">Stored in IndexedDB pending network sync</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Test the QR Scanner in demo →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── FAQ / WHY OFFLINE PAYMENTS MATTER SECTION ─────────────── */}
      <section id="faq" className="py-20 sm:py-24 bg-slate-50 border-b border-gray-200">
        <div className="landing-container">
          <div className="max-w-xl mx-auto text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-indigo-600)] mb-2 block">
              Knowledge Base
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              Frequently asked questions
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Key concepts behind offline digital payments, cryptographic security, and prototype scope.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {[
              {
                q: "What happens during a complete blackout with zero cellular data?",
                a: "OfflinePay functions completely offline on your device using Service Workers and IndexedDB. Both sender and receiver can exchange signed QR vouchers without transmitting any network packets over cellular or Wi-Fi networks."
              },
              {
                q: "How is an offline payment verified without communicating with a bank?",
                a: "The receiver’s device verifies the sender’s asymmetric ECDSA P-256 digital signature locally using the browser’s WebCrypto API against a pre-cached registry of public keys. This mathematical proof guarantees the token was authored by the genuine wallet owner."
              },
              {
                q: "What stops a sender from spending the same offline balance twice?",
                a: "Offline spending requires pre-locking a dedicated reserve while online. Every generated token contains a strictly incrementing sequence counter and unique nonce. Replayed tokens are rejected by the receiver’s scanner and by central reconciliation upon reconnecting."
              },
              {
                q: "Is this real money or legal tender?",
                a: "No. OfflinePay Nepal is an educational prototype and research sandbox operating exclusively with simulated NPR test currency. No real monetary transactions, bank transfers, or official payment rails are connected."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="card bg-white border border-gray-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === idx ? 'transform rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="landing-container max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">
            Experience offline digital cash today
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Create an account or test with preloaded demo users to explore the full offline payment lifecycle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto px-8">
              Open Demo Wallet <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg w-full sm:w-auto px-8">
              Sign In With Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMPREHENSIVE FINTECH FOOTER ─────────────────────────── */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
        <div className="landing-container py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Brand & Overview */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-indigo-600)] flex items-center justify-center text-white font-semibold text-xs">
                  OP
                </div>
                <span className="font-semibold text-base text-white tracking-tight">
                  OfflinePay Nepal
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                A minimal, cryptographically signed offline payment prototype built for network
                blackouts in Nepal. Secure offline QR authorizations that reconcile seamlessly.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Educational Prototype · Simulated Currency
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Navigation
              </h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#how-it-works" className="hover:text-white transition-colors no-underline">How It Works</a></li>
                <li><a href="#security" className="hover:text-white transition-colors no-underline">Security Architecture</a></li>
                <li><a href="#see-in-action" className="hover:text-white transition-colors no-underline">Product Preview</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors no-underline">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Prototype Links */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Demo Shortcuts
              </h5>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-white transition-colors no-underline">Sign In (Demo Accounts)</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors no-underline">Create Demo Wallet</Link></li>
                <li>
                  <a
                    href="https://github.com/abinashchaudhary2007/OfflinePayNepal"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors no-underline inline-flex items-center gap-1"
                  >
                    GitHub Repository <ExternalLink size={11} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal / Disclaimer Notice */}
          <div className="pt-8 border-t border-slate-800 text-xs space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 leading-relaxed text-[11px]">
              <strong className="text-slate-300">Disclaimer: </strong>
              OfflinePay Nepal is an experimental software demonstration for academic and research purposes.
              All balances, accounts, and transactions use simulated NPR currency. It is not a licensed bank,
              financial institution, or payment service provider in Nepal.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
              <p>© {new Date().getFullYear()} OfflinePay Nepal. Open source educational prototype.</p>
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-slate-300 no-underline">Demo Login</Link>
                <Link to="/register" className="hover:text-slate-300 no-underline">Register</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
