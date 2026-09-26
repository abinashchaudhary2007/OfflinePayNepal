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
          width: 420,
          margin: 4,
          color: { dark: '#0F172A', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              {isShowingSignedTx ? 'Payment QR Code' : 'Receive Hub'}
            </h1>
            <p className="text-xs text-[#5F6B85] mt-0.5">
              {isShowingSignedTx
                ? 'Scan this to accept offline payment'
                : 'Share your QR to receive payments from anyone'}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/scan', { state: { autoStart: true } })}
            leftIcon={<ScanLine size={15} />}
            id="btn-receive-scan"
          >
            Scanner
          </Button>
        </div>

        {/* Tab navigation (only shown if not in show_qr transaction mode) */}
        {!isShowingSignedTx && (
          <div className="flex rounded-xl bg-white p-1 border border-[#DCE3F2] shadow-xs">
            <button
              onClick={() => setActiveTab(TABS.MY_QR)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === TABS.MY_QR
                  ? 'bg-[#172B75] text-white shadow-xs'
                  : 'text-[#5F6B85] hover:text-[#172033]'
              }`}
            >
              My Identity QR
            </button>
            <button
              onClick={() => setActiveTab(TABS.REQUEST)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === TABS.REQUEST
                  ? 'bg-[#172B75] text-white shadow-xs'
                  : 'text-[#5F6B85] hover:text-[#172033]'
              }`}
            >
              Request Amount QR
            </button>
          </div>
        )}

        {/* Amount & Note Inputs (for Request tab) */}
        {!isShowingSignedTx && activeTab === TABS.REQUEST && (
          <Card padding className="space-y-3 bg-white border border-[#DCE3F2] shadow-xs">
            <div>
              <label htmlFor="req-amount" className="text-xs font-bold text-[#172033] uppercase tracking-wider block mb-1">
                Requested Amount (NPR)
              </label>
              <div className="relative flex items-center">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8993A8] pointer-events-none select-none z-10"
                  style={{ userSelect: 'none' }}
                >
                  Rs.
                </span>
                <input
                  id="req-amount"
                  type="number"
                  placeholder=""
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  style={{ paddingLeft: '3.75rem', paddingRight: '0.75rem' }}
                  className="w-full py-2 text-base font-bold text-[#172033] bg-[#F5F7FF] border border-[#DCE3F2] focus:border-[#3155B8] rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="req-note" className="text-xs font-bold text-[#172033] uppercase tracking-wider block mb-1">
                For (Optional note)
              </label>
              <input
                id="req-note"
                type="text"
                placeholder="e.g. Lunch split, coffee"
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-[#172033] bg-[#F5F7FF] border border-[#DCE3F2] focus:border-[#3155B8] rounded-lg outline-none"
              />
            </div>
          </Card>
        )}

        {/* QR Code Presentation Card */}
        <Card padding className="text-center space-y-4 bg-white border border-[#DCE3F2] shadow-sm">
          {qrError ? (
            <div className="p-4 rounded-xl text-xs text-[#D64545] bg-[#FDECEC] border border-[#D64545]/30">
              {qrError}
            </div>
          ) : qrDataUrl ? (
            <>
              {/* QR Image Container */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-sm border border-[#DCE3F2]">
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
                    <h3 className="text-base font-bold text-[#172033]">
                      {currentUser?.name}
                    </h3>
                    <p className="text-xs text-[#5F6B85] max-w-xs mx-auto">
                      {activeTab === TABS.REQUEST && parseFloat(requestAmount) > 0
                        ? `Requesting ${formatCurrency(parseFloat(requestAmount))}${requestNote ? ` for "${requestNote}"` : ''}`
                        : 'Let the sender scan your QR to identify you and send funds.'}
                    </p>

                    {/* Copy Wallet Identifier */}
                    <div
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F7FF] hover:bg-[#EAF0FF] border border-[#DCE3F2] cursor-pointer text-xs font-mono text-[#3155B8] transition-colors mt-2"
                      title="Click to copy Wallet ID"
                    >
                      <span>ID: {currentUser?.id}</span>
                      {copied ? (
                        <CheckCircle2 size={13} className="text-[#16A66A]" />
                      ) : (
                        <Copy size={13} className="text-[#8993A8]" />
                      )}
                    </div>
                  </>
                ) : (
                  /* Signed Offline TX Details */
                  <div className="text-left space-y-2 text-xs border-t border-[#DCE3F2] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6B85]">Amount:</span>
                      <span className="font-black text-[#172B75] text-sm">
                        {formatCurrency(incomingTx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6B85]">Recipient:</span>
                      <span className="font-semibold text-[#172033]">{incomingTx.receiverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6B85]">Status:</span>
                      <Badge status={incomingTx.status} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-[#F5F7FF] border border-[#DCE3F2] animate-pulse mx-auto flex items-center justify-center">
              <QrCode size={48} className="text-[#8993A8]" />
            </div>
          )}
        </Card>

        {/* Bottom CTA to scan a QR */}
        <div className="pt-1">
          <Button
            block
            size="lg"
            variant="accent"
            onClick={() => navigate('/scan', { state: { autoStart: true } })}
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
