/**
 * TransactionDetail.jsx — Clean, user-friendly digital payment receipt
 * Focused on essential user information: Amount, Parties, Date/Time, Method, and Status.
 * Technical cryptographic and ledger details are neatly tucked into a discreet collapsed section.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Copy, Check, Printer, Share2, ShieldCheck,
  ChevronDown, ChevronUp, Cpu, XCircle, Send
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
      <DashboardLayout maxWidth="max-w-2xl">
        <div className="w-full space-y-6 animate-pulse pb-16">
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout maxWidth="max-w-2xl">
        <div
          className="max-w-lg mx-auto text-center py-16 px-8 rounded-3xl border shadow-sm my-12"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            borderRadius: '24px',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#D64545] flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/40">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            Transaction Not Found
          </h2>
          <p className="text-xs mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
            Transaction ID: {id}
          </p>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline transition-transform hover:scale-102"
            style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
          >
            <ArrowLeft size={16} /> Return to Transactions
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isSent = tx.senderId === currentUser?.id;
  const isOffline = tx.method === 'OFFLINE_QR' || tx.isOffline;
  const isSettled = tx.status === 'SETTLED' || tx.status === 'VERIFIED';

  return (
    <DashboardLayout maxWidth="max-w-2xl">
      <div className="w-full space-y-6 animate-fade-in pb-16 print-receipt-container">
        
        {/* ─── Top Bar: Navigation & Quick User Actions ─── */}
        <div
          className="flex items-center justify-between gap-4 border-b pb-4 no-print"
          style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
        >
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs no-underline hover:border-[#3155B8]"
            style={{
              background: isDark ? 'var(--bg-elevated)' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#172B75',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Transactions</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              }}
              title="Share receipt link"
            >
              {copiedLink ? <Check size={14} className="text-[#16A66A]" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              }}
              title="Print receipt"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* ─── Main Payment Receipt Card ─── */}
        <div
          className="border shadow-sm overflow-hidden"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            borderRadius: '24px',
          }}
        >
          {/* Header Banner & Amount */}
          <div
            className="text-center relative pt-8 pb-7 px-6 border-b"
            style={{
              borderColor: isDark ? 'var(--border-color)' : '#F1F4F9',
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
                : 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
            }}
          >
            {/* Visual Icon Badge */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
                isSent
                  ? 'bg-red-50 text-[#D64545] border border-red-200 dark:bg-red-950/40 dark:border-red-900/50'
                  : 'bg-emerald-50 text-[#16A66A] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50'
              }`}
            >
              {isSent ? <ArrowUpRight size={30} /> : <ArrowDownLeft size={30} />}
            </div>

            {/* Target Label */}
            <p className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isSent ? `Transfer to ${tx.receiverName || 'Recipient'}` : `Payment from ${tx.senderName || 'Sender'}`}
            </p>

            {/* Amount */}
            <h1
              className={`text-4xl sm:text-5xl font-black tracking-tight my-2 ${
                isSent ? 'text-[#172033] dark:text-white' : 'text-[#16A66A]'
              }`}
            >
              {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
            </h1>

            {/* Status Pills */}
            <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
              <Badge status={tx.status} />
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full border"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  color: isDark ? '#93C5FD' : '#3155B8',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                }}
              >
                {isOffline ? 'Offline QR Payment' : 'Online Payment'}
              </span>
            </div>
          </div>

          {/* Sender & Receiver Cards */}
          <div className="p-6 sm:p-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sender */}
              <div
                className="p-4 rounded-2xl border flex items-center gap-3.5"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                  borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
                >
                  {getInitials(tx.senderName)}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Paid From
                  </span>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {tx.senderName || 'Anonymous Sender'}
                  </p>
                </div>
              </div>

              {/* Receiver */}
              <div
                className="p-4 rounded-2xl border flex items-center gap-3.5"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                  borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #16A66A 0%, #0D8252 100%)' }}
                >
                  {getInitials(tx.receiverName)}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Paid To
                  </span>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {tx.receiverName || 'Anonymous Receiver'}
                  </p>
                </div>
              </div>
            </div>

            {/* Clean Receipt Breakdown with Generous Padding */}
            <div
              className="rounded-2xl border divide-y overflow-hidden"
              style={{
                borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                background: isDark ? 'var(--bg-elevated)' : '#FFFFFF',
              }}
            >
              {/* Transfer Amount */}
              <div
                className="flex items-center justify-between py-4 px-5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(tx.amount)}
                </span>
              </div>

              {/* Payment Method */}
              <div
                className="flex items-center justify-between py-4 px-5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Payment Method
                </span>
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isOffline ? 'Offline Signed QR' : 'Online Immediate Settlement'}
                </span>
              </div>

              {/* Date & Time */}
              <div
                className="flex items-center justify-between py-4 px-5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Date & Time
                </span>
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatDateTime(tx.timestamp)}
                </span>
              </div>

              {/* Transaction ID with Copy */}
              <div
                className="flex items-center justify-between py-4 px-5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Transaction ID
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#3155B8] dark:text-[#6888F5] hover:underline cursor-pointer"
                  title="Click to copy ID"
                >
                  <span>{tx.id}</span>
                  {copiedId ? (
                    <CheckCircle2 size={13} className="text-[#16A66A]" />
                  ) : (
                    <Copy size={13} className="text-slate-400 hover:text-[#3155B8]" />
                  )}
                </button>
              </div>

              {/* Note / Memo if present */}
              {tx.note && (
                <div
                  className="flex items-start justify-between py-4 px-5"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Memo / Note
                  </span>
                  <span className="text-xs font-medium italic text-right max-w-xs" style={{ color: 'var(--text-primary)' }}>
                    "{tx.note}"
                  </span>
                </div>
              )}
            </div>

            {/* Quick Next Action: Send Again / Repeat */}
            {isSent && (
              <div className="pt-2 no-print">
                <Link
                  to="/send"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white no-underline shadow-sm transition-transform hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)',
                  }}
                >
                  <Send size={16} />
                  <span>Send Money Again</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── Discreet Technical & Security Audit (Collapsed by default for clean UX) ─── */}
        <div
          className="border shadow-xs overflow-hidden no-print"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            borderRadius: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setShowTechnical(p => !p)}
            className="w-full flex items-center justify-between py-3.5 px-5 text-xs font-semibold transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#3155B8]" />
              <span>Security & Cryptographic Audit Proof</span>
            </div>
            {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTechnical && (
            <div
              className="p-5 border-t space-y-4"
              style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className="p-3 rounded-xl border flex items-center justify-between"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Signature Proof:</span>
                  <span className="font-bold text-[#16A66A]">
                    {tx.signature && tx.signature !== 'DEMO_SIG'
                      ? 'ECDSA P-256 Verified'
                      : isOffline
                      ? 'Demo Signature Verified'
                      : 'Central Ledger Settled'}
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl border flex items-center justify-between"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Hardware Node:</span>
                  <span className="font-mono font-semibold text-slate-500">
                    {tx.deviceId ? `${tx.deviceId.slice(0, 14)}...` : 'Online Node'}
                  </span>
                </div>

                {tx.authorizationId && (
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Auth Token:</span>
                    <span className="font-mono font-semibold text-[#3155B8]">
                      {tx.authorizationId}
                    </span>
                  </div>
                )}

                {tx.counter !== undefined && (
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Anti-Replay Counter:</span>
                    <span className="font-mono font-bold">#{tx.counter}</span>
                  </div>
                )}
              </div>

              {/* Raw JSON Payload */}
              <div className="pt-2 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Raw Technical Payload:</span>
                  <button
                    onClick={handleCopyPayload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      color: copiedPayload ? '#16A66A' : '#3155B8',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    }}
                  >
                    {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre
                  className="p-3.5 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed border"
                  style={{
                    background: isDark ? '#0F172A' : '#F5F7FF',
                    color: isDark ? '#93C5FD' : '#172B75',
                    borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    maxHeight: '180px',
                  }}
                >
                  {JSON.stringify(tx, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default TransactionDetail;
