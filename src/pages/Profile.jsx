import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Shield, LogOut, Trash2, AlertTriangle, ShieldAlert,
  Camera, Edit3, Check, X, Copy, CheckCircle2, Wallet,
  ArrowUpRight, ArrowDownLeft, Phone, Mail, BadgeCheck, Key
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/DemoAuthContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatting';
import { saveUser } from '../services/db';

// Compress and convert image file → base64 data URL (max 200×200 px)
async function compressImageToBase64(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProfileAvatar({ user, size = 96, editable = false, onUpload }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const base64 = await compressImageToBase64(file, 300);
      await onUpload(base64);
    } catch (err) {
      console.warn('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const initials = user?.avatar || (user?.name
    ? user.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U');

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Avatar circle */}
      <div
        className="rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
        style={{
          width: size, height: size,
          background: user?.avatarPhotoUrl ? 'transparent' : (user?.avatarColor || '#3155B8'),
        }}
      >
        {user?.avatarPhotoUrl
          ? <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          : <span className="text-white font-black select-none" style={{ fontSize: size * 0.35 }}>{initials}</span>
        }
      </div>

      {/* Edit overlay */}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group cursor-pointer"
            title="Change profile photo"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5">
              <Camera size={size * 0.22} className="text-white drop-shadow" />
              <span className="text-white text-[10px] font-bold drop-shadow">Change</span>
            </div>
          </button>
          {/* Small camera badge */}
          <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-[#3155B8] border-2 border-white flex items-center justify-center shadow-md pointer-events-none">
            {uploading
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={12} className="text-white" />
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}

function EditableField({ label, value, icon: Icon, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const { isDark } = useTheme();

  const handleSave = async () => {
    if (draft.trim() === (value || '').trim()) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(value || ''); setEditing(false); };

  return (
    <div
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-colors"
      style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon size={14} className="text-[#3155B8] flex-shrink-0" />}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          {editing ? (
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              placeholder={placeholder}
              autoFocus
              className="mt-0.5 text-sm font-semibold bg-transparent border-b-2 border-[#3155B8] outline-none w-full"
              style={{ color: 'var(--text-primary)' }}
            />
          ) : (
            <p className="text-sm font-semibold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {value || <span style={{ color: 'var(--text-secondary)' }}>Not set</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="w-7 h-7 rounded-lg bg-[#16A66A] text-white flex items-center justify-center hover:bg-[#13956A] transition-colors cursor-pointer">
              {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={handleCancel} className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer">
              <X size={13} />
            </button>
          </>
        ) : (
          <button onClick={() => { setDraft(value || ''); setEditing(true); }} className="w-7 h-7 rounded-lg text-[#3155B8] flex items-center justify-center hover:bg-[#EAF0FF] transition-colors cursor-pointer">
            <Edit3 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function CopyableField({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="flex items-center justify-between gap-2 p-3.5 rounded-xl"
      style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className={`text-xs mt-0.5 truncate font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>
          {value || '—'}
        </p>
      </div>
      {value && (
        <button onClick={handleCopy} className="w-7 h-7 rounded-lg text-[#3155B8] flex items-center justify-center hover:bg-[#EAF0FF] transition-colors flex-shrink-0 cursor-pointer" title="Copy">
          {copied ? <CheckCircle2 size={14} className="text-[#16A66A]" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}

function Profile() {
  const { currentUser, logout, deleteAccount, setCurrentUser } = useAuth();
  const { wallet, device, transactions } = useWallet();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const totalSent = (transactions || []).filter(t => t.senderId === currentUser?.id).length;
  const totalReceived = (transactions || []).filter(t => t.receiverId === currentUser?.id).length;
  const memberSince = currentUser?.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(currentUser.createdAt))
    : 'N/A';

  const handleLogout = () => { logout(); navigate('/'); };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    setIsDeleting(false);
    if (result.success) { setIsDeleteModalOpen(false); navigate('/login'); }
    else setDeleteError(result.error || 'Failed to delete account.');
  };

  // Save updated user field to IndexedDB + context
  const handleSaveField = useCallback(async (field, value) => {
    if (!currentUser) return;
    const updated = { ...currentUser, [field]: value };
    await saveUser(updated);
    setCurrentUser?.(updated);
  }, [currentUser, setCurrentUser]);

  // Save avatar photo
  const handleAvatarUpload = useCallback(async (base64) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatarPhotoUrl: base64 };
    await saveUser(updated);
    setCurrentUser?.(updated);
  }, [currentUser, setCurrentUser]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-14">

        {/* ── Hero Card ── */}
        <div
          className="rounded-3xl overflow-hidden border shadow-sm"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          {/* Cover banner */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-[#0F1E5B] via-[#1C358A] to-[#3B6FD4] overflow-hidden">
            {/* Abstract geometric decoration */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 border border-white/10" />
            <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-white/5 border border-white/10" />
            <div className="absolute -bottom-6 left-8 w-28 h-28 rounded-full bg-white/5 border border-white/10" />
            <div className="absolute bottom-2 right-4 w-3 h-3 rounded-full bg-[#38BDF8]/60" />
            <div className="absolute top-6 left-1/3 w-2 h-2 rounded-full bg-white/40" />
          </div>

          {/* Avatar + name row */}
          <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4 -mt-12 sm:-mt-14">
              <ProfileAvatar
                user={currentUser}
                size={88}
                editable
                onUpload={handleAvatarUpload}
              />
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {currentUser?.name || 'Your Profile'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F1] text-[#16A66A] border border-[#16A66A]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A]" />
                    Active
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {currentUser?.email || 'OfflinePay Wallet'}
                </p>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 pb-1 sm:pb-0">
              <div className="text-center px-4 py-2 rounded-xl border" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF', borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{totalSent}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Sent</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF', borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{totalReceived}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Received</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border" style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF', borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{memberSince}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal Info (editable) ── */}
        <div
          className="rounded-2xl border p-5 space-y-3 shadow-xs"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center">
              <User size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Click the edit icon to update your details</p>
            </div>
          </div>

          <EditableField
            label="Full Name"
            value={currentUser?.name}
            icon={User}
            placeholder="Your full name"
            onSave={(v) => handleSaveField('name', v)}
          />
          <EditableField
            label="Phone Number"
            value={currentUser?.phone}
            icon={Phone}
            type="tel"
            placeholder="+977-98XXXXXXXX"
            onSave={(v) => handleSaveField('phone', v)}
          />

          {/* Email — read-only */}
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl"
            style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}
          >
            <Mail size={14} className="text-[#3155B8] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email Address</p>
              <p className="text-sm font-semibold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{currentUser?.email}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#3155B8] font-bold border border-[#DCE3F2] flex-shrink-0">
              Verified
            </span>
          </div>

          {/* Role badge */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}
          >
            <div className="flex items-center gap-2.5">
              <BadgeCheck size={14} className="text-[#3155B8]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Account Role</p>
                <p className="text-sm font-semibold capitalize mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {currentUser?.role || 'User'}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F8F1] text-[#16A66A] font-bold border border-[#16A66A]/20">
              {currentUser?.role === 'admin' ? 'Administrator' : 'Standard User'}
            </span>
          </div>
        </div>

        {/* ── Wallet Identity ── */}
        <div
          className="rounded-2xl border p-5 space-y-3 shadow-xs"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center">
              <Wallet size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Wallet Identity</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Your cryptographic wallet identifiers</p>
            </div>
          </div>

          <CopyableField label="Wallet ID" value={wallet?.id} mono />
          <CopyableField label="Device Key ID" value={device?.id} mono />

          <div
            className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: isDark ? 'var(--bg-elevated)' : '#F5F7FF' }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Offline Spending Limit</p>
              <p className="text-sm font-black text-[#16A66A] mt-0.5">
                {wallet ? formatCurrency(wallet.offlineLimit || 0) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Balance</p>
              <p className="text-sm font-black text-[#3155B8] mt-0.5">
                {wallet ? formatCurrency(wallet.availableBalance || 0) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Account Security ── */}
        <div
          className="p-5 rounded-2xl border shadow-xs flex items-center justify-between gap-4"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] text-[#3155B8] flex items-center justify-center flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Account Security</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Manage ECDSA keys, device trust & security events
              </p>
            </div>
          </div>
          <Link
            to="/security"
            className="px-4 py-2 rounded-xl bg-[#EAF0FF] hover:bg-[#D6E3FF] text-[#3155B8] font-bold text-xs no-underline transition-colors flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
          >
            Open <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* ── Danger Zone ── */}
        <div className="p-5 rounded-2xl border border-red-200 space-y-4" style={{ background: isDark ? 'rgba(220,38,38,0.05)' : '#FFF5F5' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-700">Danger Zone</h3>
              <p className="text-xs text-red-500/80 mt-0.5 leading-relaxed">
                Permanently deletes your account, wallet, cryptographic keys, and all transaction records. This action cannot be reversed.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-red-200/60 pt-3.5">
            <Button variant="outline" size="sm" onClick={handleLogout} leftIcon={<LogOut size={14} />}>
              Sign Out
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => { setDeleteError(null); setDeleteConfirmText(''); setIsDeleteModalOpen(true); }}
              id="btn-open-delete-account"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* ── Delete Confirmation Modal ── */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => { if (!isDeleting) setIsDeleteModalOpen(false); }}
          title="Delete Account Permanently"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
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
                Permanently Delete
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
                Deleting your account will purge your local ECDSA private keys, delete your wallet balance, and remove your profile for{' '}
                <strong className="text-red-950">{currentUser?.email}</strong>.
              </p>
            </div>
            <div>
              <label htmlFor="confirm-delete-input" className="block text-xs font-semibold text-[var(--color-gray-700)] mb-1.5">
                Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
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
