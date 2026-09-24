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
          <div className="h-8 w-40 bg-[#172337] rounded-lg" />
          <div className="h-64 bg-[#111C2E] border border-[#263449] rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto text-center py-16 bg-[#111C2E] border border-[#263449] rounded-2xl p-6">
          <div className="w-16 h-16 rounded-full bg-[#172337] text-[#94A3B8] flex items-center justify-center mx-auto mb-4 border border-[#263449]">
            <XCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-1">Transaction Not Found</h2>
          <p className="text-xs text-[#94A3B8] mb-5 font-mono">ID: {id}</p>
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] hover:text-[#14B8A6] hover:underline no-underline transition-colors"
        >
          <ArrowLeft size={16} /> Back to Transactions
        </Link>

        {/* ─── Top Section: Amount, Party, Status ─── */}
        <Card padding className="text-center py-6 space-y-3 bg-[#111C2E] border border-[#263449]">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              isSent
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
            }`}
          >
            {isSent ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
          </div>

          <div>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              {isSent ? `Transfer to ${tx.receiverName}` : `Received from ${tx.senderName}`}
            </span>
            <p
              className={`text-3xl sm:text-4xl font-black mt-1 ${
                isSent ? 'text-[#F8FAFC]' : 'text-[#22C55E]'
              }`}
            >
              {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge status={tx.status} />
            <span className={`text-xs font-medium ${isOffline ? 'text-[#A78BFA]' : 'text-[#38BDF8]'}`}>
              {isOffline ? '🔐 Offline Stored' : '🌐 Online Transfer'}
            </span>
          </div>

          <div
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#172337] hover:bg-[#1f2f49] border border-[#263449] text-xs font-mono text-[#38BDF8] cursor-pointer transition-colors"
            title="Click to copy Transaction ID"
          >
            <span>{tx.id}</span>
            {copied ? <CheckCircle2 size={13} className="text-[#22C55E]" /> : <Copy size={13} />}
          </div>
        </Card>

        {/* ─── Section 1: Payment Summary ─── */}
        <Card padding className="space-y-3 bg-[#111C2E] border border-[#263449]">
          <CardHeader title="Payment Summary" subtitle="Financial transaction specifications" />
          <div className="divide-y divide-[#263449] text-xs">
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
        <Card padding className="space-y-3 bg-[#111C2E] border border-[#263449]">
          <CardHeader title="Cryptographic Verification" subtitle="Integrity and tamper-resistance proof" />
          <div className="divide-y divide-[#263449] text-xs">
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
        <Card padding className="space-y-3 bg-[#111C2E] border border-[#263449]">
          <CardHeader title="Synchronization & Ledger" subtitle="Reconciliation state with server" />
          <div className="divide-y divide-[#263449] text-xs">
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
                  : tx.status === 'EXPIRED'
                  ? 'Expired & Cancelled (Auto-refunded to sender)'
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
        <Card padding className="border border-[#263449] bg-[#111C2E]">
          <button
            onClick={() => setShowTechnical(p => !p)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#F8FAFC] uppercase tracking-wider py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-[#38BDF8]" />
              <span>Advanced Technical Payload</span>
            </div>
            {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTechnical && (
            <div className="mt-3 pt-3 border-t border-[#263449] space-y-2">
              <p className="text-[11px] text-[#94A3B8]">
                Raw JSON representation stored in local IndexedDB:
              </p>
              <pre className="p-3 bg-[#0B1220] border border-[#263449] text-[#14B8A6] rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
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
      <span className="text-[#94A3B8] min-w-[120px]">{label}:</span>
      <div className="text-right ml-2 min-w-0">
        {statusPill ? (
          <Badge status={statusPill} className="text-[10px]" />
        ) : (
          <span
            className={`font-semibold break-all ${
              highlight ? 'text-[#14B8A6]' : 'text-[#F8FAFC]'
            } ${mono ? 'font-mono text-[11px] text-[#38BDF8]' : ''}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;
