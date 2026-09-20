import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { formatDate } from '../utils/formatting';
import { User, Mail, Phone, Cpu, Shield, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <h1 className="text-2xl font-black text-[var(--color-gray-900)]">My Profile</h1>

        {/* User card */}
        <Card>
          <div className="flex items-center gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl"
              style={{ background: currentUser?.avatarColor || 'var(--color-indigo-600)' }}
            >
              {currentUser?.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)]">{currentUser?.name}</h2>
              <p className="text-sm text-[var(--color-gray-500)]">Demo Account · {currentUser?.role === 'admin' ? 'Administrator' : 'User'}</p>
              <p className="text-xs text-[var(--color-gray-400)] mt-0.5">Member since {formatDate(currentUser?.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: Mail,  label: 'Email',  value: currentUser?.email  },
              { icon: Phone, label: 'Phone',  value: currentUser?.phone  },
              { icon: User,  label: 'Role',   value: currentUser?.role === 'admin' ? 'Administrator' : 'User' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
                <item.icon size={16} color="var(--color-gray-400)" />
                <span className="text-xs font-medium text-[var(--color-gray-400)] w-14">{item.label}</span>
                <span className="text-sm font-semibold text-[var(--color-gray-700)]">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Device info */}
        {currentUser?.device && (
          <Card>
            <CardHeader title="Registered Device" subtitle="Your current device details" />
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-gray-50)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-indigo-100)' }}>
                <Cpu size={24} color="var(--color-indigo-600)" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--color-gray-800)] font-mono">{currentUser.device.id}</p>
                <p className="text-xs text-[var(--color-gray-500)] mt-0.5">Transaction counter: {currentUser.device.transactionCounter}</p>
              </div>
              <Badge status={currentUser.device.status} />
            </div>
          </Card>
        )}

        <Button variant="danger" onClick={handleLogout} leftIcon={<LogOut size={16} />}>
          Sign Out
        </Button>
      </div>
    </DashboardLayout>
  );
}
export default Profile;
