/**
 * supabaseSync.js — Synchronization bridge between local IndexedDB and Supabase.
 * Offline-first architecture: The app works 100% locally when offline, and
 * opportunistically syncs transactions, wallets, devices, and profiles when online.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getDB,
  getAllUsers,
  saveUser,
  getTransactionsByUser,
  saveTransaction,
  getPendingSyncItems,
  removeSyncItem,
  getWalletByUserId,
  saveWallet
} from './db';

/**
 * Checks if network is active and Supabase is reachable
 */
export function canSyncWithSupabase() {
  return typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured();
}

/**
 * Sync local sync_queue items to Supabase transactions table
 */
export async function syncQueueToSupabase() {
  if (!canSyncWithSupabase()) return { synced: 0, reason: 'offline_or_unconfigured' };

  const queue = await getPendingSyncItems();
  if (!queue || queue.length === 0) return { synced: 0 };

  let syncedCount = 0;
  for (const item of queue) {
    try {
      if (item.type === 'OFFLINE_PAYMENT' || item.type === 'ONLINE_PAYMENT' || item.type === 'SETTLEMENT') {
        const payload = item.payload;
        const { error } = await supabase.from('transactions').upsert({
          id: payload.id,
          transaction_ref: payload.transactionRef || payload.id,
          sender_id: payload.senderId,
          sender_name: payload.senderName || '',
          receiver_id: payload.receiverId,
          receiver_name: payload.receiverName || '',
          amount: payload.amount,
          type: payload.type || 'PAYMENT',
          payment_type: payload.paymentType || 'OFFLINE_QR',
          status: 'SETTLED',
          signature: payload.signature || null,
          nonce: payload.nonce || null,
          sequence_counter: payload.sequenceCounter || 0,
          offline_auth_id: payload.offlineAuthId || null,
          payload: payload,
          settled_at: new Date().toISOString(),
          created_at: payload.timestamp || new Date().toISOString()
        }, { onConflict: 'id' });

        if (!error) {
          await removeSyncItem(item.id);
          syncedCount++;
        }
      }
    } catch (err) {
      console.warn('[supabaseSync] Error syncing item to Supabase:', item.id, err);
    }
  }

  return { synced: syncedCount, total: queue.length };
}

/**
 * Fetch registered users from Supabase profiles to keep local directory up-to-date
 */
export async function syncProfilesFromSupabase() {
  if (!canSyncWithSupabase()) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, role, created_at');

    if (error || !profiles) {
      return [];
    }

    // Delete any old mock seed profiles from remote Supabase if still present
    supabase.from('profiles').delete().in('id', ['user_anshu_01', 'user_demo_02', 'user_admin_03']).then(() => {}).catch(() => {});

    // Merge into local IndexedDB users store (skipping dummy accounts)
    for (const p of profiles) {
      const email = (p.email || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      if (
        id.startsWith('user-abinash-') || id.startsWith('user-anshu-') || id.startsWith('user-demo-') || id.startsWith('user-admin-') ||
        id === 'user_anshu_01' || id === 'user_demo_02' || id === 'user_admin_03' ||
        email.includes('offlinepay.demo') || email.includes('offlinepay.local')
      ) {
        continue;
      }

      const name = p.full_name || p.email?.split('@')[0] || 'User';
      const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
      await saveUser({
        id: p.id,
        name,
        email: p.email || '',
        phone: p.phone_number || '',
        role: p.role || 'user',
        avatar: initials,
        avatarColor: '#4F46E5',
        createdAt: p.created_at || new Date().toISOString(),
      });
    }

    return profiles;
  } catch (err) {
    console.warn('[supabaseSync] Failed to sync profiles:', err);
    return [];
  }
}

/**
 * Push user profile to Supabase
 */
export async function pushProfileToSupabase(user) {
  if (!canSyncWithSupabase() || !user) return false;

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.name,
      email: user.email?.includes('@') ? user.email : `${user.phone || user.id}@offlinepay.local`,
      phone_number: user.phone || user.email,
      role: user.role || 'user',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    return !error;
  } catch (err) {
    console.warn('[supabaseSync] Failed to push profile:', err);
    return false;
  }
}

/**
 * Delete user profile and wallet from Supabase
 */
export async function deleteProfileAndWalletFromSupabase(userId) {
  if (!canSyncWithSupabase() || !userId) return false;

  try {
    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId);
    // Delete wallet
    await supabase.from('wallets').delete().eq('user_id', userId);
    return true;
  } catch (err) {
    console.warn('[supabaseSync] Failed to delete user from Supabase:', err);
    return false;
  }
}

/**
 * Push user wallet state to Supabase
 */
export async function pushWalletToSupabase(wallet) {
  if (!canSyncWithSupabase() || !wallet) return false;

  try {
    const { error } = await supabase.from('wallets').upsert({
      id: wallet.id,
      user_id: wallet.userId,
      balance: wallet.availableBalance !== undefined ? wallet.availableBalance : (wallet.balance || 0),
      offline_limit: wallet.offlineLimit || 0,
      offline_reserve: wallet.offlineReserve || 0,
      currency: wallet.currency || 'NPR',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return !error;
  } catch (err) {
    console.warn('[supabaseSync] Failed to push wallet to Supabase:', err);
    return false;
  }
}

/**
 * Record a security event in Supabase
 */
export async function pushSecurityEventToSupabase(event) {
  if (!canSyncWithSupabase() || !event) return false;

  try {
    const { error } = await supabase.from('security_events').insert({
      id: event.id || `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: event.userId || null,
      device_id: event.deviceId || null,
      event_type: event.eventType || 'UNKNOWN',
      severity: event.severity || 'LOW',
      details: event.details || {},
      created_at: event.timestamp || new Date().toISOString()
    });

    return !error;
  } catch (err) {
    console.warn('[supabaseSync] Failed to push security event:', err);
    return false;
  }
}

/**
 * Execute server-side atomic double-entry transfer via Supabase RPC
 */
export async function executeRemoteAtomicTransfer({
  senderId,
  receiverId,
  amount,
  txRef,
  senderName = '',
  receiverName = '',
  note = '',
  nonce = null,
  paymentType = 'ONLINE'
}) {
  if (!canSyncWithSupabase()) return { success: false, offline: true };

  try {
    const { data, error } = await supabase.rpc('transfer_funds_atomic', {
      p_sender_id: senderId,
      p_receiver_id: receiverId,
      p_amount: Number(amount),
      p_tx_ref: txRef,
      p_sender_name: senderName,
      p_receiver_name: receiverName,
      p_note: note,
      p_nonce: nonce,
      p_payment_type: paymentType
    });

    if (error) {
      console.warn('[supabaseSync] Remote atomic transfer error:', error);
      return { success: false, error: error.message };
    }
    return data;
  } catch (err) {
    console.warn('[supabaseSync] Remote transfer exception:', err);
    return { success: false, error: err.message };
  }
}
