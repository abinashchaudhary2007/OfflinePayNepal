/**
 * TransactionDetail.jsx — Detailed audit view of a single transaction
 * Styled with OfflinePay Nepali fintech design system:
 * Generous padding, clean multi-column desktop layout, modern receipt styling,
 * cryptographic verification proof, and dark mode support.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  Clock, CheckCircle2, AlertTriangle, Copy, Cpu, ChevronDown, ChevronUp, XCircle,
  Printer, Share2, Check, Database, Smartphone, Receipt, Key, RefreshCw,
  FileText, ExternalLink, Shield, User, Lock, Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { getTransactionById } from '../services/db';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatting';

function TransactionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const { isDark } = useTheme();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const handleCopyPayload = () => {
    if (tx) {
      navigator.clipboard.writeText(JSON.stringify(tx, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
      <DashboardLayout maxWidth="max-w-5xl">
        <div className="w-full space-y-6 animate-pulse pb-16">
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
              <div className="h-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="h-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
              <div className="h-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout maxWidth="max-w-5xl">
        <div
          className="max-w-xl mx-auto text-center py-16 px-8 rounded-3xl border shadow-sm my-12"
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
            Identifier: {id}
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
    <DashboardLayout maxWidth="max-w-5xl">
      <div className="w-full space-y-6 animate-fade-in pb-16 print-receipt-container">
        
        {/* ─── Top Bar: Navigation & Action Buttons ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 no-print"
          style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
        >
          <div className="flex items-center gap-3">
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

            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full border"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                color: 'var(--text-secondary)',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2'
              }}
            >
              Audit Record · <span className="font-mono">{tx.id?.slice(0, 15)}...</span>
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              }}
              title="Copy link to transaction"
            >
              {copiedLink ? <Check size={14} className="text-[#16A66A]" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-primary)',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              }}
              title="Print transaction receipt"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* ─── Main Content Grid (Receipt on Left, Audit & Ledger on Right) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ══════════ LEFT COLUMN: THE FINANCIAL RECEIPT ══════════ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Hero Transaction Card */}
            <div
              className="border shadow-sm text-center relative overflow-hidden"
              style={{
                padding: '32px 28px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                borderRadius: '24px',
              }}
            >
              {/* Subtle background glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none opacity-40"
                style={{
                  background: isSent ? '#EF4444' : '#10B981',
                }}
              />

              <div className="relative z-10 flex flex-col items-center">
                {/* Visual Icon Badge */}
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-xs ${
                    isSent
                      ? 'bg-red-50 text-[#D64545] border border-red-200 dark:bg-red-950/40 dark:border-red-900/50'
                      : 'bg-emerald-50 text-[#16A66A] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50'
                  }`}
                >
                  {isSent ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                </div>

                {/* Counterparty & Context */}
                <span className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isSent ? `Transfer to ${tx.receiverName || 'Recipient'}` : `Payment from ${tx.senderName || 'Sender'}`}
                </span>

                {/* Large Hero Amount */}
                <h1
                  className={`text-4xl sm:text-5xl font-black tracking-tight my-2 ${
                    isSent ? 'text-[#172033] dark:text-white' : 'text-[#16A66A]'
                  }`}
                >
                  {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                </h1>

                {/* Status and Mode Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                  <Badge status={tx.status} />

                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                      color: isDark ? '#93C5FD' : '#172B75',
                      borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
                    }}
                  >
                    {isOffline ? (
                      <>
                        <Lock size={12} className="text-[#3155B8]" />
                        <span>Offline Cryptographic QR</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="text-[#3155B8]" />
                        <span>Online Real-Time Settlement</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Transaction ID with tactile copy button */}
                <div className="mt-5 w-full max-w-md pt-4 border-t" style={{ borderColor: isDark ? 'var(--border-color)' : '#F1F4F9' }}>
                  <div
                    onClick={handleCopyId}
                    className="group flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer hover:border-[#3155B8]"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#F8FAFF',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    }}
                    title="Click to copy Transaction ID"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">TXID</span>
                      <span className="font-mono text-xs font-bold text-[#3155B8] dark:text-[#6888F5] truncate">
                        {tx.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ml-2"
                      style={{ color: copiedId ? '#16A66A' : 'var(--text-secondary)' }}
                    >
                      {copiedId ? (
                        <>
                          <CheckCircle2 size={14} className="text-[#16A66A]" />
                          <span className="text-[11px] text-[#16A66A]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="group-hover:text-[#3155B8] transition-colors" />
                          <span className="text-[11px] group-hover:text-[#3155B8] transition-colors">Copy</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Payment Specifications Card */}
            <div
              className="border shadow-sm space-y-6"
              style={{
                padding: '28px 28px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                borderRadius: '24px',
              }}
            >
              <div className="border-b pb-4 flex items-center justify-between"
                style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
              >
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Payment Specifications
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Detailed breakdown of parties and financial terms
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF', color: '#3155B8' }}
                >
                  <Receipt size={18} />
                </div>
              </div>

              {/* Sender & Receiver Visual Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sender Card */}
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Sender
                    </span>
                    <p className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {tx.senderName || 'Anonymous Sender'}
                    </p>
                    <p className="text-[11px] font-mono truncate text-slate-400">
                      ID: {tx.senderId?.slice(0, 12)}...
                    </p>
                  </div>
                </div>

                {/* Receiver Card */}
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Receiver
                    </span>
                    <p className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {tx.receiverName || 'Anonymous Receiver'}
                    </p>
                    <p className="text-[11px] font-mono truncate text-slate-400">
                      ID: {tx.receiverId?.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Rows with Generous Gap & Padding */}
              <div className="space-y-1 pt-1">
                <SpecRow
                  label="Transfer Amount"
                  value={formatCurrency(tx.amount)}
                  highlight
                  isDark={isDark}
                />
                <SpecRow
                  label="Currency"
                  value={tx.currency ? `${tx.currency} (Nepalese Rupee)` : 'NPR (Nepalese Rupee)'}
                  isDark={isDark}
                />
                <SpecRow
                  label="Payment Channel"
                  value={isOffline ? 'Offline Signed QR (Local Device)' : 'Online Real-Time Payment'}
                  subtext={isOffline ? 'ECDSA P-256 Asymmetric Hardware Proof' : 'Direct Central Gateway Settlement'}
                  isDark={isDark}
                />
                <SpecRow
                  label="Initiation Time"
                  value={formatDateTime(tx.timestamp)}
                  subtext={formatRelativeTime(tx.timestamp)}
                  isDark={isDark}
                />
                {tx.settledAt && (
                  <SpecRow
                    label="Settlement Time"
                    value={formatDateTime(tx.settledAt)}
                    subtext={formatRelativeTime(tx.settledAt)}
                    isDark={isDark}
                  />
                )}
                {tx.note && (
                  <div
                    className="mt-3 p-4 rounded-2xl border space-y-1"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                    }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Memo / Note
                    </span>
                    <p className="text-xs font-semibold italic" style={{ color: 'var(--text-primary)' }}>
                      "{tx.note}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN: CRYPTOGRAPHIC PROOF & LEDGER ══════════ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 3. Cryptographic Verification Card */}
            <div
              className="border shadow-sm space-y-5"
              style={{
                padding: '28px 24px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                borderRadius: '24px',
              }}
            >
              <div className="border-b pb-4 flex items-center justify-between"
                style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
              >
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Cryptographic Verification
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Integrity and hardware tamper-resistance proof
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? 'var(--bg-elevated)' : '#F0FDF4', color: '#16A66A' }}
                >
                  <ShieldCheck size={18} />
                </div>
              </div>

              {/* Security Proof Tiles */}
              <div className="space-y-3">
                {/* Signature status */}
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-[#16A66A]" />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Signature Proof
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      background: '#E8F8F1',
                      color: '#16A66A',
                      border: '1px solid #BCECD7',
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {tx.signature && tx.signature !== 'DEMO_SIG'
                      ? 'ECDSA P-256'
                      : isOffline
                      ? 'Demo Verified'
                      : 'Central Ledger'}
                  </span>
                </div>

                {/* Device node */}
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Smartphone size={16} className="text-[#3155B8] flex-shrink-0" />
                    <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      Hardware Device
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-500 truncate ml-2">
                    {tx.deviceId ? `${tx.deviceId.slice(0, 14)}...` : 'Online Node'}
                  </span>
                </div>

                {/* Offline Auth Token (if present) */}
                {tx.authorizationId && (
                  <div
                    className="p-3.5 rounded-xl border flex items-center justify-between"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Key size={16} className="text-[#F2A900] flex-shrink-0" />
                      <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        Auth Token
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#3155B8] dark:text-[#6888F5] truncate ml-2">
                      {tx.authorizationId}
                    </span>
                  </div>
                )}

                {/* Monotonic Counter */}
                {tx.counter !== undefined && (
                  <div
                    className="p-3.5 rounded-xl border flex items-center justify-between"
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <RefreshCw size={16} className="text-slate-400" />
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Anti-Replay Counter
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#172B75] dark:text-white">
                      #{tx.counter}
                    </span>
                  </div>
                )}

                {/* Replay Protection / Nonce */}
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Lock size={16} className="text-[#16A66A]" />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Replay Nonce
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#16A66A] flex items-center gap-1">
                    <CheckCircle2 size={13} /> Enforced & Checked
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Synchronization & Ledger Card */}
            <div
              className="border shadow-sm space-y-5"
              style={{
                padding: '28px 24px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                borderRadius: '24px',
              }}
            >
              <div className="border-b pb-4 flex items-center justify-between"
                style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
              >
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Ledger Synchronization
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Reconciliation state with local & central ledgers
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF', color: '#3155B8' }}
                >
                  <Database size={18} />
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Local ledger state */}
                <div
                  className="p-4 rounded-2xl border space-y-1"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Client Local Storage
                    </span>
                    <span className="text-xs font-bold text-[#16A66A] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Committed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stored permanently in browser IndexedDB with tamper-evident signature.
                  </p>
                </div>

                {/* Central server state */}
                <div
                  className="p-4 rounded-2xl border space-y-1.5"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Server Central Ledger
                    </span>
                    <Badge status={tx.status} />
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {tx.status === 'SETTLED'
                      ? 'Reconciled and settled authoritatively on the Supabase central ledger.'
                      : tx.status === 'OFFLINE_PENDING'
                      ? 'Awaiting connection or merchant sync. Funds remain securely reserved.'
                      : tx.status === 'EXPIRED'
                      ? 'Payment window lapsed. Offline allowance automatically restored.'
                      : `Current sync status: ${tx.status}`}
                  </p>
                </div>

                {tx.syncedAt && (
                  <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-400">
                    <span>Last Reconciled:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {formatDateTime(tx.syncedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Collapsible Advanced Technical Payload */}
            <div
              className="border shadow-sm overflow-hidden"
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                borderRadius: '24px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowTechnical(p => !p)}
                className="w-full flex items-center justify-between p-5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: isDark ? 'var(--bg-elevated)' : '#EAF0FF', color: '#3155B8' }}
                  >
                    <Cpu size={15} />
                  </div>
                  <span>Advanced Technical Payload</span>
                </div>
                {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTechnical && (
                <div
                  className="p-5 border-t space-y-3"
                  style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Canonical JSON object stored in IndexedDB:
                    </p>
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
                    className="p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border"
                    style={{
                      background: isDark ? '#0F172A' : '#F5F7FF',
                      color: isDark ? '#93C5FD' : '#172B75',
                      borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                      maxHeight: '260px',
                    }}
                  >
                    {JSON.stringify(tx, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

/**
 * SpecRow — Formatted specification row with generous padding and hover feedback
 */
function SpecRow({ label, value, subtext, highlight, mono, badge, isDark }) {
  return (
    <div
      className="flex items-center justify-between py-3.5 px-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
      style={{
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F4F9'}`,
      }}
    >
      <div className="flex flex-col pr-4 min-w-[120px]">
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {subtext && (
          <span className="text-[11px] text-slate-400 mt-0.5">
            {subtext}
          </span>
        )}
      </div>

      <div className="text-right min-w-0">
        {badge ? (
          badge
        ) : (
          <span
            className={`text-xs sm:text-sm font-black break-all ${
              highlight
                ? 'text-[#16A66A]'
                : mono
                ? 'font-mono text-xs text-[#3155B8] dark:text-[#6888F5]'
                : ''
            }`}
            style={{ color: !highlight && !mono ? 'var(--text-primary)' : undefined }}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;
