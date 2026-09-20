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
    if (!authorization) throw new Error('No active offline authorization');
    if (authorization.status !== 'ACTIVE') throw new Error('Authorization is not active');
    if (new Date(authorization.expiresAt) < new Date()) throw new Error('Authorization has expired');
    if (amount > authorization.remainingAmount) throw new Error(`Amount exceeds offline limit. Remaining: Rs. ${authorization.remainingAmount}`);
    if (amount > authorization.maxSingleTransaction) throw new Error(`Amount exceeds max single transaction limit of Rs. ${authorization.maxSingleTransaction}`);
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    // Double-spend check
    const ds = await checkDoubleSpend(senderId, deviceId, amount, authorization.remainingAmount);
    if (ds.detected) throw new Error(`Double-spend detected. Pending offline: Rs. ${ds.pendingAmount}`);

    const txId = generateTransactionId();
    const nonce = generateNonce();
    const timestamp = new Date().toISOString();

    // Build signable payload
    const payload = buildSignablePayload({
      id: txId,
      senderId,
      receiverId,
      amount,
      currency: 'NPR',
      timestamp,
      nonce,
      counter,
      authorizationId,
      deviceId,
    });

    // Sign
    let signature = 'DEMO_SIG';
    try {
      signature = await signTransaction(deviceId, payload);
    } catch (e) {
      console.warn('[wallet] Could not sign — using demo signature:', e.message);
    }

    const tx = {
      id: txId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      amount,
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
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to IndexedDB
    await saveTransaction(tx);

    // Update authorization remaining amount
    const updatedAuth = {
      ...authorization,
      remainingAmount: authorization.remainingAmount - amount,
      updatedAt: new Date().toISOString(),
    };
    await updateAuthorization(authorization.id, updatedAuth);
    setAuthorization(updatedAuth);

    // Update wallet offline spent
    const updatedWallet = {
      ...wallet,
      offlineSpent: (wallet.offlineSpent || 0) + amount,
      offlineRemaining: updatedAuth.remainingAmount,
      updatedAt: new Date().toISOString(),
    };
    await saveWallet(updatedWallet);
    setWallet(updatedWallet);

    // Update device counter
    if (device) {
      const updatedDevice = { ...device, transactionCounter: counter, lastSeen: new Date().toISOString() };
      await saveDevice(updatedDevice);
      setDevice(updatedDevice);
    }

    // Add to sync queue
    await addToSyncQueue({
      id: txId,
      type: 'TRANSACTION',
      status: 'PENDING',
      transactionId: txId,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });
    setPendingSyncCount(c => c + 1);

    // Refresh transactions list
    await refreshTransactions();

    return tx;
  }, [authorization, wallet, device, refreshTransactions]);

  // ─── Create & Settle Online Transaction ──────────────────
  const createOnlineTransaction = useCallback(async ({
    senderId, senderName, receiverId, receiverName,
    amount, note = '', deviceId = null,
  }) => {
    // 1. Strict validation
    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid payment amount. Must be greater than 0.');
    }
    if (!wallet) {
      throw new Error('Wallet not initialized. Please try again.');
    }
    if (wallet.availableBalance < parsedAmount) {
      throw new Error('Insufficient balance.');
    }
    if (senderId === receiverId) {
      throw new Error('Sender and receiver cannot be the same account.');
    }

    // 2. Generate transaction ID & cryptographic nonce
    const txId = generateTransactionId();
    const nonce = generateNonce();
    const timestamp = new Date().toISOString();

    // 3. Register nonce for replay prevention
    const nonceOk = await checkAndSaveNonce(nonce);
    if (!nonceOk) {
      throw new Error('Replay prevention check failed: nonce already used.');
    }

    // 4. Create settled transaction record
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
      counter: (device?.transactionCounter || 0) + 1,
      timestamp,
      settledAt: timestamp,
      authorizationId: null,
      signature: null,
      note: sanitizedNote,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // 5. Save transaction to persistent ledger
    await saveTransaction(tx);

    // 6. Deduct from sender's wallet balance
    const updatedSenderWallet = {
      ...wallet,
      availableBalance: Math.round((wallet.availableBalance - parsedAmount) * 100) / 100,
      totalSent: Math.round(((wallet.totalSent || 0) + parsedAmount) * 100) / 100,
      updatedAt: timestamp,
    };
    await saveWallet(updatedSenderWallet);
    setWallet(updatedSenderWallet);

    // 7. Credit receiver's wallet in local ledger if exists
    try {
      const receiverWallet = await getWalletByUserId(receiverId);
      if (receiverWallet) {
        const updatedReceiverWallet = {
          ...receiverWallet,
          availableBalance: Math.round((receiverWallet.availableBalance + parsedAmount) * 100) / 100,
          totalReceived: Math.round(((receiverWallet.totalReceived || 0) + parsedAmount) * 100) / 100,
          updatedAt: timestamp,
        };
        await saveWallet(updatedReceiverWallet);
      }
    } catch (err) {
      console.warn('[wallet] Could not credit local receiver wallet:', err);
    }

    // 8. Log security event for audit trail
    await logSecurityEvent({
      userId: senderId,
      deviceId: deviceId || device?.id || 'ONLINE',
      eventType: 'ONLINE_PAYMENT_SETTLED',
      severity: 'LOW',
      description: `Online transfer of Rs. ${parsedAmount} to ${receiverName} settled`,
      status: 'SETTLED',
      relatedTxId: txId,
    });

    // 9. Update transaction counter if device present
    if (device) {
      const updatedDevice = {
        ...device,
        transactionCounter: (device.transactionCounter || 0) + 1,
        lastSeen: timestamp,
      };
      await saveDevice(updatedDevice);
      setDevice(updatedDevice);
    }

    // 10. Refresh transaction and security lists
    await refreshTransactions();
    await refreshSecurityEvents();

    return tx;
  }, [wallet, device, refreshTransactions, refreshSecurityEvents]);

  // ─── Accept Incoming Offline Payment (Receiver) ──────────
  const acceptIncomingPayment = useCallback(async (incomingTx) => {
    // Store the received transaction as OFFLINE_PENDING
    const tx = {
      ...incomingTx,
      status: TX_STATUS.OFFLINE_PENDING,
      updatedAt: new Date().toISOString(),
    };
    await saveTransaction(tx);
    await refreshTransactions();

    // Update wallet balance (optimistically — will be confirmed on sync)
    const updatedWallet = {
      ...wallet,
      availableBalance: wallet.availableBalance + incomingTx.amount,
      totalReceived: (wallet.totalReceived || 0) + incomingTx.amount,
      updatedAt: new Date().toISOString(),
    };
    await saveWallet(updatedWallet);
    setWallet(updatedWallet);

    return tx;
  }, [wallet, refreshTransactions]);

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
          // Settle transaction
          await updateTransactionStatus(tx.id, TX_STATUS.SETTLED, {
            settledAt: new Date().toISOString(),
            syncedAt: new Date().toISOString(),
          });

          // Deduct from sender wallet
          if (tx.senderId === currentUser.id) {
            const updatedWallet = {
              ...wallet,
              availableBalance: Math.max(0, (wallet?.availableBalance || 0) - tx.amount),
              totalSent: (wallet?.totalSent || 0) + tx.amount,
              updatedAt: new Date().toISOString(),
            };
            await saveWallet(updatedWallet);
            setWallet(updatedWallet);
          }

          // Update device counter
          if (txDevice && tx.counter) {
            const updDev = { ...txDevice, transactionCounter: Math.max(txDevice.transactionCounter, tx.counter) };
            await saveDevice(updDev);
            if (device?.id === txDevice.id) setDevice(updDev);
          }

          await removeSyncItem(item.id);
          settled++;
        } else {
          await updateTransactionStatus(tx.id, TX_STATUS.REJECTED, {
            rejectionReason: result.event,
            rejectedAt: new Date().toISOString(),
          });
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
