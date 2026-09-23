import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Clock, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Copy, KeyRound, RefreshCw, Cpu
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime } from '../utils/formatting';
import { getTransaction } from '../services/db';

function TransactionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { transactions } = useWallet();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const cached = (transactions || []).find(t => t.id === id);
      if (cached) {
        setTx(cached);
        setLoading(false);
        return;
      }
      const fromDb = await getTransaction(id);
      setTx(fromDb);
      setLoading(false);
    }
    load();
  }, [id, transactions]);

  const handleCopyId = () => {
    if (tx?.id) {
      navigator.clipboard.writeText(tx.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-gray-800)] mb-1">Transaction Not Found</h2>
          <p className="text-xs text-[var(--color-gray-400)] mb-5">ID: {id}</p>
          <Link to="/transactions" className="btn btn-outline btn-md no-underline">
            Back to Transactions
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isSent = tx.senderId === currentUser?.id;
  const isOffline = tx.method === 'OFFLINE_QR';

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
        {/* Back Link */}
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-indigo-600)] hover:underline no-underline"
        >
          <ArrowLeft size={16} /> Back to Transactions
        </Link>

        {/* ─── Top Section: Amount, Party, Status ─── */}
        <Card padding className="text-center py-6 space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              isSent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isSent ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
          </div>

          <div>
            <span className="text-xs font-semibold text-[var(--color-gray-500)] uppercase tracking-wider">
              {isSent ? `Transfer to ${tx.receiverName}` : `Received from ${tx.senderName}`}
            </span>
            <p
              className={`text-3xl sm:text-4xl font-black mt-1 ${
                isSent ? 'text-[var(--color-gray-900)]' : 'text-emerald-600'
              }`}
            >
              {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge status={tx.status} />
            <span className="text-xs font-medium text-[var(--color-gray-500)]">
              {isOffline ? 'Offline Stored' : 'Online Transfer'}
            </span>
          </div>

          <div
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-[var(--color-gray-600)] cursor-pointer transition-colors"
            title="Click to copy Transaction ID"
          >
            <span>{tx.id}</span>
            {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </div>
        </Card>

        {/* ─── Section 1: Payment Summary ─── */}
        <Card padding className="space-y-3">
          <CardHeader title="Payment Summary" subtitle="Financial transaction specifications" />
          <div className="divide-y divide-[var(--color-gray-100)] text-xs">
            <Row label="Transfer Amount" value={formatCurrency(tx.amount)} highlight />
            <Row label="Currency" value={tx.currency || 'NPR'} />
            <Row label="Sender" value={tx.senderName} />
            <Row label="Receiver" value={tx.receiverName} />
            <Row label="Payment Method" value={isOffline ? 'Offline Signed QR' : 'Online Immediate Settlement'} />
            <Row label="Initiation Time" value={formatDateTime(tx.timestamp)} />
            {tx.settledAt && <Row label="Settlement Time" value={formatDateTime(tx.settledAt)} />}
            {tx.note && <Row label="Note / Memo" value={tx.note} />}
          </div>
        </Card>

        {/* ─── Section 2: Verification Details ─── */}
        <Card padding className="space-y-3">
          <CardHeader title="Cryptographic Verification" subtitle="Integrity and tamper-resistance proof" />
          <div className="divide-y divide-[var(--color-gray-100)] text-xs">
            <Row
              label="Signature Status"
              value={
                tx.signature && tx.signature !== 'DEMO_SIG'
                  ? 'Verified (ECDSA P-256)'
                  : isOffline
                  ? 'Demo Signature Verified'
                  : 'Settled via Central Ledger'
              }
              statusPill={tx.signature && tx.signature !== 'DEMO_SIG' ? 'SETTLED' : 'VERIFIED'}
            />
            <Row
              label="Device State"
              value={tx.deviceId ? `Registered (${tx.deviceId.slice(0, 14)}...)` : 'Server Online Session'}
            />
            {tx.authorizationId && (
              <Row label="Offline Authorization" value={tx.authorizationId} mono />
            )}
            {tx.counter !== undefined && (
              <Row label="Device Transaction Counter" value={`#${tx.counter}`} />
            )}
            <Row label="Replay Protection (Nonce)" value={tx.nonce ? 'Enforced & Checked' : 'Standard'} />
          </div>
        </Card>

        {/* ─── Section 3: Synchronization Status ─── */}
        <Card padding className="space-y-3">
          <CardHeader title="Synchronization & Ledger" subtitle="Reconciliation state with server" />
          <div className="divide-y divide-[var(--color-gray-100)] text-xs">
            <Row
              label="Local Ledger Status"
              value="Committed to IndexedDB"
            />
            <Row
              label="Server Status"
              value={
                tx.status === 'SETTLED'
                  ? 'Reconciled & Settled'
                  : tx.status === 'OFFLINE_PENDING'
                  ? 'Waiting for Connection (Pending Sync)'
                  : tx.status
              }
              statusPill={tx.status}
            />
            {tx.syncedAt && (
              <Row label="Last Reconciled" value={formatDateTime(tx.syncedAt)} />
            )}
          </div>
        </Card>

        {/* ─── Collapsible Advanced Technical Details ─── */}
        <Card padding className="border border-slate-200">
          <button
            onClick={() => setShowTechnical(p => !p)}
            className="w-full flex items-center justify-between text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider py-1"
          >
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-slate-500" />
              <span>Advanced Technical Payload</span>
            </div>
            {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTechnical && (
            <div className="mt-3 pt-3 border-t border-[var(--color-gray-100)] space-y-2">
              <p className="text-[11px] text-[var(--color-gray-500)]">
                Raw JSON representation stored in local IndexedDB:
              </p>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(tx, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Row({ label, value, highlight, mono, statusPill }) {
  return (
    <div className="flex items-start justify-between py-2.5">
      <span className="text-[var(--color-gray-500)] min-w-[120px]">{label}:</span>
      <div className="text-right ml-2 min-w-0">
        {statusPill ? (
          <Badge status={statusPill} className="text-[10px]" />
        ) : (
          <span
            className={`font-semibold break-all ${
              highlight ? 'text-emerald-600' : 'text-[var(--color-gray-800)]'
            } ${mono ? 'font-mono text-[11px]' : ''}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;
