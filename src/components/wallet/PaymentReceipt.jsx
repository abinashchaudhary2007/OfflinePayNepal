import {
  CheckCircle2, Clock, AlertTriangle, XCircle, ArrowUpRight,
  ArrowDownLeft, RefreshCw, ShieldCheck, Copy, Check
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateTime, formatTxIdShort } from '../../utils/formatting';

/**
 * PaymentReceipt — Standardized, user-friendly fintech receipt component.
 * Clearly distinguishes between:
 * - Local offline acceptance (waiting for sync)
 * - Authoritative server settlement
 * - In-flight synchronization
 * - Temporary retry waiting
 * - Permanent rejection
 */
export function PaymentReceipt({
  transaction,
  isSender = true,
  onDone,
  showActions = true,
}) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const status = transaction.status || 'OFFLINE_PENDING';
  const isOffline = transaction.method === 'OFFLINE_QR';
  const amount = transaction.amount || 0;

  const handleCopyId = () => {
    if (transaction.id) {
      navigator.clipboard.writeText(transaction.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine status metadata and plain-language explanation
  let statusBanner = null;

  if (status === 'SETTLED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 text-left">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-950">Successfully Settled by Server</p>
          <p className="text-emerald-700 mt-0.5 leading-relaxed">
            This transaction has been authoritatively verified and settled on the central ledger.
          </p>
        </div>
      </div>
    );
  } else if (status === 'SYNCING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5 text-left animate-pulse">
        <RefreshCw size={18} className="text-indigo-600 shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="font-bold text-indigo-950">Synchronizing with Server</p>
          <p className="text-indigo-700 mt-0.5 leading-relaxed">
            Connecting to cloud ledger to verify cryptographic signature and reconcile balances.
          </p>
        </div>
      </div>
    );
  } else if (status === 'RETRY_WAITING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">Waiting for Network Reconnection</p>
          <p className="text-amber-700 mt-0.5 leading-relaxed">
            Server is temporarily unreachable. Transaction is safely saved on this device and will automatically retry syncing when online.
          </p>
        </div>
      </div>
    );
  } else if (status === 'REJECTED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5 text-left">
        <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-950">Transaction Rejected</p>
          <p className="text-red-700 mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'Verification check failed. Any reserved funds have been returned to your available balance.'}
          </p>
        </div>
      </div>
    );
  } else if (status === 'EXPIRED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-slate-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-950">Payment Expired & Cancelled</p>
          <p className="text-slate-700 mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'This payment was not received or settled within the 5-minute timeout window. It has been automatically cancelled and refunded.'}
          </p>
        </div>
      </div>
    );
  } else {
    // OFFLINE_PENDING
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">Payment Accepted Locally</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Cryptographic signature verified on device. Final server reconciliation will happen when either device reconnects to the internet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--color-gray-200)] rounded-3xl p-6 shadow-sm text-center space-y-5">
      {/* Icon & Heading */}
      <div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
          status === 'REJECTED' || status === 'EXPIRED'
            ? 'bg-slate-100 text-slate-600'
            : isSender
            ? 'bg-indigo-100 text-indigo-600'
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          {status === 'REJECTED' ? (
            <XCircle size={28} />
          ) : status === 'EXPIRED' ? (
            <Clock size={28} />
          ) : isSender ? (
            <ArrowUpRight size={28} strokeWidth={2.5} />
          ) : (
            <ArrowDownLeft size={28} strokeWidth={2.5} />
          )}
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
          {status === 'EXPIRED' ? 'Payment Expired & Cancelled' : isSender ? 'Payment Submitted' : 'Payment Received'}
        </p>

        <h2 className="text-3xl font-black text-[var(--color-gray-900)] mt-1 tracking-tight">
          {isSender ? '-' : '+'}{formatCurrency(amount)}
        </h2>

        <p className="text-xs text-[var(--color-gray-500)] mt-1">
          {isSender ? (
            <span>Sent to <strong>{transaction.receiverName || 'Recipient'}</strong></span>
          ) : (
            <span>Received from <strong>{transaction.senderName || 'Sender'}</strong></span>
          )}
        </p>
      </div>

      {/* Explanatory Status Banner */}
      {statusBanner}

      {/* Receipt Line Items */}
      <div className="divide-y divide-[var(--color-gray-100)] border border-[var(--color-gray-200)] rounded-2xl overflow-hidden bg-slate-50/60 text-xs">
        <div className="flex items-center justify-between p-3 bg-white">
          <span className="text-[var(--color-gray-500)]">Status</span>
          <Badge status={status} />
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[var(--color-gray-500)]">Payment Method</span>
          <span className="font-semibold text-[var(--color-gray-800)] flex items-center gap-1">
            {isOffline ? 'Offline P-256 QR' : 'Online Transfer'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white">
          <span className="text-[var(--color-gray-500)]">Transaction ID</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="font-mono text-[11px] text-[var(--color-indigo-600)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
            title="Click to copy ID"
          >
            <span>{formatTxIdShort(transaction.id)}</span>
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[var(--color-gray-500)]">Timestamp</span>
          <span className="text-[var(--color-gray-700)] font-medium">
            {formatDateTime(transaction.timestamp || transaction.createdAt)}
          </span>
        </div>

        {transaction.note && (
          <div className="flex items-center justify-between p-3 bg-white">
            <span className="text-[var(--color-gray-500)]">Payment Note</span>
            <span className="text-[var(--color-gray-800)] font-medium italic truncate max-w-[200px]">
              "{transaction.note}"
            </span>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      {showActions && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onDone}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[var(--color-indigo-600)] hover:bg-[var(--color-indigo-700)] text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentReceipt;
