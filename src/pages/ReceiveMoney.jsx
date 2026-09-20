/**
 * ReceiveMoney.jsx — Phase 7 (QR Generation)
 * Shows QR code for incoming payment or generates a payment request QR.
 * Also serves as the QR display after SendMoney creates an offline transaction.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { QrCode, Copy, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime } from '../utils/formatting';

function ReceiveMoney() {
  const { currentUser } = useAuth();
  const { device } = useWallet();
  const location = useLocation();

  // Mode: 'show_qr' (from SendMoney after signing) or 'request' (generate receive request)
  const { tx: incomingTx, mode } = location.state || {};

  const canvasRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState('');

  const displayTx = incomingTx;

  useEffect(() => {
    generateQR();
  }, [incomingTx, currentUser]);

  async function generateQR() {
    try {
      let payload;

      if (incomingTx && mode === 'show_qr') {
        // QR for the signed offline transaction
        payload = JSON.stringify({
          type: 'OFFLINE_PAYMENT',
          version: '1.0',
          id: incomingTx.id,
          senderId: incomingTx.senderId,
          senderName: incomingTx.senderName,
          receiverId: incomingTx.receiverId,
          receiverName: incomingTx.receiverName,
          amount: incomingTx.amount,
          currency: incomingTx.currency,
          timestamp: incomingTx.timestamp,
          nonce: incomingTx.nonce,
          counter: incomingTx.counter,
          authorizationId: incomingTx.authorizationId,
          deviceId: incomingTx.deviceId,
          senderPublicKeyJwk: incomingTx.senderPublicKeyJwk || null,
          signature: incomingTx.signature,
          note: incomingTx.note || '',
        });
      } else {
        // Payment request QR — receiver asks sender to pay
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
        color: { dark: '#0B192C', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      setQrError('Failed to generate QR code: ' + err.message);
    }
  }

  const handleCopyTxId = () => {
    if (displayTx?.id) {
      navigator.clipboard.writeText(displayTx.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isOfflineTx = mode === 'show_qr' && incomingTx;

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">
            {isOfflineTx ? 'Offline Payment QR' : 'Receive Money'}
          </h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">
            {isOfflineTx
              ? 'Show this QR code to the receiver to complete the offline payment'
              : 'Share your QR code or scan to receive payment'}
          </p>
        </div>

        {/* QR Display Card */}
        <Card>
          <div className="flex flex-col items-center py-4">
            {qrError ? (
              <div className="p-4 rounded-xl text-sm text-center" style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}>
                {qrError}
              </div>
            ) : qrDataUrl ? (
              <>
                {/* QR Code image */}
                <div
                  className="p-4 rounded-2xl mb-4"
                  style={{ background: 'white', boxShadow: '0 0 0 1px var(--color-gray-200)' }}
                >
                  <img src={qrDataUrl} alt="Payment QR Code" className="w-56 h-56 sm:w-64 sm:h-64" />
                </div>

                {isOfflineTx && incomingTx && (
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                      <span className="text-[var(--color-gray-500)] text-xs">Amount</span>
                      <span className="font-black text-[var(--color-emerald-600)]">
                        {formatCurrency(incomingTx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                      <span className="text-[var(--color-gray-500)] text-xs">To</span>
                      <span className="font-semibold text-xs text-[var(--color-gray-800)]">{incomingTx.receiverName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                      <span className="text-[var(--color-gray-500)] text-xs">Status</span>
                      <Badge status={incomingTx.status} />
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors"
                      style={{ background: 'var(--color-gray-50)' }}
                      onClick={handleCopyTxId}
                    >
                      <span className="text-[var(--color-gray-500)] text-xs">TX ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[var(--color-gray-700)]">{incomingTx.id}</span>
                        {copied
                          ? <CheckCircle2 size={12} color="var(--color-emerald-500)" />
                          : <Copy size={12} color="var(--color-gray-400)" />
                        }
                      </div>
                    </div>

                    {/* Signature status */}
                    <div
                      className="p-3 rounded-xl flex items-center gap-2"
                      style={{ background: incomingTx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-50)' : 'var(--color-amber-50)' }}
                    >
                      <CheckCircle2 size={14} color={incomingTx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-600)' : 'var(--color-amber-600)'} />
                      <span className="text-xs font-semibold" style={{ color: incomingTx.signature !== 'DEMO_SIG' ? 'var(--color-emerald-700)' : 'var(--color-amber-700)' }}>
                        {incomingTx.signature !== 'DEMO_SIG' ? 'Cryptographically Signed' : 'Demo Signature'}
                      </span>
                    </div>
                  </div>
                )}

                {!isOfflineTx && (
                  <div className="text-center mt-2">
                    <p className="text-sm font-semibold text-[var(--color-gray-700)]">{currentUser?.name}</p>
                    <p className="text-xs text-[var(--color-gray-400)] mt-0.5">{currentUser?.email}</p>
                    <p className="text-xs text-[var(--color-gray-400)] mt-1">Scan to send payment to this account</p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-56 h-56 rounded-2xl animate-pulse flex items-center justify-center"
                style={{ background: 'var(--color-gray-100)' }}>
                <QrCode size={48} color="var(--color-gray-300)" />
              </div>
            )}
          </div>
        </Card>

        {/* Scan button */}
        <Button
          block size="lg" variant="outline"
          onClick={() => window.location.href = '/scan'}
          leftIcon={<QrCode size={18} />}
        >
          Scan a Payment QR
        </Button>

        {/* Instructions */}
        <Card>
          <CardHeader title="How to Complete Payment" />
          <ol className="space-y-2">
            {(isOfflineTx ? [
              'Show this QR code to the receiver on their screen.',
              'Receiver opens the app and taps "Scan QR".',
              'Receiver scans and verifies your signature.',
              'Receiver taps "Accept Payment" to store it locally.',
              'When internet is available, both devices sync automatically.',
            ] : [
              'Share this QR code with the sender.',
              'Sender opens the app and scans your QR.',
              'Sender confirms the payment amount.',
              'Payment is processed and credited to your account.',
            ]).map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-gray-600)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-indigo-100)] text-[var(--color-indigo-600)] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default ReceiveMoney;
