/**
 * OfflineAuthorization.jsx — Phase 4
 * Allows users to request and manage their offline spending authorization.
 * Interacts with real WalletContext state.
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
      <div className="max-w-2xl space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Offline Authorization</h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">
            Get authorized spending limit for payments without internet
          </p>
        </div>

        {/* How it works */}
        <div
          className="p-4 rounded-2xl text-sm"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="flex items-start gap-3">
            <Shield size={18} color="var(--color-indigo-600)" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--color-indigo-700)] mb-1">How Offline Authorization Works</p>
              <p className="text-xs text-[var(--color-gray-600)] leading-relaxed">
                While online, you set aside a spending limit. This authorization is cryptographically signed
                and stored locally. You can then make payments offline — up to your authorized limit.
                The authorization expires after 24 hours for security.
              </p>
            </div>
          </div>
        </div>

        {/* Device check */}
        {!device && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--color-amber-100)' }}>
            <p className="text-sm font-bold text-[var(--color-amber-800)]">⚠ Device Required</p>
            <p className="text-xs text-[var(--color-amber-600)] mt-1">
              You need to register a device before getting offline authorization.
              Go to <a href="/devices" className="underline">Device Management</a>.
            </p>
          </div>
        )}

        {/* Current Authorization */}
        {authorization && (
          <Card>
            <CardHeader title="Current Authorization" subtitle="Your active offline spending limit" />

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                  <p className="text-[10px] text-[var(--color-gray-500)] uppercase font-bold tracking-wide">Total Limit</p>
                  <p className="text-base font-black text-[var(--color-gray-900)] mt-0.5">
                    {formatCurrency(authorization.maximumAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-emerald-50)' }}>
                  <p className="text-[10px] text-[var(--color-gray-500)] uppercase font-bold tracking-wide">Remaining</p>
                  <p className="text-base font-black text-[var(--color-emerald-600)] mt-0.5">
                    {formatCurrency(authorization.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-gray-500)]">Used: {formatCurrency(authorization.maximumAmount - authorization.remainingAmount)}</span>
                  <span className="font-semibold text-[var(--color-gray-700)]">{usedPercent}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-gray-100)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${usedPercent}%`,
                      background: usedPercent > 80
                        ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                        : 'linear-gradient(90deg, var(--color-emerald-500), var(--color-indigo-500))',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <InfoRow label="Max Per Transaction" value={formatCurrency(authorization.maxSingleTransaction)} />
                <InfoRow label="Status" value={<Badge status={authorization.status} />} />
                <InfoRow label="Issued" value={formatDateTime(authorization.issuedAt)} />
                <InfoRow label="Expires" value={formatRelativeTime(authorization.expiresAt)} />
              </div>

              {/* Expiry warning */}
              {new Date(authorization.expiresAt) - new Date() < 3 * 60 * 60 * 1000 && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}>
                  <Clock size={14} />
                  Authorization expires {formatRelativeTime(authorization.expiresAt)} — renew soon
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Create / Renew Authorization */}
        {(!authorization || authorization.remainingAmount === 0) && device && (
          <Card>
            <CardHeader
              title={authorization ? 'Renew Authorization' : 'Get Offline Authorization'}
              subtitle="Set your offline spending limits"
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
                <div className="p-3 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}>
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
                  style={{ background: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)' }}>
                  <CheckCircle2 size={14} /> Authorization created successfully! Valid for 24 hours.
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
                <p className="text-xs text-center text-[var(--color-amber-600)]">
                  ⚠ You must be online to create an authorization.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Renew button when auth exists */}
        {authorization && authorization.remainingAmount > 0 && device && (
          <Card>
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
                <div className="p-3 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--color-red-100)', color: 'var(--color-red-600)' }}>
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
      <p className="text-[10px] text-[var(--color-gray-400)] uppercase font-bold tracking-wide mb-0.5">{label}</p>
      <div className="text-xs font-semibold text-[var(--color-gray-700)]">{value}</div>
    </div>
  );
}

export default OfflineAuthorization;
