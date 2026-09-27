import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  QrCode, Copy, CheckCircle2, ArrowDownLeft, ScanLine, Share2,
  FileText, ShieldCheck, ArrowRight, User, Download, Sparkles, Wifi, WifiOff
} from 'lucide-react';
import QRCode from 'qrcode';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDateTime } from '../utils/formatting';

const TABS = {
  MY_QR: 'my_qr',
  REQUEST: 'request',
};

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

function ReceiveMoney() {
  const { currentUser } = useAuth();
  const { device, wallet } = useWallet();
  const { isDark } = useTheme();
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
          width: 480,
          margin: 3,
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

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `offlinepay-qr-${currentUser?.name || 'wallet'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isShowingSignedTx = mode === 'show_qr' && incomingTx;

  return (
    <DashboardLayout>
      <div
        className="max-w-4xl mx-auto animate-fade-in pb-16"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {isShowingSignedTx ? 'Payment Voucher QR' : 'Receive & Collect Money'}
              </h1>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: isDark ? 'rgba(22,166,106,0.18)' : '#E8F8F1',
                  color: '#16A66A',
                }}
                className="hidden sm:inline-flex items-center gap-1"
              >
                <ShieldCheck size={11} />
                <span>NPR QR Ready</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isShowingSignedTx
                ? 'Scan this signed voucher on the receiver device to accept funds offline'
                : 'Display your QR or request specific payment amounts with instant settlement'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/scan', { state: { autoStart: true } })}
              leftIcon={<ScanLine size={16} />}
              id="btn-receive-scan"
              className="font-bold shadow-xs"
            >
              Open Scanner
            </Button>
          </div>
        </div>

        {/* ─── Main Two-Column Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ─── Left Column: QR Presentation Card (7 Cols) ─── */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab Navigation */}
            {!isShowingSignedTx && (
              <div
                style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '1rem',
                  padding: '4px',
                  boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.04)',
                }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => setActiveTab(TABS.MY_QR)}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: activeTab === TABS.MY_QR ? 700 : 600,
                    color: activeTab === TABS.MY_QR ? '#FFFFFF' : 'var(--text-secondary)',
                    background: activeTab === TABS.MY_QR
                      ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)'
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: activeTab === TABS.MY_QR ? '0 2px 8px rgba(23,43,117,0.25)' : 'none',
                  }}
                >
                  My Wallet QR
                </button>
                <button
                  onClick={() => setActiveTab(TABS.REQUEST)}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: activeTab === TABS.REQUEST ? 700 : 600,
                    color: activeTab === TABS.REQUEST ? '#FFFFFF' : 'var(--text-secondary)',
                    background: activeTab === TABS.REQUEST
                      ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)'
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: activeTab === TABS.REQUEST ? '0 2px 8px rgba(23,43,117,0.25)' : 'none',
                  }}
                >
                  Request Amount QR
                </button>
              </div>
            )}

            {/* Custom Amount Form when in Request Tab */}
            {!isShowingSignedTx && activeTab === TABS.REQUEST && (
              <div
                style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                  borderRadius: '1.25rem',
                  padding: '20px',
                  boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.04)',
                }}
                className="space-y-3.5 animate-fade-in"
              >
                <div>
                  <label htmlFor="req-amount" className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Requested Amount (NPR)
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      borderRadius: '0.875rem',
                      padding: '2px 14px',
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: '6px' }}>
                      Rs.
                    </span>
                    <input
                      id="req-amount"
                      type="number"
                      placeholder="0.00"
                      value={requestAmount}
                      onChange={e => setRequestAmount(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        padding: '6px 0',
                      }}
                    />
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                    {PRESET_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRequestAmount(String(amt))}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '0.5rem',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          background: parseFloat(requestAmount) === amt
                            ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)'
                            : (isDark ? 'var(--bg-elevated)' : '#F5F7FF'),
                          color: parseFloat(requestAmount) === amt ? '#FFFFFF' : 'var(--text-secondary)',
                          border: `1px solid ${parseFloat(requestAmount) === amt ? '#172B75' : (isDark ? 'var(--border-color)' : '#DCE3F2')}`,
                          cursor: 'pointer',
                        }}
                      >
                        Rs. {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="req-note" className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Payment Note (Optional)
                  </label>
                  <input
                    id="req-note"
                    type="text"
                    placeholder="e.g. Dinner share, taxi fare, groceries"
                    value={requestNote}
                    onChange={e => setRequestNote(e.target.value)}
                    style={{
                      background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                      border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                      borderRadius: '0.75rem',
                      padding: '8px 12px',
                      width: '100%',
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Main QR Presentation Card */}
            <div
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1.5rem',
                padding: '30px 24px',
                textAlign: 'center',
                boxShadow: isDark ? 'var(--shadow-card)' : '0 2px 10px rgba(23,43,117,0.06)',
              }}
              className="space-y-5"
            >
              {qrError ? (
                <div className="p-4 rounded-xl text-xs text-[#D64545] bg-[#FDECEC] border border-[#D64545]/30">
                  {qrError}
                </div>
              ) : qrDataUrl ? (
                <>
                  {/* QR Image Box */}
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-[#DCE3F2]">
                    <img
                      src={qrDataUrl}
                      alt="Payment QR Code"
                      className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-lg"
                    />
                  </div>

                  {/* Recipient Details & Amount Badge */}
                  <div className="space-y-2">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {currentUser?.name || 'Wallet Account'}
                    </h3>

                    {activeTab === TABS.REQUEST && parseFloat(requestAmount) > 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/20">
                        <span>Requesting:</span>
                        <span>{formatCurrency(parseFloat(requestAmount))}</span>
                        {requestNote && <span className="opacity-75 italic font-normal">({requestNote})</span>}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
                        Scan using OfflinePay Nepal or any compatible wallet to send payments.
                      </p>
                    )}

                    {/* Copyable Wallet ID */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleCopyId}
                        style={{
                          background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                          border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                          borderRadius: '0.75rem',
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                          color: isDark ? '#738EE4' : '#3155B8',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Click to copy account ID"
                      >
                        <span>ID: {currentUser?.id}</span>
                        {copied ? (
                          <CheckCircle2 size={13} className="text-[#16A66A]" />
                        ) : (
                          <Copy size={13} style={{ color: 'var(--text-muted)' }} />
                        )}
                        {copied && <span className="text-[#16A66A] font-bold text-[10px]">Copied!</span>}
                      </button>
                    </div>
                  </div>

                  {/* Actions: Download QR */}
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                        color: 'var(--text-primary)',
                        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3155B8'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'var(--border-color)' : '#DCE3F2'; }}
                    >
                      <Download size={14} />
                      <span>Download QR</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-60 h-60 rounded-2xl animate-pulse mx-auto flex items-center justify-center" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}>
                  <QrCode size={48} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column: Receiving Capabilities & Scanner (5 Cols) ─── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Receiving Protocols Info Card */}
            <div
              style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
                borderRadius: '1.25rem',
                padding: '24px',
                boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
              }}
              className="space-y-4"
            >
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Receiving Capabilities
              </h4>

              <div className="space-y-3.5 text-xs">
                {/* 1. Online Inflows */}
                <div className="flex items-start gap-3">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '0.75rem',
                      background: 'rgba(22,166,106,0.15)',
                      color: '#16A66A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Wifi size={18} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Instant Online Inflow</strong>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.45 }}>
                      Direct wallet-to-wallet transfer verified and committed in real-time.
                    </p>
                  </div>
                </div>

                {/* 2. Offline P2P Acceptance */}
                <div className="flex items-start gap-3">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '0.75rem',
                      background: 'rgba(79,111,216,0.15)',
                      color: '#3155B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <WifiOff size={18} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Offline Voucher Acceptance</strong>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.45 }}>
                      Open the Scanner to validate sender vouchers and issue signed acknowledgments with zero internet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Scanner Button */}
              <div className="pt-2">
                <Button
                  block
                  variant="primary"
                  onClick={() => navigate('/scan', { state: { autoStart: true } })}
                  leftIcon={<ScanLine size={16} />}
                  className="w-full font-bold text-xs shadow-xs"
                >
                  Scan Incoming Payment QR
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReceiveMoney;
