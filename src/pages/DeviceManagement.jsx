/**
 * DeviceManagement.jsx — Phase 11
 * Device registration, viewing, and revocation.
 * Styled with OfflinePay Nepali fintech design system:
 * Deep Navy (#172B75), Royal Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useState } from 'react';
import { Smartphone, Shield, CheckCircle2, XCircle, Plus, AlertTriangle, Key, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateTime, formatRelativeTime } from '../utils/formatting';

function DeviceManagement() {
  const { currentUser } = useAuth();
  const { device, registerDevice, revokeDevice, isInitialized } = useWallet();
  const { isDark } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    setMessage({ type: '', text: '' });
    try {
      const dev = await registerDevice(currentUser.id);
      setMessage({ type: 'success', text: `Device ${dev.id} registered successfully with P-256 ECDSA key pair.` });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevoke = async () => {
    if (!device) return;
    setIsRevoking(true);
    setMessage({ type: '', text: '' });
    try {
      await revokeDevice(device.id);
      setMessage({ type: 'warning', text: `Device ${device.id} has been revoked. It can no longer create offline transactions.` });
      setShowRevokeConfirm(false);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <DashboardLayout maxWidth="max-w-5xl">
      <div className="w-full space-y-7 animate-fade-in pb-16">
        {/* Top Header */}
        <div
          className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Device Management
                </h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Cryptographic key hardware registration and revocation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#F0FDF4',
                color: isDark ? '#4ADE80' : '#166534',
                borderColor: isDark ? 'var(--border-color)' : '#BBF7D0'
              }}
            >
              <ShieldCheck size={14} className="text-[#16A66A]" />
              Non-Extractable Keys
            </span>
          </div>
        </div>

        {/* Security Model note */}
        <div
          className="p-5 rounded-2xl flex items-center gap-3 text-xs sm:text-sm border shadow-xs"
          style={{
            background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
            borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
            color: isDark ? '#FFFFFF' : '#172B75'
          }}
        >
          <Shield size={20} className="text-[#3155B8] flex-shrink-0" />
          <span className="font-medium leading-relaxed">
            Each registered device holds an asymmetric ECDSA P-256 key pair stored securely in IndexedDB with non-extractable client protection.
          </span>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className="p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border"
            style={{
              background: message.type === 'success' ? '#E8F8F1' : message.type === 'warning' ? '#FFF6DD' : '#FDECEC',
              borderColor: message.type === 'success' ? '#16A66A' : message.type === 'warning' ? '#F2A900' : '#D64545',
              color: message.type === 'success' ? '#16A66A' : message.type === 'warning' ? '#B57F00' : '#D64545',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} />
              : message.type === 'warning' ? <AlertTriangle size={16} />
              : <XCircle size={16} />
            }
            <span>{message.text}</span>
          </div>
        )}

        {/* Current Device */}
        {device ? (
          <div
            className="rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div className="border-b pb-4" style={{ borderColor: isDark ? 'var(--border-color)' : '#E2E8F0' }}>
              <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Current Registered Device
              </h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Cryptographic hardware binding active on this browser profile.
              </p>
            </div>

            <div className="space-y-5">
              <div
                className="flex items-center gap-4.5 p-5 sm:p-6 rounded-2xl border"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs"
                  style={{
                    background: device.status === 'ACTIVE' ? '#E8F8F1' : '#FDECEC',
                    color: device.status === 'ACTIVE' ? '#16A66A' : '#D64545',
                  }}
                >
                  <Smartphone size={24} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-mono text-sm sm:text-base font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
                    {device.id}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Registered {formatDateTime(device.createdAt)}
                  </p>
                </div>
                <Badge status={device.status} />
              </div>

              {/* Device details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <InfoBox label="Algorithm" value={`ECDSA ${device.algorithm || 'P-256'}`} isDark={isDark} />
                <InfoBox label="Status" value={device.status} highlight={device.status === 'ACTIVE'} isDark={isDark} />
                <InfoBox label="TX Counter" value={`#${device.transactionCounter || 0}`} isDark={isDark} />
                <InfoBox label="Last Seen" value={formatRelativeTime(device.lastSeen)} isDark={isDark} />
              </div>

              {/* Public key preview */}
              {device.publicKeyJwk && (
                <div
                  className="p-5 rounded-2xl border space-y-2 font-mono text-xs"
                  style={{
                    background: isDark ? 'var(--bg-elevated)' : '#FAFBFF',
                    borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Public Key JWK (Hardware Signature Identity)
                  </p>
                  <div
                    className="p-3.5 rounded-xl border space-y-1"
                    style={{
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
                      color: isDark ? 'var(--text-primary)' : '#334155'
                    }}
                  >
                    <p className="break-all font-bold text-[#3155B8]">
                      crv: {device.publicKeyJwk.crv} • kty: {device.publicKeyJwk.kty}
                    </p>
                    <p className="break-all text-[#64748B]">
                      x: {device.publicKeyJwk.x?.slice(0, 32)}...
                    </p>
                  </div>
                </div>
              )}

              {/* Security note */}
              <div
                className="p-4 sm:p-5 rounded-2xl flex items-start gap-3 border"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                  borderColor: isDark ? 'var(--border-color)' : '#D4E2FF',
                }}
              >
                <Shield size={18} className="text-[#3155B8] mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: isDark ? '#FFFFFF' : '#172B75' }}>
                  <strong>Private key is non-extractable.</strong> It is kept securely inside browser WebCrypto IndexedDB storage and can never be transmitted over the internet.
                </p>
              </div>

              {/* Revoke Button */}
              {device.status === 'ACTIVE' && (
                <div className="pt-2">
                  {!showRevokeConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowRevokeConfirm(true)}
                      className="w-full py-3.5 px-4 rounded-xl border border-[#D64545]/40 hover:bg-[#FDECEC] text-[#D64545] text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Revoke This Device Key
                    </button>
                  ) : (
                    <div className="p-5 rounded-2xl bg-[#FDECEC] border border-[#D64545]/30 space-y-3">
                      <p className="text-sm font-bold text-[#D64545] flex items-center gap-2">
                        <AlertTriangle size={16} /> Permanently Revoke Device?
                      </p>
                      <p className="text-xs sm:text-sm text-[#5F6B85] leading-relaxed">
                        This will permanently disable offline payments for this device. The central ledger will immediately reject all future transactions signed with this key.
                      </p>
                      <div className="flex gap-3 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setShowRevokeConfirm(false)}>
                          Cancel
                        </Button>
                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={handleRevoke}
                          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#D64545] hover:bg-[#BF3E3E] text-white transition-colors cursor-pointer shadow-xs"
                        >
                          {isRevoking ? 'Revoking...' : 'Yes, Revoke Device'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {device.status === 'REVOKED' && (
                <div className="p-4 rounded-2xl bg-[#FDECEC] border border-[#D64545]/30 text-xs sm:text-sm font-bold text-[#D64545]">
                  This device has been revoked. Register a new device below to resume offline peer-to-peer payments.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl border p-8 sm:p-12 text-center space-y-5 shadow-sm"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-[#EAF0FF] text-[#3155B8]">
              <Smartphone size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>No Device Registered</h2>
              <p className="text-xs sm:text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Register this device to enable offline payments with hardware-backed cryptographic signatures.
              </p>
            </div>
            <div className="max-w-xs mx-auto pt-2">
              <button
                disabled={isRegistering}
                onClick={handleRegister}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
              >
                <Plus size={18} />
                <span>{isRegistering ? 'Registering...' : 'Register This Device'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Register new device when revoked */}
        {device?.status === 'REVOKED' && (
          <div
            className="rounded-3xl border p-6 sm:p-8 space-y-4 shadow-sm"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Register a New Device</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Generate a fresh cryptographic ECDSA key pair.</p>
            </div>
            <button
              disabled={isRegistering}
              onClick={handleRegister}
              className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-xs cursor-pointer flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' }}
            >
              <Plus size={16} />
              <span>{isRegistering ? 'Registering...' : 'Register New Device'}</span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoBox({ label, value, highlight, isDark }) {
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border space-y-1"
      style={{
        background: isDark ? 'var(--bg-elevated)' : '#F8FAFF',
        borderColor: isDark ? 'var(--border-color)' : '#E2E8F0',
      }}
    >
      <p className="text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className={`text-xs sm:text-sm font-extrabold ${highlight ? 'text-[#16A66A]' : ''}`} style={{ color: highlight ? undefined : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

export default DeviceManagement;
