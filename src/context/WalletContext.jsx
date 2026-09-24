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
  getPendingSyncItems, getAllSyncQueueItems, addToSyncQueue, updateSyncItem, removeSyncItem,
  getSecurityEvents, saveSecurityEvent, checkAndSaveNonce,
  executeAtomicOnlinePayment, executeAtomicOfflineCreation, executeAtomicOfflineAcceptance,
  cancelAndRefundExpiredTransactions,
  getAllUsers, getUser,
} from '../services/db';
import {
  generateDeviceKeyPair, loadDeviceKeys, signTransaction,
  generateNonce, generateTransactionId, generateDeviceId,
} from '../services/crypto';
import {
  TX_STATUS, verifyTransaction, settleTransaction,
  buildSignablePayload, logSecurityEvent, checkDoubleSpend,
  classifySyncError,
} from '../services/ledger';
import { verifyAndSettleOnServer } from '../services/serverVerifier';

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
  const [retryWaitingCount, setRetryWaitingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime]   = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentUserIdRef = useRef(null);
  const isSyncingRef = useRef(false);

  // ─── Initialize wallet for a user ───────────────────────
  const initWallet = useCallback(async (user) => {
    if (!user) return;
    currentUserIdRef.current = user.id;

    // Automatically cancel and refund any pending transactions that exceeded the 5-minute timeout
    try {
      await cancelAndRefundExpiredTransactions({ userId: user.id });
    } catch (e) {
      console.warn('[wallet] Error expiring transactions during init:', e);
    }

    // Load wallet by user ID with guaranteed 1000.00 initial deposit
    let storedWallet = await getWalletByUserId(user.id);

    if (!storedWallet) {
      storedWallet = {
        id: user.wallet?.id || `wallet-${user.id}`,
        userId: user.id,
        availableBalance: 1000.00,
        offlineLimit: 0,
        offlineSpent: 0,
        offlineRemaining: 0,
        currency: 'NPR',
        totalReceived: 1000.00,
        totalSent: 0,
        updatedAt: new Date().toISOString(),
      };
      await saveWallet(storedWallet);
    } else if (storedWallet.availableBalance === undefined || storedWallet.availableBalance === null) {
      storedWallet.availableBalance = 1000.00;
      storedWallet.totalReceived = Math.max(storedWallet.totalReceived || 0, 1000.00);
      await saveWallet(storedWallet);
    }
    setWallet(storedWallet);

    // Load transactions and guarantee visible welcome deposit transaction
    let txs = await getTransactionsByUser(user.id);
    if (!txs || txs.length === 0) {
      const initialDepositTx = {
        id: `TX-INIT-${user.id}`,
        senderId: 'SYSTEM',
        senderName: 'OfflinePay Nepal',
        receiverId: user.id,
        receiverName: user.name || 'User',
        amount: 1000.00,
        currency: 'NPR',
        status: TX_STATUS.SETTLED,
        method: 'ONLINE',
        timestamp: user.createdAt || new Date().toISOString(),
        settledAt: user.createdAt || new Date().toISOString(),
        note: 'Welcome Bonus · Initial Deposit',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.createdAt || new Date().toISOString(),
      };
      try {
        await saveTransaction(initialDepositTx);
        txs = [initialDepositTx];
      } catch (err) {
        console.warn('[wallet] Could not save initial deposit tx:', err);
      }
    }
    setTransactions(txs);

    // Load device or auto-register ECDSA P-256 key pair
    const devices = await getDevicesByUser(user.id);
    let activeDevice = devices.find(d => d.status === 'ACTIVE') || null;

    if (!activeDevice) {
      try {
        const deviceId = `DEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { publicKeyJwk } = await generateDeviceKeyPair(deviceId);
        activeDevice = {
          id: deviceId,
          userId: user.id,
          publicKeyJwk,
          status: 'ACTIVE',
          algorithm: 'P-256',
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          transactionCounter: 0,
          offlineLimit: 1000.00,
          offlineSpent: 0,
        };
        await saveDevice(activeDevice);
        await logSecurityEvent({
          userId: user.id,
          deviceId,
          eventType: 'DEVICE_REGISTERED',
          severity: 'LOW',
          description: `Device ${deviceId} auto-registered with ECDSA P-256 key pair`,
          status: 'LOGGED',
        });
      } catch (err) {
        console.warn('[wallet] Auto device registration failed:', err);
      }
    }
    setDevice(activeDevice);

    // Load authorization or auto-provision 30-day authorization
    if (activeDevice) {
      let auth = await getActiveAuthorization(activeDevice.id);
      if (!auth && storedWallet) {
        try {
          const authLimit = Math.min(storedWallet.availableBalance || 1000, 1000);
          const maxSingle = Math.min(authLimit, 500);
          auth = {
            id: `AUTH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            userId: user.id,
            deviceId: activeDevice.id,
            maximumAmount: authLimit,
            remainingAmount: authLimit,
            currency: 'NPR',
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            maxSingleTransaction: maxSingle,
            status: 'ACTIVE',
            nonce: generateNonce(),
          };
          await saveAuthorization(auth);

          storedWallet = {
            ...storedWallet,
            offlineLimit: authLimit,
            offlineRemaining: authLimit,
            offlineSpent: 0,
            updatedAt: new Date().toISOString(),
          };
          await saveWallet(storedWallet);
          setWallet(storedWallet);

          await logSecurityEvent({
            userId: user.id,
            deviceId: activeDevice.id,
            eventType: 'OFFLINE_AUTH_CREATED',
            severity: 'LOW',
            description: `Offline authorization auto-provisioned: Rs. ${authLimit} limit (valid for 30 days)`,
            status: 'LOGGED',
          });
        } catch (err) {
          console.warn('[wallet] Auto offline authorization failed:', err);
        }
      }
      setAuthorization(auth);
    }

    // Load security events
    const events = await getSecurityEvents(user.id);
    setSecurityEvents(events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    // Count pending and retry waiting sync items
    const allQueue = await getAllSyncQueueItems();
    setPendingSyncCount(allQueue.filter(i => i.status === 'PENDING').length);
    setRetryWaitingCount(allQueue.filter(i => i.status === 'RETRY_WAITING').length);

    // Reconcile with authoritative Supabase remote state when online (Phase 2)
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { fetchRemoteWallet, syncInboundTransactions, canSyncWithSupabase } = await import('../services/supabaseSync');
        if (canSyncWithSupabase()) {
          const remoteWallet = await fetchRemoteWallet(user.id);
          if (remoteWallet && remoteWallet.balance !== undefined) {
            storedWallet = {
              ...storedWallet,
              availableBalance: Number(remoteWallet.balance),
              offlineLimit: remoteWallet.offline_limit ?? storedWallet.offlineLimit,
              offlineReserve: remoteWallet.offline_reserve ?? storedWallet.offlineReserve,
              updatedAt: remoteWallet.updated_at || new Date().toISOString(),
            };
            await saveWallet(storedWallet);
            setWallet(storedWallet);
          }

          const { newCount } = await syncInboundTransactions(user.id);
          if (newCount > 0) {
            txs = await getTransactionsByUser(user.id);
            setTransactions(txs);
          }
        }
      } catch (syncErr) {
        console.warn('[wallet] Inbound reconciliation warning:', syncErr);
      }
    }

    setIsInitialized(true);
  }, []);

  // ─── Reset on logout ─────────────────────────────────────
  const resetWallet = useCallback(() => {
    currentUserIdRef.current = null;
    isSyncingRef.current = false;
    setWallet(null);
    setTransactions([]);
    setDevice(null);
    setAuthorization(null);
    setSecurityEvents([]);
    setSyncStatus('idle');
    setPendingSyncCount(0);
    setRetryWaitingCount(0);
    setLastSyncTime(null);
    setIsInitialized(false);
  }, []);

  // ─── Refresh transactions from DB ────────────────────────
  const refreshTransactions = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    try {
      const expRes = await cancelAndRefundExpiredTransactions({ userId });
      if (expRes?.expiredCount > 0 && expRes.updatedWallet) {
        setWallet(expRes.updatedWallet);
      }
    } catch (_) {}
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

  // ─── Sweep and cancel expired pending transactions ──────
  const expirePendingTransactions = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return { expiredCount: 0 };

    try {
      const res = await cancelAndRefundExpiredTransactions({ userId });
      if (res && res.expiredCount > 0) {
        if (res.updatedWallet) setWallet(res.updatedWallet);
        if (res.updatedAuth) setAuthorization(res.updatedAuth);

        const txs = await getTransactionsByUser(userId);
        setTransactions(txs);

        const allRemaining = await getAllSyncQueueItems();
        setPendingSyncCount(allRemaining.filter(i => i.status === 'PENDING').length);
        setRetryWaitingCount(allRemaining.filter(i => i.status === 'RETRY_WAITING').length);

        await refreshSecurityEvents();
      }
      return res;
    } catch (err) {
      console.warn('[wallet] Error expiring pending transactions:', err);
      return { expiredCount: 0 };
    }
  }, [refreshSecurityEvents]);

  // ─── Auto-expire pending payments older than 5 minutes ───
  useEffect(() => {
    if (!wallet?.userId) return;

    // Run sweep immediately
    expirePendingTransactions();

    const interval = setInterval(() => {
      expirePendingTransactions();
    }, 5000);

    return () => clearInterval(interval);
  }, [wallet?.userId, expirePendingTransactions]);

  // ─── Realtime Inbound Updates Listener (Phase 3) ─────────
  useEffect(() => {
    const userId = wallet?.userId;
    if (!userId || typeof navigator === 'undefined' || !navigator.onLine) return;

    let unsubscribe = () => {};

    import('../services/supabaseSync').then(({ subscribeToUserWalletAndTransactions, canSyncWithSupabase, syncInboundTransactions }) => {
      if (!canSyncWithSupabase()) return;

      unsubscribe = subscribeToUserWalletAndTransactions(
        userId,
        async (remoteWallet) => {
          if (remoteWallet && remoteWallet.balance !== undefined) {
            const currentLocal = await getWalletByUserId(userId);
            if (currentLocal) {
              const updated = {
                ...currentLocal,
                availableBalance: Number(remoteWallet.balance),
                offlineLimit: remoteWallet.offline_limit ?? currentLocal.offlineLimit,
                offlineReserve: remoteWallet.offline_reserve ?? currentLocal.offlineReserve,
                updatedAt: remoteWallet.updated_at || new Date().toISOString(),
              };
              await saveWallet(updated);
              setWallet(updated);
            }
          }
        },
        async () => {
          await syncInboundTransactions(userId);
          await refreshTransactions();
        }
      );
    }).catch(err => console.warn('[wallet] Realtime listener notice:', err));

    return () => {
      unsubscribe();
    };
  }, [wallet?.userId, refreshTransactions]);

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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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
      description: `Offline authorization created: Rs. ${amount} limit for 30 days`,
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
    let finalTx = {
      ...incomingTx,
      status: TX_STATUS.RECEIVER_ACKNOWLEDGED,
      receiverAcknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Atomically credit receiver wallet in IndexedDB, save transaction, and queue sync
    const updatedReceiverWallet = await executeAtomicOfflineAcceptance({
      receiverId: incomingTx.receiverId,
      transaction: finalTx,
    });

    setWallet(updatedReceiverWallet);

    // If online, immediately settle with backend / Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { executeRemoteAtomicTransfer, canSyncWithSupabase } = await import('../services/supabaseSync');
        if (canSyncWithSupabase()) {
          const remoteResult = await executeRemoteAtomicTransfer({
            senderId: incomingTx.senderId,
            receiverId: incomingTx.receiverId,
            amount: incomingTx.amount,
            txRef: incomingTx.id,
            senderName: incomingTx.senderName,
            receiverName: incomingTx.receiverName,
            note: incomingTx.note || 'Reconciled Offline Payment',
            nonce: incomingTx.nonce,
            paymentType: 'OFFLINE_QR',
          });

          if (remoteResult && remoteResult.success) {
            finalTx = {
              ...finalTx,
              status: TX_STATUS.SETTLED,
              settledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await updateTransactionStatus(finalTx.id, TX_STATUS.SETTLED, {
              settledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            await removeSyncItem(`sync-ack-${finalTx.id}`).catch(() => {});
            await removeSyncItem(finalTx.id).catch(() => {});
          }
        }
      } catch (syncErr) {
        console.info('[wallet] Immediate online settlement queued for background sync:', syncErr.message);
      }
    }

    await refreshTransactions();
    return finalTx;
  }, [refreshTransactions]);

  // ─── Synchronization Engine ──────────────────────────────
  const syncTransactions = useCallback(async (currentUser) => {
    if (isSyncingRef.current || syncStatus === 'syncing') {
      return { settled: 0, rejected: 0, retrying: 0 };
    }
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    const MAX_SYNC_RETRIES = 5;

    try {
      await expirePendingTransactions();
      const pending = await getPendingSyncItems();
      let settled = 0;
      let rejected = 0;
      let retrying = 0;

      for (const item of pending) {
        if (item.type !== 'TRANSACTION') continue;

        const currentAttempts = (item.attempts || 0) + 1;

        const tx = await getTransaction(item.transactionId);
        if (!tx) {
          await removeSyncItem(item.id);
          continue;
        }

        // Check if transaction has exceeded the 5-minute timeout without receiver scan
        // An acknowledged or received transaction must NEVER be marked as expired
        const isAcknowledged = tx.receiverAcknowledged || tx.acknowledgedAt || tx.status === TX_STATUS.RECEIVER_ACKNOWLEDGED;
        const txAge = Date.now() - new Date(tx.createdAt || tx.timestamp).getTime();
        if (!isAcknowledged && txAge >= 5 * 60 * 1000 && tx.status === TX_STATUS.OFFLINE_PENDING) {
          await expirePendingTransactions();
          rejected++;
          continue;
        }

        // Mark as syncing
        await updateSyncItem(item.id, {
          status: 'SYNCING',
          attempts: currentAttempts,
          lastAttemptAt: new Date().toISOString(),
        });
        await updateTransactionStatus(item.transactionId, TX_STATUS.SYNCING);

        // Idempotency: if already settled, remove and continue
        if (tx.status === TX_STATUS.SETTLED) {
          await removeSyncItem(item.id);
          settled++;
          continue;
        }

        // Authoritative Server-Side Verification Boundary
        const serverResult = await verifyAndSettleOnServer(tx);

        if (serverResult.success) {
          // Mark transaction SETTLED
          await updateTransactionStatus(tx.id, TX_STATUS.SETTLED, {
            settledAt: new Date().toISOString(),
            syncedAt: new Date().toISOString(),
            serverVerification: 'VERIFIED',
          });

          // Update device counter
          const txDevice = await getDevice(tx.deviceId);
          if (txDevice && tx.counter) {
            const updDev = {
              ...txDevice,
              transactionCounter: Math.max(txDevice.transactionCounter || 0, tx.counter),
            };
            await saveDevice(updDev);
            if (device?.id === txDevice.id) setDevice(updDev);
          }

          await removeSyncItem(item.id);
          settled++;
        } else {
          // Classify failure: retryable transient error vs fatal security rejection
          const errClassification = classifySyncError(serverResult);

          if (errClassification.retryable && currentAttempts < MAX_SYNC_RETRIES) {
            // Transient error: schedule exponential backoff retry (e.g. 2s, 4s, 8s, 16s, 30s)
            const backoffMs = Math.min(30000, 2000 * Math.pow(2, currentAttempts - 1));
            const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

            await updateSyncItem(item.id, {
              status: 'RETRY_WAITING',
              nextRetryAt,
              lastErrorCategory: 'RETRYABLE',
              lastErrorMessage: serverResult.message || errClassification.message,
            });

            await updateTransactionStatus(tx.id, TX_STATUS.RETRY_WAITING, {
              syncError: serverResult.message || errClassification.message,
              nextRetryAt,
            });

            retrying++;
          } else {
            // Fatal security error OR max retries exhausted: mark REJECTED permanently
            const reason = currentAttempts >= MAX_SYNC_RETRIES
              ? 'MAX_RETRIES_EXCEEDED'
              : (serverResult.reasonCode || errClassification.reasonCode || 'VERIFICATION_FAILED');

            await updateTransactionStatus(tx.id, TX_STATUS.REJECTED, {
              rejectionReason: reason,
              rejectedAt: new Date().toISOString(),
              syncError: serverResult.message || errClassification.message,
            });

            // Safe rollback/refund: only refund sender if sender is syncing and was debited upon creation
            if (tx.senderId === currentUser?.id && wallet) {
              const currentBal = wallet.availableBalance || 0;
              const refundedWallet = {
                ...wallet,
                availableBalance: Math.round((currentBal + tx.amount) * 100) / 100,
                totalSent: Math.max(0, Math.round(((wallet.totalSent || 0) - tx.amount) * 100) / 100),
                updatedAt: new Date().toISOString(),
              };
              await saveWallet(refundedWallet);
              setWallet(refundedWallet);
            }

            await removeSyncItem(item.id);
            rejected++;
          }
        }
      }

      // Inbound reconciliation for incoming payments & authoritative wallet balance (Phase 2)
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const { fetchRemoteWallet, syncInboundTransactions, canSyncWithSupabase } = await import('../services/supabaseSync');
          if (canSyncWithSupabase() && currentUser?.id) {
            const remoteWallet = await fetchRemoteWallet(currentUser.id);
            if (remoteWallet && remoteWallet.balance !== undefined) {
              const currentLocalWallet = await getWalletByUserId(currentUser.id);
              if (currentLocalWallet) {
                const updated = {
                  ...currentLocalWallet,
                  availableBalance: Number(remoteWallet.balance),
                  offlineLimit: remoteWallet.offline_limit ?? currentLocalWallet.offlineLimit,
                  offlineReserve: remoteWallet.offline_reserve ?? currentLocalWallet.offlineReserve,
                  updatedAt: remoteWallet.updated_at || new Date().toISOString(),
                };
                await saveWallet(updated);
                setWallet(updated);
              }
            }

            const { newCount } = await syncInboundTransactions(currentUser.id);
            if (newCount > 0) {
              settled += newCount;
            }
          }
        } catch (inboundErr) {
          console.warn('[sync] Inbound synchronization notice:', inboundErr);
        }
      }

      await refreshTransactions();
      await refreshSecurityEvents();

      const allRemaining = await getAllSyncQueueItems();
      setPendingSyncCount(allRemaining.filter(i => i.status === 'PENDING').length);
      setRetryWaitingCount(allRemaining.filter(i => i.status === 'RETRY_WAITING').length);
      setLastSyncTime(new Date().toISOString());

      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);

      return { settled, rejected, retrying };
    } catch (err) {
      console.error('[sync] Error in sync engine:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      throw err;
    } finally {
      isSyncingRef.current = false;
    }
  }, [syncStatus, wallet, device, refreshTransactions, refreshSecurityEvents, expirePendingTransactions]);

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
      retryWaitingCount,
      lastSyncTime,
      isInitialized,

      // Actions
      initWallet,
      resetWallet,
      refreshTransactions,
      refreshSecurityEvents,
      expirePendingTransactions,
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

