/**
 * AdminDashboard.jsx — Phase 12
 * Admin-only dashboard with live metrics from WalletContext and mock data.
 * Styled with UPI-inspired Nepali fintech design system:
 * Primary Navy (#172B75), Primary Blue (#3155B8), Light Blue (#EAF0FF), White (#FFFFFF)
 */
import { useEffect, useState } from 'react';
import { Users, Smartphone, ArrowUpRight, WifiOff, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/formatting';
import { getAllTransactions, getSecurityEvents, getAllUsers } from '../services/db';

function AdminDashboard() {
  const { isAdmin, currentUser } = useAuth();
  const { transactions: contextTxs, securityEvents: contextEvents } = useWallet();
  const [allTxs, setAllTxs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    (async () => {
      const txs = await getAllTransactions();
      setAllTxs(txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      const events = await getSecurityEvents();
      setAllEvents(events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      const users = await getAllUsers();
      setAllUsers(users);
    })();
  }, [contextTxs, contextEvents]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 bg-white rounded-2xl border border-[#DCE3F2] max-w-md mx-auto my-12 p-8">
          <Shield size={48} className="text-[#D64545] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#172033]">Access Denied</h2>
          <p className="text-sm text-[#5F6B85] mt-2">Admin privileges required to view system metrics.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Compute live stats
  const stats = {
    totalUsers:          allUsers.length,
    activeDevices:       allUsers.filter(u => u.device?.status === 'ACTIVE').length,
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
      <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033]">Admin Dashboard</h1>
          <p className="text-[#5F6B85] text-sm mt-1">System monitoring, active devices & audit oversight</p>
        </div>

        {/* Tab navigation */}
        <div className="scroll-x pb-1">
          <div className="flex gap-2 w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#172B75] text-white shadow-sm'
                    : 'bg-white text-[#5F6B85] border border-[#DCE3F2] hover:bg-[#F5F7FF] hover:text-[#172033]'
                }`}
              >
                {tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard icon={<Users size={18} />}        label="Total Users"         value={stats.totalUsers}          color="#3155B8" />
              <MetricCard icon={<Smartphone size={18} />}   label="Active Devices"      value={stats.activeDevices}       color="#16A66A" />
              <MetricCard icon={<ArrowUpRight size={18} />} label="Total Transactions"  value={stats.totalTransactions}   color="#172B75" />
              <MetricCard icon={<WifiOff size={18} />}      label="Offline Payments"    value={stats.offlineTransactions} color="#4F6FD8" />
              <MetricCard icon={<Clock size={18} />}        label="Pending Sync"        value={stats.pendingSync}         color="#F2A900" />
              <MetricCard icon={<XCircle size={18} />}      label="Rejected"            value={stats.rejected}            color="#D64545" />
              <MetricCard icon={<Shield size={18} />}       label="Security Events"     value={stats.securityEvents}      color="#3155B8" />
              <MetricCard icon={<AlertTriangle size={18} />} label="High Alerts"        value={stats.highAlerts}          color={stats.highAlerts > 0 ? '#D64545' : '#16A66A'} />
            </div>

            {/* Recent activity */}
            <Card padding className="bg-white border border-[#DCE3F2]">
              <CardHeader title="Recent Transactions" subtitle="Last 5 across all registered users" />
              <div className="divide-y divide-[#DCE3F2]">
                {allTxs.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#172033] truncate">{tx.senderName} → {tx.receiverName}</p>
                      <p className="text-[10px] text-[#5F6B85]">{formatRelativeTime(tx.timestamp)} · <span className="font-mono">{tx.id}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-[#172033]">{formatCurrency(tx.amount)}</p>
                      <Badge status={tx.status} />
                    </div>
                  </div>
                ))}
                {allTxs.length === 0 && <p className="text-sm text-center text-[#5F6B85] py-4">No transactions</p>}
              </div>
            </Card>
          </>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <Card padding={false} className="bg-white border border-[#DCE3F2]">
            <div className="p-4 border-b border-[#DCE3F2]">
              <p className="font-bold text-[#172033]">All Transactions ({allTxs.length})</p>
            </div>
            <div className="divide-y divide-[#DCE3F2]">
              {allTxs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F7FF] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#3155B8]">{tx.id}</p>
                    <p className="text-xs font-semibold text-[#172033] truncate">{tx.senderName} → {tx.receiverName}</p>
                    <p className="text-[10px] text-[#5F6B85]">{formatDateTime(tx.timestamp)} · {tx.method}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-[#172033]">{formatCurrency(tx.amount)}</p>
                    <Badge status={tx.status} />
                  </div>
                </div>
              ))}
              {allTxs.length === 0 && <p className="text-sm text-center text-[#5F6B85] py-8">No transactions recorded yet</p>}
            </div>
          </Card>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <Card padding={false} className="bg-white border border-[#DCE3F2]">
            <div className="p-4 border-b border-[#DCE3F2]">
              <p className="font-bold text-[#172033]">Registered Users ({allUsers.length})</p>
            </div>
            <div className="divide-y divide-[#DCE3F2]">
              {allUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F7FF] transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: user.avatarColor || '#3155B8' }}
                  >
                    {user.avatar || (user.name ? user.name[0] : 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#172033] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#5F6B85]">{user.email} · {user.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-[#16A66A]">{formatCurrency(user.wallet?.availableBalance || 0)}</p>
                    <Badge status={user.device?.status || 'ACTIVE'} />
                  </div>
                </div>
              ))}
              {allUsers.length === 0 && (
                <p className="text-sm text-center text-[#5F6B85] py-8">No registered users found</p>
              )}
            </div>
          </Card>
        )}

        {/* SECURITY EVENTS */}
        {activeTab === 'security_events' && (
          <Card padding={false} className="bg-white border border-[#DCE3F2]">
            <div className="p-4 border-b border-[#DCE3F2]">
              <p className="font-bold text-[#172033]">Security Events ({allEvents.length})</p>
            </div>
            <div className="divide-y divide-[#DCE3F2]">
              {allEvents.map(event => (
                <div key={event.id} className="px-4 py-3 hover:bg-[#F5F7FF] transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-[#172033]">{event.eventType.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          background: event.severity === 'HIGH' ? '#FDECEC' : '#FFF6DD',
                          color: event.severity === 'HIGH' ? '#D64545' : '#B57F00',
                          borderColor: event.severity === 'HIGH' ? '#FACDCD' : '#FCE7A6',
                        }}
                      >
                        {event.severity}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-[#5F6B85] bg-[#F5F7FF] border border-[#DCE3F2]">
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5F6B85]">{event.description}</p>
                  <p className="text-[10px] text-[#8993A8] mt-0.5 font-mono">{formatRelativeTime(event.createdAt)} · {event.deviceId}</p>
                </div>
              ))}
              {allEvents.length === 0 && <p className="text-sm text-center text-[#5F6B85] py-8">No security events recorded</p>}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-[#DCE3F2] hover:border-[#3155B8]/40 transition-all shadow-sm">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-[10px] text-[#8993A8] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black mt-0.5 text-[#172033]">{value}</p>
    </div>
  );
}

export default AdminDashboard;
