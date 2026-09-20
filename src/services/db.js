/**
 * db.js — IndexedDB wrapper using `idb`
 * Stores: wallet, devices, transactions, authorizations, sync_queue, security_events
 * 
 * DEMO SYSTEM — simulated money only.
 */
import { openDB } from 'idb';
import { DEMO_USERS } from '../data/mockData';

const DB_NAME    = 'offlinepay-nepal';
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: false });
        }
        // Wallet store
        if (!db.objectStoreNames.contains('wallet')) {
          db.createObjectStore('wallet', { keyPath: 'id' });
        }
        // Devices
        if (!db.objectStoreNames.contains('devices')) {
          const devStore = db.createObjectStore('devices', { keyPath: 'id' });
          devStore.createIndex('userId', 'userId', { unique: false });
        }
        // Transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('senderId', 'senderId', { unique: false });
          txStore.createIndex('receiverId', 'receiverId', { unique: false });
          txStore.createIndex('status', 'status', { unique: false });
        }
        // Offline authorizations
        if (!db.objectStoreNames.contains('authorizations')) {
          const authStore = db.createObjectStore('authorizations', { keyPath: 'id' });
          authStore.createIndex('deviceId', 'deviceId', { unique: false });
        }
        // Sync queue — pending items to sync when online
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
        }
        // Security events
        if (!db.objectStoreNames.contains('security_events')) {
          const secStore = db.createObjectStore('security_events', { keyPath: 'id' });
          secStore.createIndex('userId', 'userId', { unique: false });
          secStore.createIndex('deviceId', 'deviceId', { unique: false });
        }
        // Nonce registry — for replay detection
        if (!db.objectStoreNames.contains('nonces')) {
          db.createObjectStore('nonces', { keyPath: 'nonce' });
        }
        // Key material — stores encrypted/wrapped CryptoKey objects
        if (!db.objectStoreNames.contains('key_material')) {
          db.createObjectStore('key_material', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Seed Data ─────────────────────────────────
let seedPromise = null;
export async function initSeedData() {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const db = await getDB();
        const existingUsers = await db.getAll('users');
        if (existingUsers.length === 0) {
          const tx = db.transaction(['users', 'wallet'], 'readwrite');
          for (const user of DEMO_USERS) {
            await tx.objectStore('users').put(user);
            if (user.wallet) {
              const existingWallet = await tx.objectStore('wallet').get(user.wallet.id);
              if (!existingWallet) {
                await tx.objectStore('wallet').put({
                  ...user.wallet,
                  userId: user.id,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          }
          await tx.done;
        }
      } catch (err) {
        console.warn('[db] Seed data initialization warning:', err);
      }
    })();
  }
  return seedPromise;
}

// ─── Users ─────────────────────────────────────
export async function saveUser(user) {
  const db = await getDB();
  await initSeedData();
  await db.put('users', user);

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    import('./supabaseSync.js').then(({ pushProfileToSupabase }) => {
      pushProfileToSupabase(user).catch(() => {});
    }).catch(() => {});
  }
}

export async function getUser(id) {
  const db = await getDB();
  await initSeedData();
  return db.get('users', id);
}

export async function getUserByEmail(email) {
  const db = await getDB();
  await initSeedData();
  const all = await db.getAll('users');
  return all.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
}

export async function getAllUsers() {
  const db = await getDB();
  await initSeedData();
  const users = await db.getAll('users');

  // Opportunistically sync remote Supabase profiles in background if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    import('./supabaseSync.js').then(({ syncProfilesFromSupabase }) => {
      syncProfilesFromSupabase().catch(() => {});
    }).catch(() => {});
  }

  return users;
}

// ─── Wallet ───────────────────────────────────
export async function saveWallet(wallet) {
  const db = await getDB();
  await db.put('wallet', wallet);

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    import('./supabaseSync.js').then(({ pushWalletToSupabase }) => {
      pushWalletToSupabase(wallet).catch(() => {});
    }).catch(() => {});
  }
}

export async function getWallet(id) {
  const db = await getDB();
  return db.get('wallet', id);
}

export async function getAllWallets() {
  const db = await getDB();
  return db.getAll('wallet');
}

export async function getWalletByUserId(userId) {
  const db = await getDB();
  await initSeedData();
  const all = await db.getAll('wallet');
  const found = all.find(w => w.userId === userId);
  if (found) return found;

  // Fallback to checking users store if wallet not yet materialized
  const user = await getUser(userId);
  if (user?.wallet) {
    const initialWallet = {
      ...user.wallet,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('wallet', initialWallet);
    return initialWallet;
  }
  return null;
}

// ─── Devices ──────────────────────────────────
export async function saveDevice(device) {
  const db = await getDB();
  await db.put('devices', device);
}

export async function getDevicesByUser(userId) {
  const db = await getDB();
  return db.getAllFromIndex('devices', 'userId', userId);
}

export async function getDevice(deviceId) {
  const db = await getDB();
  return db.get('devices', deviceId);
}

// ─── Transactions ──────────────────────────────
export async function saveTransaction(tx) {
  const db = await getDB();
  await db.put('transactions', tx);

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    import('../lib/supabase.js').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured() && supabase) {
        supabase.from('transactions').upsert({
          id: tx.id,
          transaction_ref: tx.transactionRef || tx.id,
          sender_id: tx.senderId,
          sender_name: tx.senderName || '',
          receiver_id: tx.receiverId,
          receiver_name: tx.receiverName || '',
          amount: tx.amount,
          type: tx.type || 'PAYMENT',
          payment_type: tx.paymentType || 'OFFLINE_QR',
          status: tx.status || 'SETTLED',
          signature: tx.signature || null,
          nonce: tx.nonce || null,
          sequence_counter: tx.sequenceCounter || 0,
          offline_auth_id: tx.offlineAuthId || null,
          payload: tx,
          settled_at: tx.settledAt || new Date().toISOString(),
          created_at: tx.timestamp || new Date().toISOString()
        }, { onConflict: 'id' }).then(() => {}).catch(() => {});
      }
    }).catch(() => {});
  }
}

export async function getTransaction(id) {
  const db = await getDB();
  return db.get('transactions', id);
}

export async function getAllTransactions() {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function getTransactionsByUser(userId) {
  const db = await getDB();
  const sent = await db.getAllFromIndex('transactions', 'senderId', userId);
  const received = await db.getAllFromIndex('transactions', 'receiverId', userId);
  const all = [...sent, ...received];
  // deduplicate
  const seen = new Set();
  return all.filter(tx => {
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function updateTransactionStatus(id, status, extra = {}) {
  const db = await getDB();
  const tx = await db.get('transactions', id);
  if (tx) {
    await db.put('transactions', { ...tx, status, ...extra, updatedAt: new Date().toISOString() });
  }
}

// ─── Authorizations ────────────────────────────
export async function saveAuthorization(auth) {
  const db = await getDB();
  await db.put('authorizations', auth);
}

export async function getActiveAuthorization(deviceId) {
  const db = await getDB();
  const auths = await db.getAllFromIndex('authorizations', 'deviceId', deviceId);
  const now = new Date();
  return auths.find(a => a.status === 'ACTIVE' && new Date(a.expiresAt) > now) || null;
}

export async function updateAuthorization(authId, updates) {
  const db = await getDB();
  const auth = await db.get('authorizations', authId);
  if (auth) await db.put('authorizations', { ...auth, ...updates });
}

// ─── Sync Queue ───────────────────────────────
export async function addToSyncQueue(item) {
  const db = await getDB();
  await db.put('sync_queue', item);
}

export async function getPendingSyncItems() {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'status', 'PENDING');
}

export async function updateSyncItem(id, updates) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) await db.put('sync_queue', { ...item, ...updates });
}

export async function removeSyncItem(id) {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

// ─── Security Events ──────────────────────────
export async function saveSecurityEvent(event) {
  const db = await getDB();
  await db.put('security_events', event);
}

export async function getSecurityEvents(userId) {
  const db = await getDB();
  if (userId) return db.getAllFromIndex('security_events', 'userId', userId);
  return db.getAll('security_events');
}

// ─── Nonce Registry ───────────────────────────
export async function checkAndSaveNonce(nonce) {
  const db = await getDB();
  const existing = await db.get('nonces', nonce);
  if (existing) return false; // already used
  await db.put('nonces', { nonce, usedAt: new Date().toISOString() });
  return true; // new nonce, OK
}

// ─── Key Material ─────────────────────────────
export async function saveKeyMaterial(deviceId, material) {
  const db = await getDB();
  await db.put('key_material', { id: deviceId, ...material });
}

export async function getKeyMaterial(deviceId) {
  const db = await getDB();
  return db.get('key_material', deviceId);
}

// ─── Atomic Multi-Store Operations ─────────────

/**
 * executeAtomicOnlinePayment
 * Atomically validates sender balance, debits sender, credits receiver,
 * saves settled transaction, and registers nonce in a single readwrite transaction.
 */
export async function executeAtomicOnlinePayment({
  senderId,
  receiverId,
  amount,
  transaction,
  securityEvent = null,
}) {
  const db = await getDB();
  await initSeedData();

  const idbTx = db.transaction(['wallet', 'transactions', 'nonces', 'security_events', 'users'], 'readwrite');

  // 1. Replay prevention check
  const nonceStore = idbTx.objectStore('nonces');
  const existingNonce = await nonceStore.get(transaction.nonce);
  if (existingNonce) {
    idbTx.abort();
    throw new Error('Replay protection check failed: nonce already used.');
  }
  await nonceStore.put({ nonce: transaction.nonce, usedAt: new Date().toISOString() });

  // 2. Load sender wallet
  const walletStore = idbTx.objectStore('wallet');
  const allWallets = await walletStore.getAll();
  let senderWallet = allWallets.find(w => w.userId === senderId);
  if (!senderWallet) {
    const senderUser = await idbTx.objectStore('users').get(senderId);
    if (senderUser?.wallet) {
      senderWallet = {
        ...senderUser.wallet,
        userId: senderId,
        updatedAt: new Date().toISOString(),
      };
      await walletStore.put(senderWallet);
    } else {
      idbTx.abort();
      throw new Error('Sender wallet not found.');
    }
  }

  // 3. Amount & balance validation
  const parsedAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    idbTx.abort();
    throw new Error('Invalid payment amount. Must be greater than 0.');
  }
  if (senderWallet.availableBalance < parsedAmount) {
    idbTx.abort();
    throw new Error('Insufficient balance.');
  }

  // 4. Load or initialize receiver wallet
  let receiverWallet = allWallets.find(w => w.userId === receiverId);
  if (!receiverWallet) {
    const receiverUser = await idbTx.objectStore('users').get(receiverId);
    receiverWallet = {
      id: receiverUser?.wallet?.id || `wallet-${receiverId}`,
      userId: receiverId,
      availableBalance: receiverUser?.wallet?.availableBalance || 0,
      offlineLimit: 0,
      offlineSpent: 0,
      offlineRemaining: 0,
      currency: 'NPR',
      totalReceived: 0,
      totalSent: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // 5. Atomic Debit & Credit
  const updatedSenderWallet = {
    ...senderWallet,
    availableBalance: Math.round((senderWallet.availableBalance - parsedAmount) * 100) / 100,
    totalSent: Math.round(((senderWallet.totalSent || 0) + parsedAmount) * 100) / 100,
    updatedAt: transaction.timestamp,
  };
  await walletStore.put(updatedSenderWallet);

  const updatedReceiverWallet = {
    ...receiverWallet,
    availableBalance: Math.round((receiverWallet.availableBalance + parsedAmount) * 100) / 100,
    totalReceived: Math.round(((receiverWallet.totalReceived || 0) + parsedAmount) * 100) / 100,
    updatedAt: transaction.timestamp,
  };
  await walletStore.put(updatedReceiverWallet);

  // 6. Save settled transaction
  await idbTx.objectStore('transactions').put(transaction);

  // 7. Save security audit event
  if (securityEvent) {
    await idbTx.objectStore('security_events').put(securityEvent);
  }

  await idbTx.done;
  return { updatedSenderWallet, updatedReceiverWallet };
}

/**
 * executeAtomicOfflineCreation
 * Atomically validates sender balance, debits spendable availableBalance,
 * updates offlineSpent & offlineRemaining, decrements authorization remaining,
 * advances device counter, saves OFFLINE_PENDING transaction, and queues sync.
 */
export async function executeAtomicOfflineCreation({
  senderId,
  amount,
  transaction,
  authorization,
  device = null,
}) {
  const db = await getDB();
  await initSeedData();

  const idbTx = db.transaction(['wallet', 'authorizations', 'devices', 'transactions', 'sync_queue', 'users'], 'readwrite');

  const walletStore = idbTx.objectStore('wallet');
  const allWallets = await walletStore.getAll();
  let senderWallet = allWallets.find(w => w.userId === senderId);
  if (!senderWallet) {
    const senderUser = await idbTx.objectStore('users').get(senderId);
    if (senderUser?.wallet) {
      senderWallet = {
        ...senderUser.wallet,
        userId: senderId,
        updatedAt: new Date().toISOString(),
      };
      await walletStore.put(senderWallet);
    } else {
      idbTx.abort();
      throw new Error('Sender wallet not found.');
    }
  }

  const parsedAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    idbTx.abort();
    throw new Error('Amount must be greater than 0.');
  }
  if (senderWallet.availableBalance < parsedAmount) {
    idbTx.abort();
    throw new Error('Insufficient balance.');
  }

  // Update sender wallet: debit spendable balance and reflect offline spending
  const updatedSenderWallet = {
    ...senderWallet,
    availableBalance: Math.round((senderWallet.availableBalance - parsedAmount) * 100) / 100,
    offlineSpent: Math.round(((senderWallet.offlineSpent || 0) + parsedAmount) * 100) / 100,
    offlineRemaining: Math.round((authorization.remainingAmount - parsedAmount) * 100) / 100,
    totalSent: Math.round(((senderWallet.totalSent || 0) + parsedAmount) * 100) / 100,
    updatedAt: transaction.timestamp,
  };
  await walletStore.put(updatedSenderWallet);

  // Update authorization remaining
  const updatedAuth = {
    ...authorization,
    remainingAmount: Math.round((authorization.remainingAmount - parsedAmount) * 100) / 100,
    updatedAt: transaction.timestamp,
  };
  await idbTx.objectStore('authorizations').put(updatedAuth);

  // Update device counter
  if (device) {
    await idbTx.objectStore('devices').put(device);
  }

  // Save transaction (OFFLINE_PENDING)
  await idbTx.objectStore('transactions').put(transaction);

  // Add to sync queue
  await idbTx.objectStore('sync_queue').put({
    id: transaction.id,
    type: 'TRANSACTION',
    status: 'PENDING',
    transactionId: transaction.id,
    attempts: 0,
    createdAt: transaction.timestamp,
  });

  await idbTx.done;
  return { updatedSenderWallet, updatedAuth };
}

/**
 * executeAtomicOfflineAcceptance
 * Atomically credits receiver wallet and saves accepted OFFLINE_PENDING transaction.
 */
export async function executeAtomicOfflineAcceptance({
  receiverId,
  transaction,
}) {
  const db = await getDB();
  await initSeedData();

  const idbTx = db.transaction(['wallet', 'transactions', 'users'], 'readwrite');

  const walletStore = idbTx.objectStore('wallet');
  const allWallets = await walletStore.getAll();
  let receiverWallet = allWallets.find(w => w.userId === receiverId);
  if (!receiverWallet) {
    const receiverUser = await idbTx.objectStore('users').get(receiverId);
    receiverWallet = {
      id: receiverUser?.wallet?.id || `wallet-${receiverId}`,
      userId: receiverId,
      availableBalance: receiverUser?.wallet?.availableBalance || 0,
      offlineLimit: 0,
      offlineSpent: 0,
      offlineRemaining: 0,
      currency: 'NPR',
      totalReceived: 0,
      totalSent: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const parsedAmount = Math.round(Number(transaction.amount) * 100) / 100;
  const updatedReceiverWallet = {
    ...receiverWallet,
    availableBalance: Math.round((receiverWallet.availableBalance + parsedAmount) * 100) / 100,
    totalReceived: Math.round(((receiverWallet.totalReceived || 0) + parsedAmount) * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
  await walletStore.put(updatedReceiverWallet);

  // Save transaction as OFFLINE_PENDING
  await idbTx.objectStore('transactions').put(transaction);

  await idbTx.done;
  return updatedReceiverWallet;
}
