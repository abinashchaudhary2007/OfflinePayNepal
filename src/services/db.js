/**
 * db.js — IndexedDB wrapper using `idb`
 * Stores: wallet, devices, transactions, authorizations, sync_queue, security_events
 * 
 * DEMO SYSTEM — simulated money only.
 */
import { openDB } from 'idb';

const DB_NAME    = 'offlinepay-nepal';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
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

// ─── Wallet ───────────────────────────────────
export async function saveWallet(wallet) {
  const db = await getDB();
  await db.put('wallet', wallet);
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
  const all = await db.getAll('wallet');
  return all.find(w => w.userId === userId) || null;
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
