import { Link } from 'react-router-dom';
import {
  WifiOff, QrCode, Shield, RefreshCw, Lock,
  ArrowRight, Menu, X, Check, ChevronDown,
  ExternalLink, ShieldCheck, Key, Clock,
  Smartphone, Zap, Globe, Users
} from 'lucide-react';
import { useState, useEffect } from 'react';

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080C14', color: '#E2E8F0', fontFamily: 'var(--font-primary)' }}>

      {/* ── Prototype Banner ── */}
      <div style={{
        background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 500,
        color: '#fff',
        letterSpacing: '0.01em'
      }}>
        🎓 Educational Prototype · Simulated NPR Currency Only · No real monetary transactions
      </div>

      {/* ── Sticky Navbar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(8,12,20,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '-0.5px',
              boxShadow: '0 4px 14px rgba(79,70,229,0.4)'
            }}>OP</div>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16, letterSpacing: '-0.4px' }}>OfflinePay <span style={{ color: '#7C3AED' }}>Nepal</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, fontWeight: 500 }} className="hidden-mobile">
            {['How It Works', 'Security', 'FAQ'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#F1F5F9'}
                onMouseLeave={e => e.target.style.color = '#94A3B8'}
              >{label}</a>
            ))}
          </nav>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden-mobile">
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              color: '#CBD5E1', fontSize: 14, fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.2s', background: 'transparent'
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >Sign In</Link>
            <Link to="/register" style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.5)'}
              onMouseLeave={e => e.target.style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)'}
            >Get Started</Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="show-mobile"
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 8 }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            background: '#0D1220', borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Security', href: '#security' },
              { label: 'FAQ', href: '#faq' }
            ].map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}
              >{label}</a>
            ))}
            <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{
                flex: 1, textAlign: 'center', padding: '10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', fontSize: 14,
                fontWeight: 500, textDecoration: 'none'
              }}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{
                flex: 1, textAlign: 'center', padding: '10px', borderRadius: 8,
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none'
              }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 80, paddingBottom: 80, minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        {/* Animated gradient mesh background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '60%', height: '70%',
            background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '10%', right: '-5%',
            width: '45%', height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.14) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float2 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '30%',
            width: '40%', height: '50%',
            background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float3 12s ease-in-out infinite',
          }} />
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">

            {/* Left: Text */}
            <div>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 100,
                background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)',
                color: '#A5B4FC', fontSize: 12, fontWeight: 600, marginBottom: 24,
                letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                Offline-First Payments · ECDSA P-256
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 800,
                lineHeight: 1.1, letterSpacing: '-0.04em',
                color: '#F8FAFC', marginBottom: 20
              }}>
                Pay anyone,<br />
                <span style={{
                  background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #34D399 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>even offline.</span>
              </h1>

              <p style={{
                fontSize: 18, color: '#94A3B8', lineHeight: 1.7, marginBottom: 36,
                maxWidth: 460, fontWeight: 400
              }}>
                Cryptographically signed QR payments that work during blackouts.
                Built for Nepal's network challenges with ECDSA P-256, anti-replay nonces,
                and seamless online sync.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <Link to="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none',
                  boxShadow: '0 8px 28px rgba(79,70,229,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(79,70,229,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.4)'; }}
                >
                  Open Wallet <ArrowRight size={16} />
                </Link>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                  color: '#CBD5E1', fontSize: 15, fontWeight: 500, textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  Sign In
                </Link>
              </div>

              {/* Trust Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {[
                  { icon: <ShieldCheck size={14} />, label: 'ECDSA P-256 Signatures' },
                  { icon: <WifiOff size={14} />, label: 'Zero Internet Required' },
                  { icon: <Lock size={14} />, label: 'Anti-Replay Nonces' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                    <span style={{ color: '#6366F1' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: App Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }} className="hero-mockup">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }} className="stats-grid">
          {[
            { val: '100%', label: 'Offline Capable' },
            { val: 'P-256', label: 'ECDSA Algorithm' },
            { val: 'NPR', label: 'Simulated Currency' },
            { val: '0ms', label: 'Server Round-trip Offline' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#818CF8', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#818CF8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Workflow
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em', marginBottom: 12 }}>
            Three steps. Zero connectivity.
          </h2>
          <p style={{ color: '#64748B', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Peer-to-peer payments that work entirely on-device, with server reconciliation when you reconnect.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }} className="steps-grid">
          {/* Connector Line */}
          <div style={{
            position: 'absolute', top: 36, left: '16.5%', right: '16.5%', height: 1,
            background: 'linear-gradient(90deg, rgba(79,70,229,0.4) 0%, rgba(124,58,237,0.4) 50%, rgba(16,185,129,0.3) 100%)',
            zIndex: 0
          }} className="connector-line" />

          {[
            {
              num: '01', icon: <Smartphone size={24} />, color: '#6366F1', bg: 'rgba(99,102,241,0.12)',
              title: 'Reserve Offline Limit',
              desc: 'While online, lock a portion of your balance into a cryptographically protected offline allowance — backed by your real balance.'
            },
            {
              num: '02', icon: <QrCode size={24} />, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
              title: 'Generate Signed QR',
              desc: 'During a blackout, create a payment voucher signed with your device\'s ECDSA private key. The receiver verifies the signature locally.'
            },
            {
              num: '03', icon: <RefreshCw size={24} />, color: '#34D399', bg: 'rgba(52,211,153,0.12)',
              title: 'Auto-Sync & Settle',
              desc: 'Upon reconnecting, all queued vouchers are atomically settled on Supabase — debiting sender, crediting receiver, preventing double-spend.'
            }
          ].map(({ num, icon, color, bg, title, desc }) => (
            <div key={num} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 28, position: 'relative', zIndex: 1,
              transition: 'all 0.3s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Step Number */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: bg, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, marginBottom: 20
              }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Step {num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECURITY SECTION ── */}
      <section id="security" style={{ padding: '96px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
              Cryptographic Safeguards
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em', marginBottom: 12 }}>
              Built for zero-trust environments
            </h2>
            <p style={{ color: '#64748B', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              How OfflinePay prevents fraud, counterfeiting, and double-spend when servers are unreachable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="security-grid">
            {[
              {
                icon: <Key size={22} />, color: '#818CF8', bg: 'rgba(129,140,248,0.1)',
                title: 'Client-Side ECDSA P-256',
                desc: 'Private keys are generated via WebCrypto API and stored in IndexedDB. They never leave the device or travel over any network.'
              },
              {
                icon: <Lock size={22} />, color: '#34D399', bg: 'rgba(52,211,153,0.1)',
                title: 'Monotonic Nonce Tracking',
                desc: 'Every voucher carries a sequential counter + cryptographic nonce. The receiver\'s scanner rejects any replayed or duplicate token.'
              },
              {
                icon: <ShieldCheck size={22} />, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)',
                title: 'Pre-Allocated Limit Locks',
                desc: 'Double-spend is architecturally impossible: funds are locked in a reserve pool. You can\'t authorize beyond your verified offline limit.'
              }
            ].map(({ icon, color, bg, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: 28,
                transition: 'all 0.3s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFLINE FLOW DEMO VISUAL ── */}
      <section style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Live Exchange Demo
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em' }}>
            Offline payment in action
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900, margin: '0 auto' }} className="demo-grid">
          {/* Sender Panel */}
          <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sender View</span>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D', fontSize: 11, fontWeight: 600 }}>Offline</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Amount</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#F1F5F9', fontFamily: 'monospace', letterSpacing: '-0.04em' }}>NPR 1,250.00</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Algorithm:</span><span style={{ color: '#818CF8' }}>ECDSA P-256 (SHA-256)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Nonce:</span><span style={{ color: '#94A3B8' }}>7f3c9a10bf82...</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Reserve Left:</span><span style={{ color: '#34D399' }}>NPR 3,750.00</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Valid 14m 42s</span>
              <span style={{ color: '#818CF8', fontWeight: 600 }}>Ready for QR scan →</span>
            </div>
          </div>

          {/* Receiver Panel */}
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receiver Scanner</span>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399', fontSize: 11, fontWeight: 600 }}>Verified</span>
            </div>
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', marginBottom: 4 }}>Payment Accepted Offline</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', fontFamily: 'monospace', letterSpacing: '-0.04em' }}>+ NPR 1,250.00</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Public key signature verified via WebCrypto', 'Sequence counter #004 verified (anti-replay)', 'Stored in offline settlement queue (IndexedDB)'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
                  <Check size={13} style={{ color: '#34D399', flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '96px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#818CF8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
              Knowledge Base
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em' }}>
              Frequently asked questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'What happens during a complete blackout with zero cellular data?', a: 'OfflinePay functions completely offline using Service Workers and IndexedDB. Both sender and receiver exchange signed QR vouchers without transmitting any network packets.' },
              { q: 'How is an offline payment verified without a bank server?', a: "The receiver's device verifies the sender's ECDSA P-256 digital signature locally using WebCrypto against a pre-cached registry of public keys — mathematical proof that the token was authored by the genuine wallet owner." },
              { q: 'What stops double-spending the same offline balance?', a: "Offline spending requires pre-locking a dedicated reserve while online. Every token has a strictly incrementing counter + unique nonce. Replayed tokens are rejected locally and by central reconciliation on reconnect." },
              { q: 'Is this real money?', a: 'No. OfflinePay Nepal is an educational prototype operating exclusively with simulated NPR test currency. No real transactions, bank transfers, or official payment rails are connected.' },
            ].map((faq, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, overflow: 'hidden',
                transition: 'border-color 0.2s'
              }}>
                <button
                  onClick={() => toggleFaq(i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '18px 22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    background: 'none', border: 'none', cursor: 'pointer', color: '#F1F5F9',
                    fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em'
                  }}
                >
                  {faq.q}
                  <ChevronDown size={18} style={{ color: '#64748B', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px', fontSize: 14, color: '#94A3B8', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{
          maxWidth: 860, margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(124,58,237,0.15) 100%)',
          border: '1px solid rgba(79,70,229,0.25)', borderRadius: 24, padding: '64px 40px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em', marginBottom: 12 }}>
              Try it right now
            </h2>
            <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
              Create a free account and get NPR 1,000 in simulated funds to explore the full offline payment lifecycle.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(79,70,229,0.4)'
              }}>
                Open Wallet Free <ArrowRight size={16} />
              </Link>
              <a href="https://github.com/abinashchaudhary2007/OfflinePayNepal" target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                  color: '#CBD5E1', fontSize: 15, fontWeight: 500, textDecoration: 'none'
                }}>
                <ExternalLink size={14} /> View Source
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, marginBottom: 40 }} className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>OP</div>
                <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15 }}>OfflinePay Nepal</span>
              </div>
              <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.7, maxWidth: 300 }}>
                Cryptographically signed offline payment prototype for Nepal's network blackouts.
                Educational sandbox — no real money involved.
              </p>
            </div>
            {/* Nav */}
            <div>
              <h5 style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Navigation</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Security', href: '#security' },
                  { label: 'FAQ', href: '#faq' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} style={{ color: '#475569', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#94A3B8'}
                    onMouseLeave={e => e.target.style.color = '#475569'}
                  >{label}</a>
                ))}
              </div>
            </div>
            {/* App Links */}
            <div>
              <h5 style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>App</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/register" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>Create Wallet</Link>
                <Link to="/login" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>Sign In</Link>
                <a href="https://github.com/abinashchaudhary2007/OfflinePayNepal" target="_blank" rel="noreferrer"
                  style={{ color: '#475569', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  GitHub <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: '#334155', fontSize: 12 }}>© {new Date().getFullYear()} OfflinePay Nepal · Open source educational prototype</p>
            <div style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: '#818CF8', fontSize: 11, fontWeight: 600 }}>
              🎓 Educational Prototype · Simulated Currency
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for responsive + animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -10px) scale(1.08); }
        }

        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-mockup { display: none !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .security-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .connector-line { display: none !important; }
          .demo-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Animated wallet mockup for the hero */
function HeroMockup() {
  return (
    <div style={{
      width: 320, background: '#0D1220', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24, padding: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,70,229,0.15)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)' }} />

      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', opacity: 0.7 }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', opacity: 0.7 }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', opacity: 0.7 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <WifiOff size={10} style={{ color: '#FCD34D' }} />
          <span style={{ fontSize: 10, color: '#FCD34D', fontWeight: 600 }}>Offline Mode</span>
        </div>
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>AS</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>Abinash Shrestha</div>
          <div style={{ fontSize: 11, color: '#475569' }}>OfflinePay Wallet</div>
        </div>
      </div>

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: 16, padding: '20px', marginBottom: 16,
        boxShadow: '0 8px 24px rgba(79,70,229,0.4)'
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available Balance</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.04em' }}>NPR 1,000<span style={{ fontSize: 16, opacity: 0.7 }}>.00</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline Limit</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>NPR 0.00</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>NPR</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '↗', label: 'Send', color: '#6366F1' },
          { icon: '↙', label: 'Receive', color: '#34D399' },
          { icon: '⬡', label: 'Offline QR', color: '#A78BFA' },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, color, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tx */}
      <div>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No transactions yet</div>
        <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#334155', fontSize: 11 }}>
          Your transactions will appear here
        </div>
      </div>
    </div>
  );
}

export default Landing;
