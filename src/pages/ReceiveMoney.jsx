import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  QrCode, Copy, CheckCircle2, ArrowDownLeft, ScanLine, Share2,
  FileText, ShieldCheck, ArrowRight, User
} from 'lucide-react';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatTxIdShort } from '../utils/formatting';

const TABS = {
  MY_QR: 'my_qr',
  REQUEST: 'request',
};

function ReceiveMoney() {
  const { currentUser } = useAuth();
  const { device, wallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from send with a created offline tx
  const { tx: incomingTx, mode } = location.state || {};

  const [activeTab, setActiveTab] = useState(TABS.MY_QR);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState('');

  // Generate QR based on active tab or incoming tx
  useEffect(() => {
    async function generate() {
      try {
        setQrError('');
        let payload;

        if (incomingTx && mode === 'show_qr') {
          // Signed Offline Payment QR (from sender)
          payload = JSON.stringify({
            type: 'OFFLINE_PAYMENT',
            version: '1.0',
            id: incomingTx.id,
            senderId: incomingTx.senderId,
            senderName: incomingTx.senderName,
            receiverId: incomingTx.receiverId,
            receiverName: incomingTx.receiverName,
            amount: incomingTx.amount,
            currency: incomingTx.currency || 'NPR',
            timestamp: incomingTx.timestamp,
            nonce: incomingTx.nonce,
            counter: incomingTx.counter,
            authorizationId: incomingTx.authorizationId,
            deviceId: incomingTx.deviceId,
            senderPublicKeyJwk: incomingTx.senderPublicKeyJwk || null,
            signature: incomingTx.signature,
            note: incomingTx.note || '',
          });
        } else if (activeTab === TABS.REQUEST) {
          // Payment Request QR with specific amount and note
          const parsed = parseFloat(requestAmount) || 0;
          payload = JSON.stringify({
            type: 'PAYMENT_REQUEST',
            version: '1.0',
            receiverId: currentUser?.id,
            receiverName: currentUser?.name,
            deviceId: device?.id || null,
            amount: parsed > 0 ? parsed : null,
            note: requestNote.trim() || undefined,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Static Wallet Identity QR (My QR)
          payload = JSON.stringify({
            type: 'PAYMENT_REQUEST',
            version: '1.0',
            receiverId: currentUser?.id,
            receiverName: currentUser?.name,
            deviceId: device?.id || null,
            timestamp: new Date().toISOString(),
          });
        }

        const dataUrl = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: { dark: '#0F172A', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        setQrError('Failed to generate QR code: ' + err.message);
      }
    }

    generate();
  }, [currentUser, device, activeTab, requestAmount, requestNote, incomingTx, mode]);

  const handleCopyId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isShowingSignedTx = mode === 'show_qr' && incomingTx;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)] tracking-tight">
              {isShowingSignedTx ? 'Payment QR Code' : 'Receive Hub'}
            </h1>
            <p className="text-xs text-[var(--color-gray-500)] mt-0.5">
              {isShowingSignedTx
                ? 'Scan this to accept offline payment'
                : 'Share your QR to receive payments from anyone'}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/scan')}
            leftIcon={<ScanLine size={15} />}
            id="btn-receive-scan"
          >
            Scanner
          </Button>
        </div>

        {/* Tab navigation (only shown if not in show_qr transaction mode) */}
        {!isShowingSignedTx && (
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab(TABS.MY_QR)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === TABS.MY_QR
                  ? 'bg-white text-[var(--color-gray-900)] shadow-xs'
                  : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'
              }`}
            >
              My Identity QR
            </button>
            <button
              onClick={() => setActiveTab(TABS.REQUEST)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === TABS.REQUEST
                  ? 'bg-white text-[var(--color-gray-900)] shadow-xs'
                  : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]'
              }`}
            >
              Request Amount QR
            </button>
          </div>
        )}

        {/* Amount & Note Inputs (for Request tab) */}
        {!isShowingSignedTx && activeTab === TABS.REQUEST && (
          <Card padding className="space-y-3 bg-indigo-50/40 border border-indigo-100">
            <div>
              <label htmlFor="req-amount" className="text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider block mb-1">
                Requested Amount (NPR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-gray-400)]">
                  Rs.
                </span>
                <input
                  id="req-amount"
                  type="number"
                  placeholder="e.g. 250"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-base font-bold text-[var(--color-gray-900)] bg-white border border-[var(--color-gray-200)] focus:border-[var(--color-indigo-600)] rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="req-note" className="text-xs font-bold text-[var(--color-gray-700)] uppercase tracking-wider block mb-1">
                For (Optional note)
              </label>
              <input
                id="req-note"
                type="text"
                placeholder="e.g. Lunch split, coffee"
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-[var(--color-gray-800)] bg-white border border-[var(--color-gray-200)] focus:border-[var(--color-indigo-600)] rounded-lg outline-none"
              />
            </div>
          </Card>
        )}

        {/* QR Code Presentation Card */}
        <Card padding className="text-center space-y-4">
          {qrError ? (
            <div className="p-4 rounded-xl text-xs text-red-600 bg-red-50 border border-red-200">
              {qrError}
            </div>
          ) : qrDataUrl ? (
            <>
              {/* QR Image Container */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-sm border border-[var(--color-gray-200)]">
                <img
                  src={qrDataUrl}
                  alt="Payment QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 mx-auto"
                />
              </div>

              {/* Instructions and Details */}
              <div className="space-y-2">
                {!isShowingSignedTx ? (
                  <>
                    <h3 className="text-base font-bold text-[var(--color-gray-900)]">
                      {currentUser?.name}
                    </h3>
                    <p className="text-xs text-[var(--color-gray-500)] max-w-xs mx-auto">
                      {activeTab === TABS.REQUEST && parseFloat(requestAmount) > 0
                        ? `Requesting ${formatCurrency(parseFloat(requestAmount))}${requestNote ? ` for "${requestNote}"` : ''}`
                        : 'Let the sender scan your QR to identify you and send funds.'}
                    </p>

                    {/* Copy Wallet Identifier */}
                    <div
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-gray-50)] hover:bg-slate-100 border border-[var(--color-gray-200)] cursor-pointer text-xs font-mono text-[var(--color-gray-700)] transition-colors mt-2"
                      title="Click to copy Wallet ID"
                    >
                      <span>ID: {currentUser?.id}</span>
                      {copied ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} className="text-[var(--color-gray-400)]" />
                      )}
                    </div>
                  </>
                ) : (
                  /* Signed Offline TX Details */
                  <div className="text-left space-y-2 text-xs border-t border-[var(--color-gray-100)] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-gray-500)]">Amount:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        {formatCurrency(incomingTx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-gray-500)]">Recipient:</span>
                      <span className="font-semibold text-[var(--color-gray-800)]">{incomingTx.receiverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-gray-500)]">Status:</span>
                      <Badge status={incomingTx.status} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-slate-100 animate-pulse mx-auto flex items-center justify-center">
              <QrCode size={48} className="text-slate-300" />
            </div>
          )}
        </Card>

        {/* Bottom CTA to scan a QR */}
        <div className="pt-1">
          <Button
            block
            size="lg"
            variant="outline"
            onClick={() => navigate('/scan')}
            leftIcon={<ScanLine size={18} />}
            id="btn-scan-payment-qr-bottom"
          >
            Scan a Payment QR Code
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReceiveMoney;
