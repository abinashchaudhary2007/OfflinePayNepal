/**
 * AdminDashboard.jsx — Phase 12
 * Admin-only dashboard with live metrics from WalletContext and mock data.
 */
import { useEffect, useState } from 'react';
import { Users, Smartphone, ArrowUpRight, WifiOff, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { DEMO_USERS, MOCK_ADMIN_STATS } from '../data/mockData';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatting';
import { getAllTransactions, getSecurityEvents } from '../services/db';

function AdminDashboard() {
  const { isAdmin, currentUser } = useAuth();
  const { transactions: contextTxs, securityEvents: contextEvents } = useWallet();
  const [allTxs, setAllTxs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    (async () => {
      const txs = await getAllTransactions();
      setAllTxs(txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      const events = await getSecurityEvents();
      setAllEvents(events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    })();
  }, [contextTxs, contextEvents]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <Shield size={48} color="var(--color-red-400)" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-gray-700)]">Access Denied</h2>
          <p className="text-sm text-[var(--color-gray-400)] mt-2">Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Compute live stats
  const stats = {
    totalUsers:          DEMO_USERS.length,
    activeDevices:       DEMO_USERS.filter(u => u.device?.status === 'ACTIVE').length,
    totalTransactions:   allTxs.length,
    offlineTransactions: allTxs.filter(tx => tx.method === 'OFFLINE_QR').length,
    pendingSync:         allTxs.filter(tx => tx.status === 'OFFLINE_PENDING' || tx.status === 'SYNCING').length,
    rejected:            allTxs.filter(tx => tx.status === 'REJECTED').length,
    settled:             allTxs.filter(tx => tx.status === 'SETTLED').length,
    securityEvents:      allEvents.length,
    highAlerts:          allEvents.filter(e => e.severity === 'HIGH').length,
  };

  const TABS = ['overview', 'transactions', 'users', 'security_events'];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-gray-900)]">Admin Dashboard</h1>
          <p className="text-[var(--color-gray-500)] text-sm mt-1">System overview and management</p>
        </div>

        {/* Tab navigation */}
        <div className="scroll-x pb-1">
          <div className="flex gap-2 w-max">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[var(--color-navy-900)] text-white'
                    : 'bg-white text-[var(--color-gray-600)] border border-[var(--color-gray-200)]'
                }`}>
                {tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard icon={<Users size={18} />}    label="Total Users"         value={stats.totalUsers}          color="var(--color-indigo-600)" />
              <MetricCard icon={<Smartphone size={18} />} label="Active Devices"    value={stats.activeDevices}       color="var(--color-emerald-600)" />
              <MetricCard icon={<ArrowUpRight size={18} />} label="Total Transactions" value={stats.totalTransactions} color="var(--color-navy-900)" />
              <MetricCard icon={<WifiOff size={18} />}  label="Offline Payments"    value={stats.offlineTransactions} color="var(--color-amber-600)" />
              <MetricCard icon={<Clock size={18} />}    label="Pending Sync"        value={stats.pendingSync}         color="var(--color-amber-600)" />
              <MetricCard icon={<XCircle size={18} />}  label="Rejected"            value={stats.rejected}            color="var(--color-red-500)" />
              <MetricCard icon={<Shield size={18} />}   label="Security Events"     value={stats.securityEvents}      color="var(--color-purple-600 || var(--color-indigo-600))" />
              <MetricCard icon={<AlertTriangle size={18} />} label="High Alerts"    value={stats.highAlerts}          color={stats.highAlerts > 0 ? 'var(--color-red-600)' : 'var(--color-emerald-600)'} />
            </div>

            {/* Recent activity */}
            <Card>
              <CardHeader title="Recent Transactions" subtitle="Last 5 across all users" />
              <div className="divide-y divide-[var(--color-gray-50)]">
                {allTxs.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{tx.senderName} → {tx.receiverName}</p>
                      <p className="text-[10px] text-[var(--color-gray-400)]">{formatRelativeTime(tx.timestamp)} · {tx.id}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-[var(--color-gray-800)]">{formatCurrency(tx.amount)}</p>
                      <Badge status={tx.status} />
                    </div>
                  </div>
                ))}
                {allTxs.length === 0 && <p className="text-sm text-center text-[var(--color-gray-400)] py-4">No transactions</p>}
              </div>
            </Card>
          </>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <Card padding={false}>
            <div className="p-4 border-b border-[var(--color-gray-100)]">
              <p className="font-bold text-[var(--color-gray-900)]">All Transactions ({allTxs.length})</p>
            </div>
            <div className="divide-y divide-[var(--color-gray-50)]">
              {allTxs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[var(--color-gray-500)]">{tx.id}</p>
                    <p className="text-xs font-semibold truncate">{tx.senderName} → {tx.receiverName}</p>
                    <p className="text-[10px] text-[var(--color-gray-400)]">{formatDateTime(tx.timestamp)} · {tx.method}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold">{formatCurrency(tx.amount)}</p>
                    <Badge status={tx.status} />
                  </div>
                </div>
              ))}
              {allTxs.length === 0 && <p className="text-sm text-center text-[var(--color-gray-400)] py-8">No transactions recorded yet</p>}
            </div>
          </Card>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <Card padding={false}>
            <div className="p-4 border-b border-[var(--color-gray-100)]">
              <p className="font-bold text-[var(--color-gray-900)]">Demo Users ({DEMO_USERS.length})</p>
            </div>
            <div className="divide-y divide-[var(--color-gray-50)]">
              {DEMO_USERS.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: user.avatarColor }}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--color-gray-800)] truncate">{user.name}</p>
                    <p className="text-[10px] text-[var(--color-gray-400)]">{user.email} · {user.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-[var(--color-gray-700)]">{formatCurrency(user.wallet?.availableBalance || 0)}</p>
                    <Badge status={user.device?.status || 'PENDING'} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* SECURITY EVENTS */}
        {activeTab === 'security_events' && (
          <Card padding={false}>
            <div className="p-4 border-b border-[var(--color-gray-100)]">
              <p className="font-bold text-[var(--color-gray-900)]">Security Events ({allEvents.length})</p>
            </div>
            <div className="divide-y divide-[var(--color-gray-50)]">
              {allEvents.map(event => (
                <div key={event.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-[var(--color-gray-800)]">{event.eventType.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: event.severity === 'HIGH' ? 'var(--color-red-100)' : 'var(--color-amber-100)',
                          color: event.severity === 'HIGH' ? 'var(--color-red-600)' : 'var(--color-amber-600)',
                        }}>
                        {event.severity}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[var(--color-gray-500)]" style={{ background: 'var(--color-gray-100)' }}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-gray-500)]">{event.description}</p>
                  <p className="text-[10px] text-[var(--color-gray-400)] mt-0.5">{formatRelativeTime(event.createdAt)} · {event.deviceId}</p>
                </div>
              ))}
              {allEvents.length === 0 && <p className="text-sm text-center text-[var(--color-gray-400)] py-8">No security events recorded</p>}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <Card padding>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-[10px] text-[var(--color-gray-400)] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black mt-0.5" style={{ color }}>{value}</p>
    </Card>
  );
}

export default AdminDashboard;
