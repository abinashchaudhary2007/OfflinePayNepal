import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/DemoAuthContext';
import { formatDate } from '../utils/formatting';
import { User, Mail, Phone, Cpu, LogOut, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { currentUser, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteAccount();
    setIsDeleting(false);

    if (result.success) {
      setIsDeleteModalOpen(false);
      navigate('/login');
    } else {
      setDeleteError(result.error || 'Failed to delete account.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in pb-12">
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
              <p className="text-sm text-[var(--color-gray-500)]">Wallet Account · {currentUser?.role === 'admin' ? 'Administrator' : 'User'}</p>
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

          <div className="mt-6 pt-5 border-t border-[var(--color-gray-100)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-gray-400)]">Sign out of your active session</span>
            <Button variant="outline" size="sm" onClick={handleLogout} leftIcon={<LogOut size={16} />}>
              Sign Out
            </Button>
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

        {/* Danger Zone: Account Deletion */}
        <Card className="border border-red-200 bg-red-50/20">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-700">Danger Zone</h3>
                <p className="text-xs text-[var(--color-gray-600)] mt-0.5 leading-relaxed">
                  Permanently delete your account, offline wallet, cryptographic signing keys, and offline transaction records. This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={16} />}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteConfirmText('');
                  setIsDeleteModalOpen(true);
                }}
                id="btn-open-delete-account"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            if (!isDeleting) setIsDeleteModalOpen(false);
          }}
          title="Delete Account Permanently"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                loading={isDeleting}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                id="btn-confirm-delete-account"
              >
                Permanently Delete My Account
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-red-900">
                <AlertTriangle size={15} />
                <span>Warning: Irreversible Action</span>
              </div>
              <p>
                Deleting your account will purge your local cryptographic ECDSA private keys, delete your wallet balance, and remove your profile for <strong className="text-red-950 font-semibold">{currentUser?.email}</strong>.
              </p>
            </div>

            <div>
              <label htmlFor="confirm-delete-input" className="block text-xs font-semibold text-[var(--color-gray-700)] mb-1.5">
                To confirm, type <span className="font-mono text-red-600 font-bold">DELETE</span> below:
              </label>
              <Input
                id="confirm-delete-input"
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle size={13} />
                {deleteError}
              </p>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
