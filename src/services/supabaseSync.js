/**
 * supabaseSync.js — Synchronization bridge between local IndexedDB and Supabase.
 * Offline-first architecture: The app works 100% locally when offline, and
 * opportunistically syncs transactions, wallets, devices, and profiles when online.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
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
} from './db.js';

/**
 * Checks if network is active and Supabase is reachable
 */
export function canSyncWithSupabase() {
  const isOnline = typeof navigator === 'undefined' ? true : (navigator.onLine ?? true);
  return Boolean(isOnline && isSupabaseConfigured());
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
      const isMissingRpc =
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('transfer_funds_atomic');

      if (isMissingRpc) {
        console.info('[supabaseSync] transfer_funds_atomic RPC not found in schema cache, executing direct REST settlement fallback...');
        return await fallbackDirectRemoteTransfer({
          senderId,
          receiverId,
          amount,
          txRef,
          senderName,
          receiverName,
          note,
          nonce,
          paymentType,
        });
      }
      return { success: false, error: error.message };
    }
    return data;
  } catch (err) {
    console.warn('[supabaseSync] Remote transfer exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fallback direct REST settlement when transfer_funds_atomic RPC is not deployed in Supabase
 */
async function fallbackDirectRemoteTransfer({
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
  try {
    const numAmount = Number(amount);

    // 1. Check idempotency: if already settled, return success
    if (txRef) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('transaction_ref', txRef)
        .maybeSingle();

      if (existingTx && existingTx.status === 'SETTLED') {
        return { success: true, already_settled: true, transaction_ref: txRef };
      }
    }

    // 2. Check nonce for replay if provided
    if (nonce) {
      const { data: existingNonce } = await supabase
        .from('nonces')
        .select('nonce')
        .eq('nonce', nonce)
        .maybeSingle();

      if (existingNonce) {
        return { success: false, error: 'Replay detected: nonce already used' };
      }
    }

    // 3. Sender profile & wallet lookup / auto-provision
    let { data: senderWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', senderId)
      .maybeSingle();

    if (!senderWallet) {
      await supabase
        .from('profiles')
        .upsert({
          id: senderId,
          full_name: senderName || 'User',
          role: 'user'
        }, { onConflict: 'id' });

      const newWallet = {
        id: `wallet-${senderId}`,
        user_id: senderId,
        balance: 1000.00,
        offline_limit: 0.00,
        offline_reserve: 0.00,
        currency: 'NPR'
      };
      const { data: createdSenderWallet } = await supabase
        .from('wallets')
        .upsert(newWallet, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      senderWallet = createdSenderWallet || newWallet;
    }

    if (Number(senderWallet.balance) < numAmount) {
      return { success: false, error: 'Insufficient balance on server wallet' };
    }

    // 4. Receiver profile & wallet lookup / auto-provision
    let { data: receiverWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', receiverId)
      .maybeSingle();

    if (!receiverWallet) {
      await supabase
        .from('profiles')
        .upsert({
          id: receiverId,
          full_name: receiverName || 'Shopkeeper/Receiver',
          role: 'user'
        }, { onConflict: 'id' });

      const newRecWallet = {
        id: `wallet-${receiverId}`,
        user_id: receiverId,
        balance: 1000.00,
        offline_limit: 0.00,
        offline_reserve: 0.00,
        currency: 'NPR'
      };
      const { data: createdRecWallet } = await supabase
        .from('wallets')
        .upsert(newRecWallet, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      receiverWallet = createdRecWallet || newRecWallet;
    }

    // 5. Calculate new balances
    const senderNewBalance = Math.round((Number(senderWallet.balance) - numAmount) * 100) / 100;
    const receiverNewBalance = Math.round((Number(receiverWallet.balance) + numAmount) * 100) / 100;

    // 6. Update wallets in Supabase
    await supabase
      .from('wallets')
      .update({ balance: senderNewBalance, updated_at: new Date().toISOString() })
      .eq('user_id', senderId);

    await supabase
      .from('wallets')
      .update({ balance: receiverNewBalance, updated_at: new Date().toISOString() })
      .eq('user_id', receiverId);

    // 7. Record nonce
    if (nonce) {
      await supabase
        .from('nonces')
        .insert({ nonce, transaction_id: txRef, used_at: new Date().toISOString() })
        .catch(() => {});
    }

    // 8. Record transaction in ledger
    const vTxId = txRef || `tx_${Date.now()}`;
    await supabase
      .from('transactions')
      .upsert({
        id: vTxId,
        transaction_ref: txRef || vTxId,
        sender_id: senderId,
        sender_name: senderName,
        receiver_id: receiverId,
        receiver_name: receiverName,
        amount: numAmount,
        type: 'PAYMENT',
        payment_type: paymentType,
        status: 'SETTLED',
        nonce: nonce || null,
        payload: { note, transferred_at: new Date().toISOString() },
        settled_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, { onConflict: 'transaction_ref' });

    return {
      success: true,
      transaction_id: vTxId,
      sender_new_balance: senderNewBalance,
      receiver_new_balance: receiverNewBalance
    };
  } catch (err) {
    console.warn('[supabaseSync] fallbackDirectRemoteTransfer error:', err);
    return { success: false, error: err.message || 'Direct settlement fallback failed' };
  }
}

/**
 * Fetch authoritative wallet balance and limits from Supabase
 */
export async function fetchRemoteWallet(userId) {
  if (!canSyncWithSupabase() || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, user_id, balance, offline_limit, offline_reserve, currency, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[supabaseSync] Error fetching remote wallet:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[supabaseSync] Exception fetching remote wallet:', err);
    return null;
  }
}

/**
 * Pull inbound and reconciled transactions from Supabase into local IndexedDB
 */
export async function syncInboundTransactions(userId) {
  if (!canSyncWithSupabase() || !userId) return { transactions: [], newCount: 0 };

  try {
    const { data: remoteTxs, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !remoteTxs) {
      console.warn('[supabaseSync] Error fetching inbound transactions:', error?.message);
      return { transactions: [], newCount: 0 };
    }

    const db = await getDB();
    let newCount = 0;

    for (const rtx of remoteTxs) {
      const txId = rtx.id || rtx.transaction_ref;
      const existing = await db.get('transactions', txId);

      const mappedTx = {
        id: txId,
        transactionRef: rtx.transaction_ref || txId,
        senderId: rtx.sender_id,
        senderName: rtx.sender_name || (rtx.sender_id === userId ? 'You' : 'Sender'),
        receiverId: rtx.receiver_id,
        receiverName: rtx.receiver_name || (rtx.receiver_id === userId ? 'You' : 'Receiver'),
        amount: Number(rtx.amount),
        currency: 'NPR',
        status: rtx.status || 'SETTLED',
        method: rtx.payment_type || 'ONLINE',
        timestamp: rtx.created_at || new Date().toISOString(),
        settledAt: rtx.settled_at || rtx.created_at || new Date().toISOString(),
        nonce: rtx.nonce || null,
        note: rtx.payload?.note || '',
        signature: rtx.signature || null,
        isOffline: rtx.payment_type === 'OFFLINE_QR',
        updatedAt: rtx.settled_at || rtx.created_at || new Date().toISOString(),
      };

      if (!existing) {
        await db.put('transactions', mappedTx);
        newCount++;
      } else if (existing.status !== mappedTx.status || (!existing.settledAt && mappedTx.settledAt)) {
        await db.put('transactions', { ...existing, ...mappedTx });
        newCount++;
      }
    }

    return { transactions: remoteTxs, newCount };
  } catch (err) {
    console.warn('[supabaseSync] Exception during inbound transaction sync:', err);
    return { transactions: [], newCount: 0 };
  }
}

/**
 * Subscribe to Supabase Realtime changes on wallets and transactions
 * Returns cleanup function to unsubscribe.
 */
export function subscribeToUserWalletAndTransactions(userId, onWalletUpdate, onTransactionReceived) {
  if (!canSyncWithSupabase() || !userId) return () => {};

  try {
    const channelId = `user-sync-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && onWalletUpdate) {
            onWalletUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && onTransactionReceived) {
            onTransactionReceived(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && onTransactionReceived) {
            onTransactionReceived(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[supabaseSync] Realtime channel error for user:', userId);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  } catch (err) {
    console.warn('[supabaseSync] Could not initialize realtime subscription:', err);
    return () => {};
  }
}

