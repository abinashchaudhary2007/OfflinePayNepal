/**
 * DeviceManagement.jsx — Phase 11
 * Device registration, viewing, and revocation.
 * Styled with UPI-inspired Nepali fintech design system:
 * Primary Navy (#172B75), Primary Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useState } from 'react';
import { Smartphone, Shield, CheckCircle2, XCircle, Plus, AlertTriangle } from 'lucide-react';
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
      <div className="max-w-4xl space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033]">Device Management</h1>
          <p className="text-xs sm:text-sm text-[#5F6B85] mt-1">Cryptographic key hardware registration and revocation</p>
        </div>

        {/* Security Model note */}
        <div className="p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-[#172B75] bg-[#EAF0FF] border border-[#DCE3F2]">
          <Shield size={16} className="text-[#3155B8] flex-shrink-0" />
          <span>Each device holds an ECDSA P-256 key pair stored securely in IndexedDB with non-extractable keys.</span>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-[#E8F8F1] border-[#16A66A]/30 text-[#16A66A]'
                : message.type === 'warning'
                ? 'bg-[#FFF6DD] border-[#F2A900]/30 text-[#B57F00]'
                : 'bg-[#FDECEC] border-[#D64545]/30 text-[#D64545]'
            }`}
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
          <Card padding className="bg-white border border-[#DCE3F2]">
            <CardHeader title="Current Registered Device" subtitle="Cryptographic identity binding" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2]">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    device.status === 'ACTIVE' ? 'bg-[#E8F8F1] text-[#16A66A]' : 'bg-[#FDECEC] text-[#D64545]'
                  }`}
                >
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-[#172033] truncate">{device.id}</p>
                  <p className="text-xs text-[#5F6B85]">Registered {formatDateTime(device.createdAt)}</p>
                </div>
                <Badge status={device.status} />
              </div>

              {/* Device details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <InfoBox label="Algorithm" value={`ECDSA ${device.algorithm || 'P-256'}`} />
                <InfoBox label="Status" value={device.status} highlight={device.status === 'ACTIVE'} />
                <InfoBox label="TX Counter" value={`#${device.transactionCounter || 0}`} />
                <InfoBox label="Last Seen" value={formatRelativeTime(device.lastSeen)} />
              </div>

              {/* Public key preview */}
              {device.publicKeyJwk && (
                <div className="p-3.5 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2]">
                  <p className="text-[10px] font-bold text-[#8993A8] uppercase tracking-wide mb-1.5">Public Key (JWK — partial)</p>
                  <p className="font-mono text-[10px] text-[#3155B8] break-all">
                    crv: {device.publicKeyJwk.crv}, kty: {device.publicKeyJwk.kty}
                  </p>
                  <p className="font-mono text-[10px] text-[#5F6B85] break-all mt-1">
                    x: {device.publicKeyJwk.x?.slice(0, 24)}...
                  </p>
                </div>
              )}

              {/* Security note */}
              <div className="p-3.5 rounded-xl flex items-start gap-2 bg-[#EAF0FF] border border-[#DCE3F2]">
                <Shield size={14} className="text-[#3155B8] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#172B75]">
                  <strong>Private key is protected.</strong> It is stored as a non-extractable CryptoKey in IndexedDB
                  and cannot be exported or sent over the network.
                </p>
              </div>

              {/* Revoke */}
              {device.status === 'ACTIVE' && (
                <div className="pt-2">
                  {!showRevokeConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowRevokeConfirm(true)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#D64545]/40 hover:bg-[#FDECEC] text-[#D64545] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} /> Revoke This Device
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#FDECEC] border border-[#D64545]/30 space-y-2">
                      <p className="text-sm font-bold text-[#D64545] mb-1">⚠ Revoke Device?</p>
                      <p className="text-xs text-[#5F6B85] mb-3 leading-relaxed">
                        This will permanently disable offline payments for this device.
                        The central ledger will reject all future transactions signed with this device key.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={handleRevoke}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D64545] hover:bg-[#BF3E3E] text-white transition-colors cursor-pointer shadow-sm"
                        >
                          {isRevoking ? 'Revoking...' : 'Yes, Revoke'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {device.status === 'REVOKED' && (
                <div className="p-3.5 rounded-xl bg-[#FDECEC] border border-[#D64545]/30">
                  <p className="text-xs font-bold text-[#D64545]">
                    This device is revoked. Register a new device to create offline transactions.
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card padding className="bg-white border border-[#DCE3F2]">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#F5F7FF] border border-[#DCE3F2] text-[#3155B8]">
                <Smartphone size={32} />
              </div>
              <h2 className="font-bold text-[#172033] mb-2">No Device Registered</h2>
              <p className="text-sm text-[#5F6B85] mb-5 max-w-sm mx-auto">
                Register this device to enable offline payments with hardware-backed cryptographic signatures.
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
          <Card padding className="bg-white border border-[#DCE3F2]">
            <CardHeader title="Register a New Device" subtitle="Generate a fresh cryptographic key pair" />
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
    <div className="p-2.5 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2]">
      <p className="text-[10px] text-[#8993A8] uppercase font-bold tracking-wide">{label}</p>
      <p className={`text-xs font-bold mt-0.5 ${highlight ? 'text-[#16A66A]' : 'text-[#172033]'}`}>
        {value}
      </p>
    </div>
  );
}

export default DeviceManagement;
