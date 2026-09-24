import {
  CheckCircle2, Clock, XCircle, ArrowUpRight,
  ArrowDownLeft, RefreshCw, Copy, Check, Shield
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateTime, formatTxIdShort } from '../../utils/formatting';

/**
 * PaymentReceipt — Professional fintech receipt component.
 * Distinguishes clearly between:
 * - Settled: Central ledger confirmation (#22C55E)
 * - Offline Pending: Cryptographic acceptance waiting for sync (#A78BFA)
 * - Syncing / In-flight: (#38BDF8)
 * - Retry waiting: (#F59E0B)
 * - Rejected / Failed: (#EF4444)
 * Styled with Midnight Navy (#111C2E / #172337) and Electric Teal actions.
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

  // Determine status banner with text and icon
  let statusBanner = null;

  if (status === 'SETTLED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs flex items-start gap-2.5 text-left">
        <CheckCircle2 size={18} className="text-[#22C55E] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Successfully Settled by Server</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            This transaction has been authoritatively verified and settled on the central ledger.
          </p>
        </div>
      </div>
    );
  } else if (status === 'SYNCING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] text-xs flex items-start gap-2.5 text-left animate-pulse">
        <RefreshCw size={18} className="text-[#38BDF8] shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Synchronizing with Server</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            Connecting to cloud ledger to verify cryptographic signature and reconcile balances.
          </p>
        </div>
      </div>
    );
  } else if (status === 'RETRY_WAITING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Waiting for Network Reconnection</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            Server is temporarily unreachable. Transaction is safely stored on this device and will automatically retry syncing when online.
          </p>
        </div>
      </div>
    );
  } else if (status === 'REJECTED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-start gap-2.5 text-left">
        <XCircle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Transaction Rejected</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'Verification check failed. Any reserved funds have been returned to your available balance.'}
          </p>
        </div>
      </div>
    );
  } else if (status === 'EXPIRED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#172337] border border-[#263449] text-[#94A3B8] text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#94A3B8] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Payment Expired & Cancelled</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'This payment was not received or settled within the 5-minute timeout window. It has been automatically cancelled and refunded.'}
          </p>
        </div>
      </div>
    );
  } else {
    // OFFLINE_PENDING
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#A78BFA]/15 border border-[#A78BFA]/30 text-[#A78BFA] text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#A78BFA] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#F8FAFC]">Payment Accepted Locally (Offline Pending)</p>
          <p className="text-[#94A3B8] mt-0.5 leading-relaxed">
            Cryptographic signature verified on device. Final server reconciliation will execute when either device reconnects to the internet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111C2E] border border-[#263449] rounded-2xl p-6 shadow-xl text-center space-y-5">
      {/* Official Receipt Header */}
      <div className="flex items-center justify-center gap-2 pb-2 border-b border-[#263449]">
        <img
          src="/logo.png"
          alt="OfflinePay Nepal"
          className="w-5 h-5 object-contain"
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
          OfflinePay Nepal Receipt
        </span>
      </div>

      {/* Icon & Heading */}
      <div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
          status === 'REJECTED'
            ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
            : status === 'EXPIRED'
            ? 'bg-[#172337] text-[#94A3B8] border border-[#263449]'
            : status === 'SETTLED'
            ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
            : status === 'OFFLINE_PENDING'
            ? 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30'
            : isSender
            ? 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
            : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
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

        <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
          {status === 'EXPIRED' ? 'Payment Expired & Cancelled' : isSender ? 'Payment Submitted' : 'Payment Received'}
        </p>

        <h2 className="text-3xl font-black text-[#F8FAFC] mt-1 tracking-tight">
          {isSender ? '-' : '+'}{formatCurrency(amount)}
        </h2>

        <p className="text-xs text-[#94A3B8] mt-1">
          {isSender ? (
            <span>Sent to <strong className="text-[#F8FAFC]">{transaction.receiverName || 'Recipient'}</strong></span>
          ) : (
            <span>Received from <strong className="text-[#F8FAFC]">{transaction.senderName || 'Sender'}</strong></span>
          )}
        </p>
      </div>

      {/* Explanatory Status Banner */}
      {statusBanner}

      {/* Receipt Line Items */}
      <div className="divide-y divide-[#263449] border border-[#263449] rounded-xl overflow-hidden bg-[#172337] text-xs">
        <div className="flex items-center justify-between p-3 bg-[#111C2E]">
          <span className="text-[#94A3B8]">Status</span>
          <Badge status={status} />
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[#94A3B8]">Payment Method</span>
          <span className="font-semibold text-[#F8FAFC] flex items-center gap-1">
            {isOffline ? 'Offline P-256 QR' : 'Online Transfer'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#111C2E]">
          <span className="text-[#94A3B8]">Transaction ID</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="font-mono text-[11px] text-[#38BDF8] hover:text-[#14B8A6] flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
            title="Click to copy ID"
          >
            <span>{formatTxIdShort(transaction.id)}</span>
            {copied ? <Check size={12} className="text-[#22C55E]" /> : <Copy size={12} />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[#94A3B8]">Timestamp</span>
          <span className="text-[#F8FAFC] font-medium">
            {formatDateTime(transaction.timestamp || transaction.createdAt)}
          </span>
        </div>

        {transaction.note && (
          <div className="flex items-center justify-between p-3 bg-[#111C2E]">
            <span className="text-[#94A3B8]">Payment Note</span>
            <span className="text-[#F8FAFC] font-medium italic truncate max-w-[200px]">
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
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#14B8A6] hover:bg-[#0D9488] text-[#0B1220] shadow-md shadow-[#14B8A6]/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentReceipt;
