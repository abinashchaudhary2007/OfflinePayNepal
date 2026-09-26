import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Shield, Key, Bell, LogOut, Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatting';

function Profile() {
  const { currentUser, logout, deleteAccount } = useAuth();
  const { wallet, device } = useWallet();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

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
      <div className="max-w-4xl mx-auto space-y-7 animate-fade-in pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Profile
            </h1>
            <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              style={{
                background: isDark ? 'var(--bg-elevated)' : '#EAF0FF',
                color: isDark ? '#4F6FD8' : '#3155B8',
                border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
              }}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Header Title Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Profile
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Manage your personal information and wallet identity.
          </p>
        </div>

        {/* Hero Cover & Avatar Card */}
        <div
          className="rounded-2xl sm:rounded-3xl overflow-hidden border transition-all shadow-xs"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          {/* Top Banner Cover */}
          <div className="h-24 sm:h-28 bg-gradient-to-r from-[#172B75] via-[#1C358A] to-[#3155B8]" />

          {/* Profile Details */}
          <div className="p-6 sm:p-7 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-4 shadow-sm flex-shrink-0 -mt-10 sm:-mt-12"
                style={{
                  background: currentUser?.avatarColor || '#3155B8',
                  borderColor: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                }}
              >
                {currentUser?.avatar || <User size={30} />}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {currentUser?.name || 'Profile Information'}
                </h3>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {currentUser
                    ? `OfflinePay Wallet · ${currentUser.role === 'admin' ? 'Administrator' : 'User'}`
                    : 'No authenticated user source is connected to this interface.'}
                </p>
              </div>
            </div>

            {currentUser && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/20">
                  <span className="w-2 h-2 rounded-full bg-[#16A66A]" />
                  <span>Active Member</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Personal Information */}
          <div
            className="p-6 sm:p-7 rounded-2xl border space-y-4 shadow-xs"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Personal Information
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {currentUser
                  ? 'Your personal details connected to this profile.'
                  : 'Your personal details will appear here when an authenticated profile is available.'}
              </p>
            </div>

            {currentUser ? (
              <div
                className="space-y-3 p-4 rounded-xl border text-xs"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                }}
              >
                <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Full Name</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Email Address</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Phone Number</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold">{currentUser.phone || '+977-9841234567'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Account Role</span>
                  <span className="font-bold text-[#3155B8] capitalize">{currentUser.role || 'User'}</span>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border text-xs"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  color: 'var(--text-secondary)',
                }}
              >
                Unable to load your profile. Please try again after signing in.
              </div>
            )}
          </div>

          {/* Card 2: Wallet Identity */}
          <div
            className="p-6 sm:p-7 rounded-2xl border space-y-4 shadow-xs"
            style={{
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Wallet Identity
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {wallet ? 'Only a user-facing wallet identifier will be shown here.' : 'No user-facing wallet identifier is available.'}
              </p>
            </div>

            {wallet ? (
              <div
                className="space-y-3 p-4 rounded-xl border text-xs"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                }}
              >
                <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Wallet ID</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-mono font-bold">{wallet.id}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Offline Spending Limit</span>
                  <span className="font-bold text-[#16A66A]">NPR {wallet.offlineLimit ? formatCurrency(wallet.offlineLimit) : '1,000.00'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Device Key ID</span>
                  <span className="font-mono text-[#3155B8]">{device?.id || 'DEVICE-OFFLINE'}</span>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border text-xs"
                style={{
                  background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
                  borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                  color: 'var(--text-secondary)',
                }}
              >
                No user-facing wallet identifier is available.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Account Security Banner */}
        <div
          className="p-6 rounded-2xl border shadow-xs"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center flex-shrink-0">
                <Shield size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Account Security
                </h3>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Security information is currently available. Technical details remain protected in the Security Center.
                </p>
              </div>
            </div>

            <Link
              to="/security"
              className="px-4 py-2.5 rounded-xl bg-[#EAF0FF] hover:bg-[#D6E3FF] text-[#3155B8] font-bold text-xs no-underline transition-colors flex-shrink-0 flex items-center gap-1.5"
            >
              <span>View Security Center</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="p-6 rounded-2xl border border-red-200 bg-red-50/20 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-700">Danger Zone</h3>
              <p className="text-xs text-[var(--color-gray-600)] mt-0.5 leading-relaxed">
                Permanently delete your account, offline wallet, cryptographic signing keys, and transaction records. This action cannot be reversed.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-red-200/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut size={15} />}
            >
              Sign Out
            </Button>

            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={15} />}
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
                <span>{deleteError}</span>
              </p>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
