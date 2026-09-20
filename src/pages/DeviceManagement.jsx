/**
 * DeviceManagement.jsx — Phase 11
 * Device registration, viewing, and revocation.
 */
import { useState } from 'react';
import { Smartphone, Shield, CheckCircle2, XCircle, Plus, AlertTriangle, Clock } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatDateTime, formatRelativeTime } from '../utils/formatting';

function DeviceManagement() {
  const { currentUser } = useAuth();
  const { device, registerDevice, revokeDevice, isInitialized } = useWallet();
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
    <DashboardLayout>
      <div className="max-w-2xl space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Device Management</h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">
            Manage your cryptographic device identity
          </p>
        </div>

        {/* Security Model explanation */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-start gap-3">
            <Shield size={18} color="var(--color-indigo-600)" className="flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--color-gray-600)] leading-relaxed">
              <p className="font-semibold text-[var(--color-indigo-700)] mb-1">Cryptographic Device Identity</p>
              Each device generates an <strong>ECDSA P-256 key pair</strong>. Your private key is stored in IndexedDB
              (non-extractable) and never leaves your device. Only your public key is registered.
              All offline transactions are signed with your device's private key.
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{
              background: message.type === 'success' ? 'var(--color-emerald-100)'
                : message.type === 'warning' ? 'var(--color-amber-100)'
                : 'var(--color-red-100)',
              color: message.type === 'success' ? 'var(--color-emerald-700)'
                : message.type === 'warning' ? 'var(--color-amber-700)'
                : 'var(--color-red-600)',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={14} />
              : message.type === 'warning' ? <AlertTriangle size={14} />
              : <XCircle size={14} />
            }
            {message.text}
          </div>
        )}

        {/* Current Device */}
        {device ? (
          <Card>
            <CardHeader title="Current Device" subtitle="Your registered cryptographic identity" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: device.status === 'ACTIVE' ? 'var(--color-emerald-100)' : 'var(--color-red-100)' }}>
                  <Smartphone size={20} color={device.status === 'ACTIVE' ? 'var(--color-emerald-600)' : 'var(--color-red-500)'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-[var(--color-gray-900)] truncate">{device.id}</p>
                  <p className="text-xs text-[var(--color-gray-400)]">Registered {formatDateTime(device.createdAt)}</p>
                </div>
                <Badge status={device.status} />
              </div>

              {/* Device details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <InfoBox label="Algorithm" value={`ECDSA ${device.algorithm || 'P-256'}`} />
                <InfoBox label="Status" value={device.status} highlight={device.status === 'ACTIVE'} />
                <InfoBox label="TX Counter" value={device.transactionCounter || 0} />
                <InfoBox label="Last Seen" value={formatRelativeTime(device.lastSeen)} />
              </div>

              {/* Public key preview */}
              {device.publicKeyJwk && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                  <p className="text-[10px] font-bold text-[var(--color-gray-400)] uppercase tracking-wide mb-1.5">Public Key (JWK — partial)</p>
                  <p className="font-mono text-[10px] text-[var(--color-gray-600)] break-all">
                    crv: {device.publicKeyJwk.crv}, kty: {device.publicKeyJwk.kty}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--color-gray-500)] break-all mt-1">
                    x: {device.publicKeyJwk.x?.slice(0, 24)}...
                  </p>
                </div>
              )}

              {/* Security note */}
              <div className="p-3 rounded-xl flex items-start gap-2"
                style={{ background: '#D1FAE5' }}>
                <Shield size={14} color="var(--color-emerald-600)" className="mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--color-emerald-700)]">
                  <strong>Private key is protected.</strong> It is stored as a non-extractable CryptoKey in IndexedDB
                  and cannot be exported or sent over the network.
                </p>
              </div>

              {/* Revoke */}
              {device.status === 'ACTIVE' && (
                <div>
                  {!showRevokeConfirm ? (
                    <Button block variant="outline" size="sm" onClick={() => setShowRevokeConfirm(true)}
                      leftIcon={<XCircle size={14} />}
                      style={{ '--btn-color': 'var(--color-red-500)', '--btn-border': 'var(--color-red-300)' }}>
                      Revoke This Device
                    </Button>
                  ) : (
                    <div className="p-4 rounded-xl" style={{ background: 'var(--color-red-50)', border: '1px solid var(--color-red-200)' }}>
                      <p className="text-sm font-bold text-[var(--color-red-700)] mb-1">⚠ Revoke Device?</p>
                      <p className="text-xs text-[var(--color-red-600)] mb-3">
                        This will permanently disable offline payments for this device.
                        The server will reject all future transactions from this device.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
                        <Button size="sm" loading={isRevoking} onClick={handleRevoke}
                          style={{ background: 'var(--color-red-500)', color: 'white' }}>
                          Yes, Revoke
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {device.status === 'REVOKED' && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-red-50)' }}>
                  <p className="text-xs font-bold text-[var(--color-red-600)]">
                    This device is revoked. Register a new device to make offline payments.
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-gray-100)' }}>
                <Smartphone size={32} color="var(--color-gray-400)" />
              </div>
              <h2 className="font-bold text-[var(--color-gray-700)] mb-2">No Device Registered</h2>
              <p className="text-sm text-[var(--color-gray-500)] mb-5">
                Register this device to enable offline payments with cryptographic signatures.
              </p>
              <Button block size="lg" variant="primary" loading={isRegistering} onClick={handleRegister}
                leftIcon={<Plus size={16} />}>
                Register This Device
              </Button>
            </div>
          </Card>
        )}

        {/* Register new device when revoked or no device */}
        {device?.status === 'REVOKED' && (
          <Card>
            <CardHeader title="Register a New Device" subtitle="Generate fresh key pair for this device" />
            <Button block variant="primary" loading={isRegistering} onClick={handleRegister}
              leftIcon={<Plus size={16} />}>
              Register New Device
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoBox({ label, value, highlight }) {
  return (
    <div className="p-2 rounded-lg" style={{ background: 'var(--color-gray-50)' }}>
      <p className="text-[10px] text-[var(--color-gray-400)] uppercase font-bold tracking-wide">{label}</p>
      <p className={`text-xs font-bold mt-0.5 ${highlight ? 'text-[var(--color-emerald-600)]' : 'text-[var(--color-gray-800)]'}`}>
        {value}
      </p>
    </div>
  );
}

export default DeviceManagement;
