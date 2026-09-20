/**
 * WalletContext.jsx — Central wallet + transaction state manager.
 * 
 * This replaces the static mock data with real reactive state backed
 * by IndexedDB for persistence.
 * 
 * DEMO SYSTEM — Simulated money only.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, useRef
} from 'react';
import {
  getWallet, saveWallet, getWalletByUserId,
  saveTransaction, getTransactionsByUser, getTransaction, updateTransactionStatus,
  saveDevice, getDevicesByUser, getDevice,
  saveAuthorization, getActiveAuthorization, updateAuthorization,
  getPendingSyncItems, addToSyncQueue, updateSyncItem, removeSyncItem,
  getSecurityEvents, saveSecurityEvent, checkAndSaveNonce,
  executeAtomicOnlinePayment, executeAtomicOfflineCreation, executeAtomicOfflineAcceptance,
  getAllUsers, getUser,
} from '../services/db';
import {
  generateDeviceKeyPair, loadDeviceKeys, signTransaction,
  generateNonce, generateTransactionId, generateDeviceId,
} from '../services/crypto';
import {
  TX_STATUS, verifyTransaction, settleTransaction,
  buildSignablePayload, logSecurityEvent, checkDoubleSpend,
} from '../services/ledger';
import { DEMO_USERS } from '../data/mockData';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  // ─── State ──────────────────────────────────────────────
  const [wallet, setWallet]               = useState(null);
  const [transactions, setTransactions]   = useState([]);
  const [device, setDevice]               = useState(null);
  const [authorization, setAuthorization] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [syncStatus, setSyncStatus]       = useState('idle'); // idle | syncing | done | error
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentUserIdRef = useRef(null);

  // ─── Initialize wallet for a user ───────────────────────
  const initWallet = useCallback(async (user) => {
    if (!user) return;
    currentUserIdRef.current = user.id;

    // Try to load from IndexedDB first
    let storedWallet = await getWallet(user.wallet.id);

    if (!storedWallet) {
      // First time — seed from mock data
      storedWallet = {
        ...user.wallet,
        userId: user.id,
        updatedAt: new Date().toISOString(),
      };
      await saveWallet(storedWallet);
    }
    setWallet(storedWallet);

    // Load transactions
    const txs = await getTransactionsByUser(user.id);
    if (txs.length === 0) {
      // Seed mock transactions for demo users
      await seedDemoTransactions(user.id);
      const seeded = await getTransactionsByUser(user.id);
      setTransactions(seeded);
    } else {
      setTransactions(txs);
    }

    // Load device
    const devices = await getDevicesByUser(user.id);
    const activeDevice = devices.find(d => d.status === 'ACTIVE') || null;
    setDevice(activeDevice);

    // Load authorization
    if (activeDevice) {
      const auth = await getActiveAuthorization(activeDevice.id);
      setAuthorization(auth);
    }

    // Load security events
    const events = await getSecurityEvents(user.id);
    setSecurityEvents(events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    // Count pending sync items
    const pending = await getPendingSyncItems();
    setPendingSyncCount(pending.length);

    setIsInitialized(true);
  }, []);

  // ─── Reset on logout ─────────────────────────────────────
  const resetWallet = useCallback(() => {
    currentUserIdRef.current = null;
    setWallet(null);
    setTransactions([]);
    setDevice(null);
    setAuthorization(null);
    setSecurityEvents([]);
    setSyncStatus('idle');
    setPendingSyncCount(0);
    setIsInitialized(false);
  }, []);

  // ─── Refresh transactions from DB ────────────────────────
  const refreshTransactions = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const txs = await getTransactionsByUser(userId);
    setTransactions(txs);
  }, []);

  // ─── Refresh security events ─────────────────────────────
  const refreshSecurityEvents = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const events = await getSecurityEvents(userId);
    setSecurityEvents(events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  // ─── Register Device ─────────────────────────────────────
  const registerDevice = useCallback(async (userId) => {
    const deviceId = generateDeviceId();

    // Generate crypto key pair
    const { publicKeyJwk } = await generateDeviceKeyPair(deviceId);

    const newDevice = {
      id: deviceId,
      userId,
      publicKeyJwk,
      status: 'ACTIVE',
      algorithm: 'P-256',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      transactionCounter: 0,
      offlineLimit: 1000.00,
      offlineSpent: 0,
    };

    await saveDevice(newDevice);
    setDevice(newDevice);

    // Log event
    await logSecurityEvent({
      userId,
      deviceId,
      eventType: 'DEVICE_REGISTERED',
      severity: 'LOW',
      description: `Device ${deviceId} registered with P-256 key`,
      status: 'LOGGED',
    });
    await refreshSecurityEvents();

    return newDevice;
  }, [refreshSecurityEvents]);

  // ─── Create Offline Authorization ────────────────────────
  const createOfflineAuthorization = useCallback(async (userId, deviceId, amount = 1000, maxSingle = 500) => {
    if (!wallet) throw new Error('Wallet not loaded');
    if (wallet.availableBalance < amount) throw new Error('Insufficient balance for authorization');

    const auth = {
      id: `AUTH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      userId,
      deviceId,
      maximumAmount: amount,
      remainingAmount: amount,
      currency: 'NPR',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      maxSingleTransaction: maxSingle,
      status: 'ACTIVE',
      nonce: generateNonce(),
    };

    await saveAuthorization(auth);
    setAuthorization(auth);

    // Reserve amount from wallet (held, not spent)
    const updatedWallet = {
      ...wallet,
      offlineLimit: amount,
      offlineRemaining: amount,
      offlineSpent: 0,
      updatedAt: new Date().toISOString(),
    };
    await saveWallet(updatedWallet);
    setWallet(updatedWallet);

    // Log
    await logSecurityEvent({
      userId,
      deviceId,
      eventType: 'OFFLINE_AUTH_CREATED',
      severity: 'LOW',
      description: `Offline authorization created: Rs. ${amount} limit for 24 hours`,
      status: 'LOGGED',
    });
    await refreshSecurityEvents();

    return auth;
  }, [wallet, refreshSecurityEvents]);

  // ─── Create & Sign Offline Transaction ───────────────────
  const createOfflineTransaction = useCallback(async ({
    senderId, senderName, receiverId, receiverName,
    amount, note = '', deviceId, authorizationId, counter,
  }) => {
    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Amount must be greater than 0');
    if (senderId === receiverId) throw new Error('Sender and receiver cannot be the same account.');
    if (!authorization) throw new Error('No active offline authorization');
    if (authorization.status !== 'ACTIVE') throw new Error('Authorization is not active');
    if (new Date(authorization.expiresAt) < new Date()) throw new Error('Authorization has expired');
    if (parsedAmount > authorization.remainingAmount) {
      throw new Error(`Amount exceeds offline limit. Remaining: Rs. ${authorization.remainingAmount}`);
    }
    if (parsedAmount > authorization.maxSingleTransaction) {
      throw new Error(`Amount exceeds max single transaction limit of Rs. ${authorization.maxSingleTransaction}`);
    }

    // Double-spend check against pending offline records
    const ds = await checkDoubleSpend(senderId, deviceId, parsedAmount, authorization.remainingAmount);
    if (ds.detected) throw new Error(`Double-spend detected. Pending offline: Rs. ${ds.pendingAmount}`);

    // Load actual persistent sender wallet
    const actualSenderWallet = await getWalletByUserId(senderId);
    if (!actualSenderWallet) throw new Error('Sender wallet not found');
    if (actualSenderWallet.availableBalance < parsedAmount) {
      throw new Error('Insufficient balance.');
    }

    const txId = generateTransactionId();
    const nonce = generateNonce();
    const timestamp = new Date().toISOString();

    // Build canonical signable payload
    const payload = buildSignablePayload({
      id: txId,
      senderId,
      receiverId,
      amount: parsedAmount,
      currency: 'NPR',
      timestamp,
      nonce,
      counter,
      authorizationId,
      deviceId,
    });

    // Sign with P-256 device key
    let signature = 'DEMO_SIG';
    try {
      signature = await signTransaction(deviceId, payload);
    } catch (e) {
      console.warn('[wallet] Could not sign — using demo signature:', e.message);
    }

    const sanitizedNote = typeof note === 'string' ? note.slice(0, 140).trim() : '';
    const tx = {
      id: txId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      amount: parsedAmount,
      currency: 'NPR',
      status: TX_STATUS.OFFLINE_PENDING,
      method: 'OFFLINE_QR',
      deviceId,
      senderPublicKeyJwk: device?.publicKeyJwk || null,
      nonce,
      counter,
      timestamp,
      settledAt: null,
      authorizationId,
      signature,
      note: sanitizedNote,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updatedDevice = device ? {
      ...device,
      transactionCounter: counter,
      lastSeen: timestamp,
    } : null;

    // Atomically debit sender wallet, update authorization, save transaction, and queue sync
    const { updatedSenderWallet, updatedAuth } = await executeAtomicOfflineCreation({
      senderId,
      amount: parsedAmount,
      transaction: tx,
      authorization,
      device: updatedDevice,
    });

    setWallet(updatedSenderWallet);
    setAuthorization(updatedAuth);
    if (updatedDevice) setDevice(updatedDevice);
    setPendingSyncCount(c => c + 1);

    await refreshTransactions();
    return tx;
  }, [authorization, device, refreshTransactions]);

  // ─── Create & Settle Online Transaction ──────────────────
  const createOnlineTransaction = useCallback(async ({
    senderId, senderName, receiverId, receiverName,
    amount, note = '', deviceId = null,
  }) => {
    // 1. Strict amount and account validation
    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid payment amount. Must be greater than 0.');
    }
    if (senderId === receiverId) {
      throw new Error('Sender and receiver cannot be the same account.');
    }

    // 2. Load persistent sender wallet and validate balance
    const actualSenderWallet = await getWalletByUserId(senderId);
    if (!actualSenderWallet) {
      throw new Error('Sender wallet not found.');
    }
    if (actualSenderWallet.availableBalance < parsedAmount) {
      throw new Error('Insufficient balance.');
    }

    // 3. Cryptographic identifier generation
    const txId = generateTransactionId();
    const nonce = generateNonce();
    const timestamp = new Date().toISOString();
    const newCounter = (device?.transactionCounter || 0) + 1;

    const sanitizedNote = typeof note === 'string' ? note.slice(0, 140).trim() : '';
    const tx = {
      id: txId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      amount: parsedAmount,
      currency: 'NPR',
      status: TX_STATUS.SETTLED,
      method: 'ONLINE',
      deviceId: deviceId || device?.id || null,
      nonce,
      counter: newCounter,
      timestamp,
      settledAt: timestamp,
      authorizationId: null,
      signature: null,
      note: sanitizedNote,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const secEvent = {
      id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      userId: senderId,
      deviceId: deviceId || device?.id || 'ONLINE',
      eventType: 'ONLINE_PAYMENT_SETTLED',
      severity: 'LOW',
      description: `Online transfer of Rs. ${parsedAmount} to ${receiverName} settled`,
      status: 'SETTLED',
      relatedTxId: txId,
      createdAt: timestamp,
    };

    // 4. Atomically debit sender and credit receiver in IndexedDB
    const { updatedSenderWallet } = await executeAtomicOnlinePayment({
      senderId,
      receiverId,
      amount: parsedAmount,
      transaction: tx,
      securityEvent: secEvent,
    });

    setWallet(updatedSenderWallet);

    // 5. Advance device transaction counter
    if (device) {
      const updatedDevice = {
        ...device,
        transactionCounter: newCounter,
        lastSeen: timestamp,
      };
      await saveDevice(updatedDevice);
      setDevice(updatedDevice);
    }

    await refreshTransactions();
    await refreshSecurityEvents();

    return tx;
  }, [device, refreshTransactions, refreshSecurityEvents]);

  // ─── Accept Incoming Offline Payment (Receiver) ──────────
  const acceptIncomingPayment = useCallback(async (incomingTx) => {
    const tx = {
      ...incomingTx,
      status: TX_STATUS.OFFLINE_PENDING,
      updatedAt: new Date().toISOString(),
    };

    // Atomically credit receiver wallet in IndexedDB and save transaction
    const updatedReceiverWallet = await executeAtomicOfflineAcceptance({
      receiverId: incomingTx.receiverId,
      transaction: tx,
    });

    setWallet(updatedReceiverWallet);
    await refreshTransactions();

    return tx;
  }, [refreshTransactions]);

  // ─── Synchronization Engine ──────────────────────────────
  const syncTransactions = useCallback(async (currentUser) => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');

    try {
      const pending = await getPendingSyncItems();
      let settled = 0;
      let rejected = 0;

      for (const item of pending) {
        if (item.type !== 'TRANSACTION') continue;

        // Mark as syncing
        await updateSyncItem(item.id, { status: 'SYNCING', attempts: (item.attempts || 0) + 1 });
        await updateTransactionStatus(item.transactionId, TX_STATUS.SYNCING);

        const tx = await getTransaction(item.transactionId);
        if (!tx) {
          await removeSyncItem(item.id);
          continue;
        }

        // Idempotency: if already settled, remove and continue
        if (tx.status === TX_STATUS.SETTLED) {
          await removeSyncItem(item.id);
          settled++;
          continue;
        }

        // Load sender's public key for verification
        let senderPublicKey = null;
        const senderKeys = await loadDeviceKeys(tx.deviceId);
        if (senderKeys) senderPublicKey = senderKeys.publicKeyJwk;

        // Load device for counter check
        const txDevice = await getDevice(tx.deviceId);
        const expectedCounter = txDevice ? txDevice.transactionCounter : undefined;

        // Run verification
        const result = await verifyTransaction(tx, senderPublicKey, expectedCounter);

        if (result.valid) {
          // Mark transaction SETTLED
          await updateTransactionStatus(tx.id, TX_STATUS.SETTLED, {
            settledAt: new Date().toISOString(),
            syncedAt: new Date().toISOString(),
          });

          // Note: Sender was debited upon creation, receiver credited upon acceptance.
          // No duplicate deduction or addition is made here to maintain money conservation.

          // Update device counter
          if (txDevice && tx.counter) {
            const updDev = { ...txDevice, transactionCounter: Math.max(txDevice.transactionCounter, tx.counter) };
            await saveDevice(updDev);
            if (device?.id === txDevice.id) setDevice(updDev);
          }

          await removeSyncItem(item.id);
          settled++;
        } else {
          // Verification failed: mark REJECTED
          await updateTransactionStatus(tx.id, TX_STATUS.REJECTED, {
            rejectionReason: result.event,
            rejectedAt: new Date().toISOString(),
          });

          // Refund sender if sender is the one syncing
          if (tx.senderId === currentUser.id && wallet) {
            const refundedWallet = {
              ...wallet,
              availableBalance: Math.round(((wallet?.availableBalance || 0) + tx.amount) * 100) / 100,
              totalSent: Math.max(0, Math.round(((wallet?.totalSent || 0) - tx.amount) * 100) / 100),
              updatedAt: new Date().toISOString(),
            };
            await saveWallet(refundedWallet);
            setWallet(refundedWallet);
          }

          await removeSyncItem(item.id);
          rejected++;
        }
      }

      await refreshTransactions();
      await refreshSecurityEvents();

      const remaining = await getPendingSyncItems();
      setPendingSyncCount(remaining.length);

      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);

      return { settled, rejected };
    } catch (err) {
      console.error('[sync] Error:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      throw err;
    }
  }, [syncStatus, wallet, device, refreshTransactions, refreshSecurityEvents]);

  // ─── Revoke Device ───────────────────────────────────────
  const revokeDevice = useCallback(async (deviceId) => {
    const dev = await getDevice(deviceId);
    if (!dev) throw new Error('Device not found');

    const revoked = { ...dev, status: 'REVOKED', revokedAt: new Date().toISOString() };
    await saveDevice(revoked);

    if (device?.id === deviceId) setDevice(revoked);

    await logSecurityEvent({
      userId: dev.userId,
      deviceId,
      eventType: 'DEVICE_REVOKED',
      severity: 'MEDIUM',
      description: `Device ${deviceId} has been revoked`,
      status: 'LOGGED',
    });
    await refreshSecurityEvents();

    return revoked;
  }, [device, refreshSecurityEvents]);

  // ─── Context Value ───────────────────────────────────────
  return (
    <WalletContext.Provider value={{
      // State
      wallet,
      transactions,
      device,
      authorization,
      securityEvents,
      syncStatus,
      pendingSyncCount,
      isInitialized,

      // Actions
      initWallet,
      resetWallet,
      refreshTransactions,
      refreshSecurityEvents,
      registerDevice,
      createOfflineAuthorization,
      createOfflineTransaction,
      createOnlineTransaction,
      acceptIncomingPayment,
      syncTransactions,
      revokeDevice,

      // Helpers
      TX_STATUS,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}

// ─── Seed demo transactions for first-time users ─────────
async function seedDemoTransactions(userId) {
  const user = DEMO_USERS.find(u => u.id === userId);
  if (!user) return;

  // Seed transactions relevant to this user from mock data
  const { MOCK_TRANSACTIONS } = await import('../data/mockData');
  const relevant = MOCK_TRANSACTIONS.filter(tx => tx.senderId === userId || tx.receiverId === userId);

  for (const tx of relevant) {
    const existing = await getTransaction(tx.id);
    if (!existing) {
      await saveTransaction({
        ...tx,
        createdAt: tx.timestamp,
        updatedAt: tx.timestamp,
      });
    }
  }
}
