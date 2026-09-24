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
      <div className="p-3.5 rounded-xl bg-[#E8F8F1] border border-[#16A66A]/30 text-xs flex items-start gap-2.5 text-left">
        <CheckCircle2 size={18} className="text-[#16A66A] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Successfully Settled by Server</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            This transaction has been authoritatively verified and settled on the central ledger.
          </p>
        </div>
      </div>
    );
  } else if (status === 'SYNCING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#EAF0FF] border border-[#3155B8]/30 text-xs flex items-start gap-2.5 text-left animate-pulse">
        <RefreshCw size={18} className="text-[#3155B8] shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="font-bold text-[#172033]">Synchronizing with Server</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            Connecting to cloud ledger to verify cryptographic signature and reconcile balances.
          </p>
        </div>
      </div>
    );
  } else if (status === 'RETRY_WAITING') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#FFF6DD] border border-[#F2A900]/30 text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#F2A900] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Waiting for Network Reconnection</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            Server is temporarily unreachable. Transaction is safely stored on this device and will automatically retry syncing when online.
          </p>
        </div>
      </div>
    );
  } else if (status === 'REJECTED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#FDECEC] border border-[#D64545]/30 text-xs flex items-start gap-2.5 text-left">
        <XCircle size={18} className="text-[#D64545] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Transaction Rejected</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'Verification check failed. Any reserved funds have been returned to your available balance.'}
          </p>
        </div>
      </div>
    );
  } else if (status === 'RECEIVER_ACKNOWLEDGED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#EAF0FF] border border-[#3155B8]/30 text-xs flex items-start gap-2.5 text-left">
        <CheckCircle2 size={18} className="text-[#3155B8] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Receiver Acknowledged — Verification Pending</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            The receiver has scanned and verified this offline payment. It is safely claimed on this device and awaiting central reconciliation.
          </p>
        </div>
      </div>
    );
  } else if (status === 'EXPIRED') {
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2] text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#8993A8] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Payment Expired & Cancelled</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            {transaction.rejectionReason || 'This payment was not received or settled within the 5-minute timeout window. It has been automatically cancelled and refunded.'}
          </p>
        </div>
      </div>
    );
  } else {
    // OFFLINE_PENDING
    statusBanner = (
      <div className="p-3.5 rounded-xl bg-[#EAF0FF] border border-[#3155B8]/30 text-xs flex items-start gap-2.5 text-left">
        <Clock size={18} className="text-[#3155B8] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#172033]">Payment Created Locally (Offline Pending)</p>
          <p className="text-[#5F6B85] mt-0.5 leading-relaxed">
            Signed with device key and waiting for receiver to scan. Reconciles with server once scanned and connected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DCE3F2] rounded-2xl p-6 shadow-sm text-center space-y-5">
      {/* Official Receipt Header */}
      <div className="flex items-center justify-center gap-2 pb-2 border-b border-[#DCE3F2]">
        <img
          src="/logo.png"
          alt="OfflinePay Nepal"
          className="w-5 h-5 object-contain"
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8993A8]">
          OfflinePay Nepal Receipt
        </span>
      </div>

      {/* Icon & Heading */}
      <div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
          status === 'REJECTED'
            ? 'bg-[#FDECEC] text-[#D64545] border border-[#D64545]/25'
            : status === 'EXPIRED'
            ? 'bg-[#F5F7FF] text-[#8993A8] border border-[#DCE3F2]'
            : status === 'SETTLED'
            ? 'bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/25'
            : status === 'RECEIVER_ACKNOWLEDGED'
            ? 'bg-[#EAF0FF] text-[#3155B8] border border-[#3155B8]/25'
            : status === 'OFFLINE_PENDING'
            ? 'bg-[#EAF0FF] text-[#3155B8] border border-[#3155B8]/25'
            : isSender
            ? 'bg-[#EAF0FF] text-[#172B75] border border-[#DCE3F2]'
            : 'bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/25'
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

        <p className="text-xs font-bold uppercase tracking-wider text-[#8993A8]">
          {status === 'EXPIRED' ? 'Payment Expired & Cancelled' : status === 'RECEIVER_ACKNOWLEDGED' ? 'Receiver Acknowledged' : isSender ? 'Payment Submitted' : 'Payment Received'}
        </p>

        <h2 className="text-3xl font-black text-[#172033] mt-1 tracking-tight">
          {isSender ? '-' : '+'}{formatCurrency(amount)}
        </h2>

        <p className="text-xs text-[#5F6B85] mt-1">
          {isSender ? (
            <span>Sent to <strong className="text-[#172033]">{transaction.receiverName || 'Recipient'}</strong></span>
          ) : (
            <span>Received from <strong className="text-[#172033]">{transaction.senderName || 'Sender'}</strong></span>
          )}
        </p>
      </div>

      {/* Explanatory Status Banner */}
      {statusBanner}

      {/* Receipt Line Items */}
      <div className="divide-y divide-[#DCE3F2] border border-[#DCE3F2] rounded-xl overflow-hidden bg-[#F5F7FF] text-xs">
        <div className="flex items-center justify-between p-3 bg-white">
          <span className="text-[#5F6B85]">Status</span>
          <Badge status={status} />
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[#5F6B85]">Payment Method</span>
          <span className="font-semibold text-[#172033] flex items-center gap-1">
            {isOffline ? 'Offline P-256 QR' : 'Online Transfer'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white">
          <span className="text-[#5F6B85]">Transaction ID</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="font-mono text-[11px] text-[#3155B8] hover:text-[#172B75] flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
            title="Click to copy ID"
          >
            <span>{formatTxIdShort(transaction.id)}</span>
            {copied ? <Check size={12} className="text-[#16A66A]" /> : <Copy size={12} />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-[#5F6B85]">Timestamp</span>
          <span className="text-[#172033] font-medium">
            {formatDateTime(transaction.timestamp || transaction.createdAt)}
          </span>
        </div>

        {transaction.note && (
          <div className="flex items-center justify-between p-3 bg-white">
            <span className="text-[#5F6B85]">Payment Note</span>
            <span className="text-[#172033] font-medium italic truncate max-w-[200px]">
              "{transaction.note}"
            </span>
          </div>
        )}
      </div>

      {/* Footer Action Buttons (Primary CTA: Background #172B75, Text #FFFFFF) */}
      {showActions && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onDone}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#172B75] hover:bg-[#12215B] text-white shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentReceipt;
