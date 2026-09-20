/**
 * OfflinePayment.jsx — Phase 5/6
 * Offline payment hub: shows current authorization, pending transactions,
 * links to send/receive offline payments, and sync controls.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  WifiOff, Shield, ArrowUpRight, ArrowDownLeft, QrCode,
  RefreshCw, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useOfflineSimulation } from '../hooks/useOfflineSimulation';
import { formatCurrency, formatRelativeTime, formatDateTime, calcPercentage } from '../utils/formatting';

function OfflinePayment() {
  const { currentUser } = useAuth();
  const {
    wallet, device, authorization, transactions, syncStatus,
    pendingSyncCount, syncTransactions, isInitialized,
  } = useWallet();
  const { isOffline, isSimulating, toggleOfflineSimulation } = useOfflineSimulation();
  const [isSyncing, setIsSyncing] = useState(false);

  const offlineTxs = transactions.filter(tx =>
    tx.status === 'OFFLINE_PENDING' || tx.status === 'SYNCING'
  );

  const handleSync = async () => {
    if (isOffline) return;
    setIsSyncing(true);
    try { await syncTransactions(currentUser); }
    catch (e) { console.error(e); }
    finally { setIsSyncing(false); }
  };

  const usedPercent = authorization
    ? calcPercentage(authorization.maximumAmount - authorization.remainingAmount, authorization.maximumAmount)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Offline Payments</h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">Pay without internet using cryptographic signatures</p>
        </div>

        {/* Online/Offline Status */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between gap-3"
          style={{
            background: isOffline ? '#FEF3C7' : '#D1FAE5',
            border: `1px solid ${isOffline ? '#FCD34D' : '#6EE7B7'}`,
          }}
        >
          <div className="flex items-center gap-3">
            {isOffline
              ? <WifiOff size={20} color="var(--color-amber-600)" />
              : <CheckCircle2 size={20} color="var(--color-emerald-600)" />
            }
            <div>
              <p className="text-sm font-bold" style={{ color: isOffline ? 'var(--color-amber-800)' : 'var(--color-emerald-800)' }}>
                {isSimulating ? 'Offline Simulation Active' : isOffline ? 'You are offline' : 'Online'}
              </p>
              <p className="text-xs" style={{ color: isOffline ? 'var(--color-amber-600)' : 'var(--color-emerald-600)' }}>
                {isOffline ? 'Offline payments available — sync when reconnected' : 'Sync available'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleOfflineSimulation}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: isSimulating ? 'var(--color-amber-400)' : 'var(--color-gray-300)',
              color: isSimulating ? 'var(--color-amber-700)' : 'var(--color-gray-600)',
              background: isSimulating ? 'var(--color-amber-100)' : 'white',
            }}
          >
            {isSimulating ? 'Go Online' : 'Simulate Offline'}
          </button>
        </div>

        {/* Authorization Status */}
        <Card>
          <CardHeader title="Offline Authorization" subtitle="Your spending limit for offline payments" />

          {authorization ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                  <p className="text-[10px] text-[var(--color-gray-400)] uppercase font-bold">Limit</p>
                  <p className="text-sm font-black text-[var(--color-gray-900)]">{formatCurrency(authorization.maximumAmount)}</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: 'var(--color-emerald-50)' }}>
                  <p className="text-[10px] text-[var(--color-gray-400)] uppercase font-bold">Remaining</p>
                  <p className="text-sm font-black text-[var(--color-emerald-600)]">{formatCurrency(authorization.remainingAmount)}</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: 'var(--color-red-50)' }}>
                  <p className="text-[10px] text-[var(--color-gray-400)] uppercase font-bold">Used</p>
                  <p className="text-sm font-black text-[var(--color-red-500)]">{formatCurrency(authorization.maximumAmount - authorization.remainingAmount)}</p>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-gray-100)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${usedPercent}%`,
                  background: 'linear-gradient(90deg, var(--color-emerald-400), var(--color-indigo-500))',
                }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-gray-400)]">Expires {formatRelativeTime(authorization.expiresAt)}</span>
                <Badge status={authorization.status} />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Shield size={32} color="var(--color-gray-300)" className="mx-auto mb-2" />
              <p className="text-sm text-[var(--color-gray-500)] mb-3">No active offline authorization</p>
              <Link to="/offline-authorization" className="btn btn-primary btn-sm no-underline">
                Get Authorization
              </Link>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/send" className="quick-action group no-underline">
            <div className="quick-action-icon group-hover:scale-110 transition-transform" style={{ background: '#FEE2E2' }}>
              <ArrowUpRight size={22} color="var(--color-red-500)" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--color-gray-800)]">Send Offline</p>
              <p className="text-[10px] text-[var(--color-gray-400)]">Sign + QR payment</p>
            </div>
          </Link>
          <Link to="/scan" className="quick-action group no-underline">
            <div className="quick-action-icon group-hover:scale-110 transition-transform" style={{ background: '#D1FAE5' }}>
              <QrCode size={22} color="var(--color-emerald-600)" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--color-gray-800)]">Scan QR</p>
              <p className="text-[10px] text-[var(--color-gray-400)]">Receive offline payment</p>
            </div>
          </Link>
        </div>

        {/* Pending Sync */}
        {offlineTxs.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <CardHeader title={`Pending Sync (${offlineTxs.length})`} subtitle="Transactions awaiting internet" />
              {!isOffline && (
                <Button size="sm" variant="primary" loading={isSyncing} onClick={handleSync}
                  leftIcon={<RefreshCw size={13} />}>
                  Sync
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {offlineTxs.map(tx => {
                const isSent = tx.senderId === currentUser?.id;
                return (
                  <div key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-gray-100)]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSent ? '#FEE2E2' : '#D1FAE5' }}>
                      {isSent
                        ? <ArrowUpRight size={16} color="var(--color-red-500)" />
                        : <ArrowDownLeft size={16} color="var(--color-emerald-600)" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-gray-800)] truncate">
                        {isSent ? `To ${tx.receiverName}` : `From ${tx.senderName}`}
                      </p>
                      <p className="text-[10px] text-[var(--color-gray-400)]">{formatRelativeTime(tx.timestamp)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isSent ? 'text-[var(--color-red-500)]' : 'text-[var(--color-emerald-600)]'}`}>
                        {isSent ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <Badge status={tx.status} />
                    </div>
                  </div>
                );
              })}
            </div>

            {isOffline && (
              <div className="mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
                style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}>
                <WifiOff size={13} />
                Go online to sync {offlineTxs.length} pending transaction{offlineTxs.length !== 1 ? 's' : ''}
              </div>
            )}
          </Card>
        )}

        {/* Security info */}
        <Card>
          <CardHeader title="Security Features" subtitle="How offline payments stay secure" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Shield, title: 'P-256 Signatures', desc: 'Transactions signed with your device key' },
              { icon: RefreshCw, title: 'Replay Protection', desc: 'Unique nonces prevent reuse' },
              { icon: Clock, title: '24h Expiry', desc: 'Authorization expires automatically' },
              { icon: CheckCircle2, title: 'Server Verification', desc: 'Full checks on sync' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                <item.icon size={14} color="var(--color-indigo-600)" className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-gray-800)]">{item.title}</p>
                  <p className="text-[10px] text-[var(--color-gray-400)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default OfflinePayment;
