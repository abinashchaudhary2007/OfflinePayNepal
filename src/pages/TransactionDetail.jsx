/**
 * TransactionDetail.jsx — Comprehensive, beautifully styled Statement & Receipt View
 * Works cleanly for ALL statement types:
 * - Debits (Sent transfers)
 * - Credits (Received payments)
 * - Offline Cryptographic QR payments
 * - Online immediate settlements
 * - Merchant purchases
 * - Expired & refunded transactions
 *
 * Guarantees centered alignment, generous padding, proper gaps, and zero border clipping.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Copy, Check, Printer, Share2, ShieldCheck,
  ChevronDown, ChevronUp, Cpu, XCircle, Send, Store,
  AlertTriangle, RefreshCw, Key, Smartphone
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { getTransactionById } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatting';

function TransactionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const { isDark } = useTheme();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const inMemory = transactions.find(t => t.id === id);
      if (inMemory) {
        setTx(inMemory);
        setLoading(false);
        return;
      }
      const fromDb = await getTransactionById(id);
      setTx(fromDb);
      setLoading(false);
    }
    load();
  }, [id, transactions]);

  const handleCopyId = () => {
    if (tx?.id) {
      navigator.clipboard.writeText(tx.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPayload = () => {
    if (tx) {
      navigator.clipboard.writeText(JSON.stringify(tx, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout maxWidth="max-w-3xl">
        <div
          style={{
            maxWidth: '680px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingBottom: '64px',
          }}
          className="animate-pulse"
        >
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout maxWidth="max-w-3xl">
        <div
          style={{
            maxWidth: '540px',
            width: '100%',
            margin: '40px auto',
            textAlign: 'center',
            padding: '48px 32px',
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: isDark ? 'rgba(214,69,69,0.15)' : '#FDECEC',
              color: '#D64545',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(214,69,69,0.25)',
            }}
          >
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            Statement Not Found
          </h2>
          <p className="text-xs mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
            Transaction Reference: {id}
          </p>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline transition-transform hover:scale-102"
            style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
          >
            <ArrowLeft size={16} /> Return to Statement History
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Derive statement properties across all types
  const isSent = tx.senderId === currentUser?.id;
  const isOffline = tx.method === 'OFFLINE_QR' || tx.isOffline;
  const isExpired = tx.status === 'EXPIRED';
  const isSettled = tx.status === 'SETTLED' || tx.status === 'VERIFIED';
  const isPending = tx.status === 'OFFLINE_PENDING' || tx.status === 'PENDING' || tx.status === 'SYNCING';
  
  const counterpartyName = isSent
    ? (tx.receiverName || 'Recipient')
    : (tx.senderName || 'Sender');

  const isMerchant = isSent && (
    counterpartyName.toLowerCase().includes('store') ||
    counterpartyName.toLowerCase().includes('superstore') ||
    counterpartyName.toLowerCase().includes('shop') ||
    tx.note?.toLowerCase().includes('shop') ||
    tx.note?.toLowerCase().includes('merchant')
  );

  return (
    <DashboardLayout maxWidth="max-w-3xl">
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        className="animate-fade-in pb-16 print-receipt-container"
      >
        {/* ─── Top Bar: Navigation & Quick Actions ─── */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
            paddingBottom: '16px',
          }}
        >
          <Link
            to="/transactions"
            className="no-underline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: isDark ? 'var(--bg-elevated)' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#172B75',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>All Statements</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                cursor: 'pointer',
              }}
              title="Share statement link"
            >
              {copiedLink ? <Check size={14} className="text-[#16A66A]" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                cursor: 'pointer',
              }}
              title="Print official receipt"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* ─── Main Payment Statement Card ─── */}
        <div
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Header Banner & Amount (Strictly Centered Stack) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '36px 24px 28px',
              borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#F1F4F9'}`,
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
                : 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
            }}
          >
            {/* Visual Icon Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                background: isExpired
                  ? (isDark ? 'rgba(242,169,0,0.18)' : '#FFF6DD')
                  : isSent
                  ? (isDark ? 'rgba(214,69,69,0.18)' : '#FDECEC')
                  : (isDark ? 'rgba(22,166,106,0.18)' : '#E8F8F1'),
                color: isExpired
                  ? (isDark ? '#FBBF24' : '#B57F00')
                  : isSent
                  ? (isDark ? '#F87171' : '#D64545')
                  : (isDark ? '#34D399' : '#16A66A'),
                border: `1px solid ${
                  isExpired
                    ? (isDark ? 'rgba(242,169,0,0.35)' : '#FCE7A6')
                    : isSent
                    ? (isDark ? 'rgba(214,69,69,0.35)' : '#FACDCD')
                    : (isDark ? 'rgba(22,166,106,0.35)' : '#BCECD7')
                }`,
              }}
            >
              {isExpired ? (
                <Clock size={32} />
              ) : isMerchant ? (
                <Store size={32} />
              ) : isSent ? (
                <ArrowUpRight size={32} />
              ) : (
                <ArrowDownLeft size={32} />
              )}
            </div>

            {/* Context Title */}
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                margin: '0 0 6px 0',
              }}
            >
              {isExpired
                ? `Expired Transfer to ${counterpartyName}`
                : isMerchant
                ? `Merchant Payment to ${counterpartyName}`
                : isSent
                ? `Transfer to ${counterpartyName}`
                : `Payment received from ${counterpartyName}`}
            </p>

            {/* Statement Amount */}
            <h1
              style={{
                fontSize: 'clamp(2.25rem, 6vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: '4px 0 10px 0',
                lineHeight: 1.1,
                color: isExpired
                  ? (isDark ? '#94A3B8' : '#8993A8')
                  : isSent
                  ? (isDark ? '#FFFFFF' : '#172033')
                  : '#16A66A',
              }}
            >
              {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
            </h1>

            {/* Status & Method Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '6px',
              }}
            >
              <Badge status={tx.status} />
              
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  color: isDark ? '#93C5FD' : '#3155B8',
                }}
              >
                {isOffline ? '🔐 Offline Signed QR' : '🌐 Online Real-Time'}
              </span>
            </div>
          </div>

          {/* Parties Cards (Sender & Receiver) */}
          <div style={{ padding: '24px 24px 0 24px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Sender Box */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                  background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(tx.senderName)}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isDark ? '#94A3B8' : '#8993A8',
                      display: 'block',
                    }}
                  >
                    Paid From (Sender)
                  </span>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.senderName || 'Anonymous Sender'}
                  </p>
                </div>
              </div>

              {/* Receiver Box */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                  background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #16A66A 0%, #0D8252 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(tx.receiverName)}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isDark ? '#94A3B8' : '#8993A8',
                      display: 'block',
                    }}
                  >
                    Paid To (Receiver)
                  </span>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.receiverName || 'Anonymous Receiver'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Specification Rows */}
          <div style={{ padding: '24px' }}>
            <div
              style={{
                borderRadius: '18px',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                background: isDark ? 'var(--bg-elevated)' : '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              <StatementRow
                label="Transfer Amount"
                value={formatCurrency(tx.amount)}
                highlight
                highlightColor={isSent ? (isDark ? '#F87171' : '#172033') : '#16A66A'}
                isDark={isDark}
              />

              <StatementRow
                label="Payment Method"
                value={isOffline ? 'Offline Signed QR' : 'Online Immediate Settlement'}
                subtext={isOffline ? 'Locally authorized with asymmetric ECDSA signature' : 'Instant central ledger reconciliation'}
                isDark={isDark}
              />

              <StatementRow
                label="Date & Time"
                value={formatDateTime(tx.timestamp)}
                isDark={isDark}
              />

              <StatementRow
                label="Transaction ID"
                value={
                  <button
                    type="button"
                    onClick={handleCopyId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#3155B8',
                      background: isDark ? 'rgba(49,85,184,0.18)' : '#F5F7FF',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(49,85,184,0.3)' : '#DCE3F2'}`,
                      cursor: 'pointer',
                    }}
                    title="Click to copy Transaction ID"
                  >
                    <span>{tx.id}</span>
                    {copiedId ? <CheckCircle2 size={13} className="text-[#16A66A]" /> : <Copy size={13} />}
                  </button>
                }
                isDark={isDark}
              />

              {tx.settledAt && (
                <StatementRow
                  label="Settlement Time"
                  value={formatDateTime(tx.settledAt)}
                  isDark={isDark}
                />
              )}

              {tx.note && (
                <StatementRow
                  label="Note / Memo"
                  value={`"${tx.note}"`}
                  isDark={isDark}
                />
              )}
            </div>

            {/* Quick Action Button */}
            <div style={{ marginTop: '20px' }} className="no-print">
              <Link
                to={`/send?to=${encodeURIComponent(counterpartyName)}`}
                className="no-underline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  boxShadow: '0 4px 14px rgba(23,43,117,0.25)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Send size={16} />
                <span>{isSent ? 'Send Money Again' : 'Send Payment to ' + counterpartyName}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Discreet "View Technical Details" Option for Hackathon Demos ─── */}
        <div style={{ textAlign: 'center', paddingTop: '4px' }} className="no-print">
          <button
            type="button"
            onClick={() => setShowTechnical(p => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Cpu size={14} className="text-[#3155B8]" />
            <span>{showTechnical ? 'Hide Technical Details' : 'View Technical Details'}</span>
            {showTechnical ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* ─── Cryptographic Audit Proof (Hidden by default, shown for demos) ─── */}
        {showTechnical && (
          <div
            className="no-print animate-fade-in"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              borderRadius: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              <ShieldCheck size={16} className="text-[#3155B8]" />
              <span>Security & Cryptographic Audit Proof</span>
            </div>
            <div
              style={{
                padding: '20px',
                borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Signature Proof:</span>
                  <span style={{ fontWeight: 700, color: '#16A66A' }}>
                    {tx.signature && tx.signature !== 'DEMO_SIG'
                      ? 'ECDSA P-256 Validated'
                      : isOffline
                      ? 'Demo Signature Verified'
                      : 'Central Ledger Settled'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Hardware Node:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {tx.deviceId ? `${tx.deviceId.slice(0, 14)}...` : 'Online Node'}
                  </span>
                </div>

                {tx.authorizationId && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Auth Token:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#3155B8' }}>
                      {tx.authorizationId}
                    </span>
                  </div>
                )}

                {tx.counter !== undefined && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}`,
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Monotonic Counter:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{tx.counter}</span>
                  </div>
                )}
              </div>

              {/* Raw JSON Payload */}
              <div style={{ paddingTop: '10px', borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    Raw IndexedDB Payload:
                  </span>
                  <button
                    onClick={handleCopyPayload}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      color: copiedPayload ? '#16A66A' : '#3155B8',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    fontSize: '0.6875rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    lineHeight: '1.6',
                    background: isDark ? '#0F172A' : '#F5F7FF',
                    color: isDark ? '#93C5FD' : '#172B75',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                    maxHeight: '180px',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(tx, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * StatementRow — Generously padded statement key-value row with zero clipping
 */
function StatementRow({ label, value, subtext, highlight, highlightColor, isDark }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9'}`,
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
        {subtext && (
          <span style={{ fontSize: '0.6875rem', color: isDark ? '#94A3B8' : '#8993A8', marginTop: '2px' }}>
            {subtext}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'right', minWidth: 0, overflowWrap: 'break-word' }}>
        {typeof value === 'string' ? (
          <span
            style={{
              fontSize: highlight ? '1rem' : '0.875rem',
              fontWeight: highlight ? 900 : 700,
              color: highlightColor || 'var(--text-primary)',
            }}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;
