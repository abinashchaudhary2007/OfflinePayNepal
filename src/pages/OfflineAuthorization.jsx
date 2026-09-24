/**
 * OfflineAuthorization.jsx — Phase 4
 * Allows users to request and manage their offline spending authorization.
 * Styled with UPI-inspired Nepali fintech design system:
 * Primary Navy (#172B75), Primary Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useState } from 'react';
import { Shield, Wifi, WifiOff, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatDateTime, formatRelativeTime, calcPercentage } from '../utils/formatting';

function OfflineAuthorization() {
  const { currentUser } = useAuth();
  const { wallet, device, authorization, createOfflineAuthorization, isInitialized } = useWallet();
  const { isOffline } = useOfflineSimulation();

  const [amount, setAmount] = useState('1000');
  const [maxSingle, setMaxSingle] = useState('500');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCreate = async () => {
    setCreateError('');
    setCreateSuccess(false);
    const numAmount = parseFloat(amount);
    const numMax = parseFloat(maxSingle);

    if (!numAmount || numAmount <= 0) { setCreateError('Enter a valid amount.'); return; }
    if (numAmount > 10000) { setCreateError('Maximum offline limit is Rs. 10,000.'); return; }
    if (!numMax || numMax <= 0 || numMax > numAmount) { setCreateError('Max per transaction must be > 0 and ≤ total limit.'); return; }
    if (!device) { setCreateError('You must register a device first.'); return; }
    if (!wallet || wallet.availableBalance < numAmount) { setCreateError('Insufficient balance for this authorization.'); return; }

    setIsCreating(true);
    try {
      await createOfflineAuthorization(currentUser.id, device.id, numAmount, numMax);
      setCreateSuccess(true);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const usedPercent = authorization
    ? calcPercentage(authorization.maximumAmount - authorization.remainingAmount, authorization.maximumAmount)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033]">Offline Authorization</h1>
          <p className="text-xs sm:text-sm text-[#5F6B85] mt-1">Pre-authorize cryptographic spending limits on this device</p>
        </div>

        {/* Info callout */}
        <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 text-[#172B75] bg-[#EAF0FF] border border-[#DCE3F2]">
          <Shield size={16} className="text-[#3155B8] flex-shrink-0" />
          <span>Set an offline spending limit while connected. Valid for 30 days.</span>
        </div>

        {/* Device check */}
        {!device && (
          <div className="p-4 rounded-2xl bg-[#FFF6DD] border border-[#F2A900]/30">
            <p className="text-sm font-bold text-[#B57F00]">⚠ Device Required</p>
            <p className="text-xs text-[#5F6B85] mt-1">
              You need to register a device before getting offline authorization.
              Go to <a href="/devices" className="text-[#3155B8] underline font-semibold">Device Management</a>.
            </p>
          </div>
        )}

        {/* Current Authorization */}
        {authorization && (
          <Card padding className="bg-white border border-[#DCE3F2]">
            <CardHeader title="Current Authorization" subtitle="Active cryptographic spending capacity" />

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F5F7FF] border border-[#DCE3F2]">
                  <p className="text-[10px] text-[#8993A8] uppercase font-bold tracking-wide">Total Limit</p>
                  <p className="text-base font-black text-[#172033] mt-0.5">
                    {formatCurrency(authorization.maximumAmount)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EAF0FF] border border-[#DCE3F2]">
                  <p className="text-[10px] text-[#3155B8] uppercase font-bold tracking-wide">Remaining</p>
                  <p className="text-base font-black text-[#172B75] mt-0.5">
                    {formatCurrency(authorization.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#5F6B85]">Used: {formatCurrency(authorization.maximumAmount - authorization.remainingAmount)}</span>
                  <span className="font-semibold text-[#172033]">{usedPercent}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-[#F5F7FF] border border-[#DCE3F2]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${usedPercent}%`,
                      background: usedPercent > 80
                        ? 'linear-gradient(90deg, #F2A900, #D64545)'
                        : 'linear-gradient(90deg, #172B75, #3155B8)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <InfoRow label="Max Per Transaction" value={formatCurrency(authorization.maxSingleTransaction)} />
                <InfoRow label="Status" value={<Badge status={authorization.status} />} />
                <InfoRow label="Issued" value={formatDateTime(authorization.issuedAt)} />
                <InfoRow label="Expires" value={formatRelativeTime(authorization.expiresAt)} />
              </div>

              {/* Expiry warning */}
              {new Date(authorization.expiresAt) - new Date() < 3 * 60 * 60 * 1000 && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold bg-[#FFF6DD] text-[#B57F00] border border-[#F2A900]/30">
                  <Clock size={14} />
                  Authorization expires {formatRelativeTime(authorization.expiresAt)} — renew soon
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Create / Renew Authorization */}
        {(!authorization || authorization.remainingAmount === 0) && device && (
          <Card padding className="bg-white border border-[#DCE3F2]">
            <CardHeader
              title={authorization ? 'Renew Authorization' : 'Get Offline Authorization'}
              subtitle="Generate a local spending token locked with your device key"
            />

            <div className="space-y-4">
              <Input
                id="auth-amount"
                label="Offline Spending Limit (NPR)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                hint={`Available balance: ${formatCurrency(wallet?.availableBalance || 0)}`}
                placeholder="1000"
                min="1"
                max="10000"
              />
              <Input
                id="auth-max-single"
                label="Max Per Single Transaction (NPR)"
                type="number"
                value={maxSingle}
                onChange={e => setMaxSingle(e.target.value)}
                hint="Maximum amount for any single offline payment"
                placeholder="500"
                min="1"
              />

              {createError && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-[#FDECEC] border border-[#D64545]/30 text-[#D64545]">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#E8F8F1] border border-[#16A66A]/30 text-[#16A66A]">
                  <CheckCircle2 size={14} /> Authorization created successfully! Valid for 30 days.
                </div>
              )}

              <Button
                block size="lg" variant="primary"
                loading={isCreating}
                disabled={isOffline || !device}
                onClick={handleCreate}
                leftIcon={<Shield size={16} />}
              >
                {isOffline ? 'Must be Online to Authorize' : 'Create Authorization'}
              </Button>

              {isOffline && (
                <p className="text-xs text-center text-[#B57F00]">
                  ⚠ You must be online to create an authorization.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Renew button when auth exists */}
        {authorization && authorization.remainingAmount > 0 && device && (
          <Card padding className="bg-white border border-[#DCE3F2]">
            <CardHeader title="Renew or Change Authorization" subtitle="Update your offline limits" />
            <div className="space-y-4">
              <Input
                id="renew-amount"
                label="New Spending Limit (NPR)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1000"
              />
              <Input
                id="renew-max-single"
                label="New Max Per Transaction (NPR)"
                type="number"
                value={maxSingle}
                onChange={e => setMaxSingle(e.target.value)}
                placeholder="500"
              />
              {createError && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-[#FDECEC] border border-[#D64545]/30 text-[#D64545]">
                  {createError}
                </div>
              )}
              <Button block size="sm" variant="outline" loading={isCreating} disabled={isOffline} onClick={handleCreate}>
                Renew Authorization
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-[#8993A8] uppercase font-bold tracking-wide mb-0.5">{label}</p>
      <div className="text-xs font-semibold text-[#172033]">{value}</div>
    </div>
  );
}

export default OfflineAuthorization;
