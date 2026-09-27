import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Shield, LogOut, Trash2, AlertTriangle, ShieldAlert,
  Camera, Edit3, Check, X, Copy, CheckCircle2, Wallet,
  ArrowUpRight, Phone, Mail, BadgeCheck, Smartphone
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

// Compress and convert image file → base64 data URL (max 300×300 px)
async function compressImageToBase64(file, maxSize = 300) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProfileAvatar({ user, size = 104, editable = false, onUpload }) {
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
    : 'AJ');

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Avatar container */}
      <div
        className="rounded-3xl shadow-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-102"
        style={{
          width: size,
          height: size,
          border: '4px solid #FFFFFF',
          background: user?.avatarPhotoUrl ? 'transparent' : (user?.avatarColor || 'linear-gradient(135deg, #3B66F5 0%, #1A38B8 100%)'),
          boxShadow: '0 8px 24px rgba(23, 43, 117, 0.25)',
        }}
      >
        {user?.avatarPhotoUrl ? (
          <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-black select-none" style={{ fontSize: size * 0.36 }}>
            {initials}
          </span>
        )}
      </div>

      {/* Edit overlay */}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-3xl flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group cursor-pointer"
            title="Change profile photo"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
              <Camera size={22} className="text-white drop-shadow" />
              <span className="text-white text-[11px] font-bold drop-shadow">Change</span>
            </div>
          </button>
          {/* Small camera badge */}
          <div
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-[#3155B8] border-2 border-white flex items-center justify-center shadow-lg pointer-events-none"
            style={{ background: '#3155B8' }}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={16} className="text-white" />
            )}
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
      style={{
        padding: '16px 20px',
        borderRadius: '16px',
        background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isDark ? 'rgba(56, 102, 245, 0.15)' : '#EAF0FF',
              color: '#3155B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} strokeWidth={2.2} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {label}
          </p>
          {editing ? (
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              placeholder={placeholder}
              autoFocus
              style={{
                marginTop: '6px',
                fontSize: '15px',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #3155B8',
                outline: 'none',
                width: '100%',
                color: 'var(--text-primary)',
                padding: '4px 0',
              }}
            />
          ) : (
            <p
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '6px 0 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value || <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Not configured</span>}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#16A66A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
            </button>
            <button
              onClick={handleCancel}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#E2E8F0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setDraft(value || ''); setEditing(true); }}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              color: '#3155B8',
              background: isDark ? 'rgba(56, 102, 245, 0.12)' : '#EAF0FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Edit"
          >
            <Edit3 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function CopyableField({ label, value, mono = false, icon: Icon }) {
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
      style={{
        padding: '16px 20px',
        borderRadius: '16px',
        background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isDark ? 'rgba(56, 102, 245, 0.15)' : '#EAF0FF',
              color: '#3155B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} strokeWidth={2.2} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: mono ? '13px' : '15px',
              fontFamily: mono ? 'monospace' : 'inherit',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '6px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || '—'}
          </p>
        </div>
      </div>
      {value && (
        <button
          onClick={handleCopy}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            color: copied ? '#16A66A' : '#3155B8',
            background: copied ? (isDark ? 'rgba(22, 166, 106, 0.15)' : '#E8F8F1') : (isDark ? 'rgba(56, 102, 245, 0.12)' : '#EAF0FF'),
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <CheckCircle2 size={15} /> Copied
            </>
          ) : (
            <>
              <Copy size={15} /> Copy
            </>
          )}
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
    : 'Sep 2026';

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
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

        {/* ── Hero Profile Header Card ── */}
        <div
          className="rounded-3xl overflow-hidden border shadow-sm transition-all"
          style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
          }}
        >
          {/* Cover decorative gradient */}
          <div
            className="relative h-32 sm:h-40 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #101F58 0%, #1A38B8 50%, #3B66F5 100%)',
            }}
          >
            {/* Ambient decorative glowing shapes */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-8 left-12 w-36 h-36 rounded-full bg-white/10 blur-lg" />
            <div className="absolute top-6 right-32 w-16 h-16 rounded-full border border-white/20" />
            <div className="absolute bottom-4 right-12 w-24 h-24 rounded-full border border-white/15" />
          </div>

          {/* User profile details & stats row */}
          <div style={{ padding: '0 28px 24px 28px' }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              {/* Avatar + Main Name Info */}
              <div className="flex items-end gap-5 -mt-14 sm:-mt-16">
                <ProfileAvatar
                  user={currentUser}
                  size={104}
                  editable
                  onUpload={handleAvatarUpload}
                />
                <div className="pb-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1
                      style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        margin: 0,
                      }}
                    >
                      {currentUser?.name || 'Your Profile'}
                    </h1>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: isDark ? 'rgba(22, 166, 106, 0.18)' : '#E8F8F1',
                        color: '#16A66A',
                        border: '1px solid rgba(22, 166, 106, 0.3)',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#16A66A] animate-pulse" />
                      Active Account
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      margin: '4px 0 0 0',
                    }}
                  >
                    {currentUser?.email || 'OfflinePay Wallet'}
                  </p>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
                    textAlign: 'center',
                    minWidth: '80px',
                  }}
                >
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                    {totalSent}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sent
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
                    textAlign: 'center',
                    minWidth: '80px',
                  }}
                >
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                    {totalReceived}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Received
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
                    textAlign: 'center',
                    minWidth: '95px',
                  }}
                >
                  <p style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: '20px' }}>
                    {memberSince}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Member
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-Column Responsive Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left Column: Personal Information ── */}
          <div
            className="rounded-3xl border shadow-sm flex flex-col justify-between"
            style={{
              padding: '28px 30px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
            }}
          >
            <div>
              {/* Card Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#EAF0FF',
                    color: '#3155B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Personal Information
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Click the edit icon to update your profile details
                  </p>
                </div>
              </div>

              {/* Fields Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                {/* Email Address — Read Only */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(56, 102, 245, 0.15)' : '#EAF0FF',
                        color: '#3155B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Mail size={16} strokeWidth={2.2} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        Email Address
                      </p>
                      <p
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '6px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: isDark ? 'rgba(56, 102, 245, 0.15)' : '#EAF0FF',
                      color: '#3155B8',
                      fontWeight: 800,
                      border: '1px solid rgba(56, 102, 245, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    Verified
                  </span>
                </div>

                {/* Account Role */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: isDark ? 'var(--bg-elevated)' : '#F6F8FD',
                    border: `1px solid ${isDark ? 'var(--border-color)' : '#E2E8F4'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(56, 102, 245, 0.15)' : '#EAF0FF',
                        color: '#3155B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <BadgeCheck size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        Account Role
                      </p>
                      <p
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '6px 0 0 0',
                          textTransform: 'capitalize',
                        }}
                      >
                        {currentUser?.role || 'User'}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: isDark ? 'rgba(22, 166, 106, 0.18)' : '#E8F8F1',
                      color: '#16A66A',
                      fontWeight: 800,
                      border: '1px solid rgba(22, 166, 106, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {currentUser?.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Wallet Identity & Security ── */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Wallet Identity Card */}
            <div
              className="rounded-3xl border shadow-sm"
              style={{
                padding: '28px 30px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#EAF0FF',
                    color: '#3155B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wallet size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Wallet Identity
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Your cryptographic wallet & device credentials
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <CopyableField
                  label="Wallet ID"
                  value={wallet?.id}
                  mono
                  icon={Wallet}
                />
                <CopyableField
                  label="Device Key ID"
                  value={device?.id}
                  mono
                  icon={Smartphone}
                />

                {/* Metric tiles for Spending Limit & Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '18px',
                      background: isDark ? 'rgba(22, 166, 106, 0.1)' : '#F0FAF5',
                      border: '1px solid rgba(22, 166, 106, 0.25)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#16A66A',
                        margin: 0,
                      }}
                    >
                      Offline Spending Limit
                    </p>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#16A66A',
                        margin: '6px 0 0 0',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {wallet ? formatCurrency(wallet.offlineLimit || 0) : '—'}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: '18px',
                      background: isDark ? 'rgba(56, 102, 245, 0.1)' : '#EFF4FF',
                      border: '1px solid rgba(56, 102, 245, 0.25)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#3155B8',
                        margin: 0,
                      }}
                    >
                      Available Balance
                    </p>
                    <p
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#3155B8',
                        margin: '6px 0 0 0',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {wallet ? formatCurrency(wallet.availableBalance || 0) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security Quick Link */}
            <div
              className="rounded-3xl border shadow-sm transition-all hover:border-[#3155B8]"
              style={{
                padding: '20px 24px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderColor: isDark ? 'var(--border-color)' : '#DCE3F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#EAF0FF',
                    color: '#3155B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Security & Trust Center
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                    Manage ECDSA keys, device trust & security events
                  </p>
                </div>
              </div>
              <Link
                to="/security"
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#3155B8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(49, 85, 184, 0.3)',
                }}
              >
                Open <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Danger Zone & Session Actions ── */}
        <div
          className="rounded-3xl border"
          style={{
            padding: '26px 30px',
            background: isDark ? 'rgba(220, 38, 38, 0.06)' : '#FFF5F5',
            borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : '#FED7D7',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FDE8E8',
                  color: '#E53E3E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#C53030', margin: 0 }}>
                  Account Management & Danger Zone
                </h3>
                <p style={{ fontSize: '13px', color: '#E53E3E', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  Signing out ends your current session. Deleting your account irreversibly removes all local cryptographic keys and records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={handleLogout}
                leftIcon={<LogOut size={16} />}
                style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: 800 }}
              >
                Sign Out
              </Button>
              <Button
                variant="danger"
                size="md"
                leftIcon={<Trash2 size={16} />}
                onClick={() => { setDeleteError(null); setDeleteConfirmText(''); setIsDeleteModalOpen(true); }}
                id="btn-open-delete-account"
                style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: 800 }}
              >
                Delete Account
              </Button>
            </div>
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
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div className="flex items-center gap-2 font-bold text-[#7F1D1D] mb-1">
                <AlertTriangle size={17} />
                <span>Warning: Irreversible Action</span>
              </div>
              <p style={{ margin: 0 }}>
                Deleting your account will purge your local ECDSA private keys, delete your offline wallet balance, and remove your profile for{' '}
                <strong style={{ color: '#7F1D1D' }}>{currentUser?.email}</strong>.
              </p>
            </div>
            <div>
              <label htmlFor="confirm-delete-input" className="block text-xs font-bold text-[var(--color-gray-700)] mb-2">
                Type <span className="font-mono text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
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
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle size={14} />
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
