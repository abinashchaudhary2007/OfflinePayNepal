/**
 * TransactionDetail.jsx — Phase 14
 * Full transaction detail view with all cryptographic and security fields.
 */
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatting';
import { getTransaction } from '../services/db';

function TransactionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { transactions } = useWallet();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try from context first (fast), then DB
      const cached = transactions.find(t => t.id === id);
      if (cached) { setTx(cached); setLoading(false); return; }
      const fromDb = await getTransaction(id);
      setTx(fromDb);
      setLoading(false);
    }
    load();
  }, [id, transactions]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-lg">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 bg-[var(--color-gray-100)] rounded" />
            <div className="h-48 bg-[var(--color-gray-100)] rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout>
        <div className="max-w-lg text-center py-16">
          <XCircle size={48} color="var(--color-gray-300)" className="mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[var(--color-gray-700)] mb-2">Transaction Not Found</h2>
          <p className="text-sm text-[var(--color-gray-400)] mb-5">ID: {id}</p>
          <Link to="/transactions" className="btn btn-outline btn-sm no-underline">
            ← Back to Transactions
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isSent = tx.senderId === currentUser?.id;
  const amountColor = isSent ? 'text-[var(--color-red-500)]' : 'text-[var(--color-emerald-600)]';

  const statusDetails = {
    SETTLED:         { icon: CheckCircle2, color: 'var(--color-emerald-600)', bg: 'var(--color-emerald-50)', label: 'Transaction settled and confirmed by server' },
    VERIFIED:        { icon: CheckCircle2, color: 'var(--color-emerald-600)', bg: 'var(--color-emerald-50)', label: 'Signature verified' },
    OFFLINE_PENDING: { icon: Clock,        color: 'var(--color-amber-600)',   bg: 'var(--color-amber-50)',   label: 'Stored locally — waiting to sync' },
    SYNCING:         { icon: Clock,        color: 'var(--color-indigo-600)',  bg: '#EEF2FF',                 label: 'Syncing with server...' },
    REJECTED:        { icon: XCircle,      color: 'var(--color-red-600)',     bg: 'var(--color-red-50)',     label: tx.rejectionReason || 'Rejected by server' },
  };
  const sd = statusDetails[tx.status] || statusDetails['OFFLINE_PENDING'];
  const StatusIcon = sd.icon;

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-5 animate-fade-in">
        {/* Back */}
        <Link to="/transactions" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-indigo-600)] font-semibold no-underline hover:underline">
          <ArrowLeft size={16} /> Back to Transactions
        </Link>

        {/* Header card */}
        <Card>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: isSent ? '#FEE2E2' : '#D1FAE5' }}>
              {isSent
                ? <ArrowUpRight size={28} color="var(--color-red-500)" />
                : <ArrowDownLeft size={28} color="var(--color-emerald-600)" />
              }
            </div>
            <p className="text-sm text-[var(--color-gray-500)] font-medium">
              {isSent ? `Sent to ${tx.receiverName}` : `Received from ${tx.senderName}`}
            </p>
            <p className={`text-3xl font-black mt-1 ${amountColor}`}>
              {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
            </p>
            <div className="mt-3 flex justify-center">
              <Badge status={tx.status} />
            </div>
          </div>
        </Card>

        {/* Status message */}
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: sd.bg }}>
          <StatusIcon size={20} color={sd.color} />
          <p className="text-sm font-semibold" style={{ color: sd.color }}>{sd.label}</p>
        </div>

        {/* Transaction details */}
        <Card>
          <CardHeader title="Transaction Details" />
          <div className="space-y-0">
            {[
              { label: 'Transaction ID', value: tx.id, mono: true },
              { label: 'Sender',         value: tx.senderName },
              { label: 'Receiver',       value: tx.receiverName },
              { label: 'Amount',         value: formatCurrency(tx.amount), highlight: true },
              { label: 'Currency',       value: tx.currency || 'NPR' },
              { label: 'Method',         value: tx.method || 'ONLINE' },
              { label: 'Timestamp',      value: formatDateTime(tx.timestamp) },
              tx.settledAt && { label: 'Settled At', value: formatDateTime(tx.settledAt) },
              tx.note && { label: 'Note', value: tx.note },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex items-start justify-between py-2.5 border-b border-[var(--color-gray-50)] last:border-0">
                <span className="text-xs text-[var(--color-gray-400)] min-w-[100px]">{row.label}</span>
                <span className={`text-xs font-semibold text-right ml-3 break-all ${row.highlight ? 'text-[var(--color-emerald-600)]' : 'text-[var(--color-gray-700)]'} ${row.mono ? 'font-mono' : ''}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Cryptographic details */}
        {tx.method === 'OFFLINE_QR' && (
          <Card>
            <CardHeader title="Cryptographic Details" subtitle="Security and signature information" />
            <div className="space-y-0">
              {[
                { label: 'Device ID',       value: tx.deviceId,        mono: true },
                { label: 'Nonce',           value: tx.nonce,           mono: true },
                { label: 'Counter',         value: tx.counter },
                { label: 'Auth ID',         value: tx.authorizationId || '—', mono: true },
                { label: 'Signature',       value: tx.signature === 'DEMO_SIG' ? 'Demo signature' : `${tx.signature?.slice(0, 20)}...`, mono: true },
                { label: 'Sig Status',      value: tx.signature === 'DEMO_SIG' ? 'Demo (P-256 not registered)' : 'P-256 ECDSA' },
              ].filter(r => r.value !== undefined).map((row, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 border-b border-[var(--color-gray-50)] last:border-0">
                  <span className="text-xs text-[var(--color-gray-400)] min-w-[100px]">{row.label}</span>
                  <span className={`text-xs font-semibold text-right ml-3 break-all text-[var(--color-gray-700)] ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Security status */}
            <div className="mt-3 p-3 rounded-xl flex items-start gap-2"
              style={{ background: tx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-50)' : 'var(--color-amber-50)' }}>
              <Shield size={14} color={tx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-600)' : 'var(--color-amber-600)'} className="mt-0.5" />
              <p className="text-xs" style={{ color: tx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-700)' : 'var(--color-amber-700)' }}>
                {tx.signature !== 'DEMO_SIG'
                  ? 'This transaction was signed with ECDSA P-256. The signature was verified by the server during settlement.'
                  : 'Demo signature used (device not registered with crypto keys when transaction was created).'
                }
              </p>
            </div>
          </Card>
        )}

        {/* Rejected details */}
        {tx.status === 'REJECTED' && tx.rejectionReason && (
          <Card>
            <CardHeader title="Rejection Details" />
            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'var(--color-red-50)' }}>
              <XCircle size={14} color="var(--color-red-500)" className="mt-0.5" />
              <p className="text-xs text-[var(--color-red-600)] font-semibold">{tx.rejectionReason.replace(/_/g, ' ')}</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TransactionDetail;
