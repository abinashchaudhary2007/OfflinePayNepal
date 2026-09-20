/**
 * ledger.js — Simulated server-side ledger and verification engine
 * 
 * In a real system, ALL of this logic would run on the server.
 * For this educational demo, we simulate the server's verification
 * steps in a service module to illustrate what a real backend would do.
 * 
 * DEMO SYSTEM — No real money, no real server.
 */

import {
  getTransaction,
  saveTransaction,
  getAllTransactions,
  updateTransactionStatus,
  saveSecurityEvent,
  checkAndSaveNonce,
  getDevice,
  getActiveAuthorization,
  updateAuthorization,
} from './db';
import { verifyTransactionSignature } from './crypto';
import { generateNonce } from './crypto';

// ─── Transaction Status ────────────────────────────────────────────

export const TX_STATUS = {
  CREATED:         'CREATED',
  OFFLINE_PENDING: 'OFFLINE_PENDING',
  SYNCING:         'SYNCING',
  VERIFIED:        'VERIFIED',
  SETTLED:         'SETTLED',
  REJECTED:        'REJECTED',
  EXPIRED:         'EXPIRED',
};

// ─── Security Event Types ──────────────────────────────────────────

export const SECURITY_EVENT = {
  REPLAY_ATTEMPT:          'REPLAY_ATTEMPT',
  DOUBLE_SPEND_ATTEMPT:    'DOUBLE_SPEND_ATTEMPT',
  INVALID_SIGNATURE:       'INVALID_SIGNATURE',
  INVALID_COUNTER:         'INVALID_COUNTER',
  EXPIRED_AUTHORIZATION:   'EXPIRED_AUTHORIZATION',
  INVALID_DEVICE:          'INVALID_DEVICE',
  OFFLINE_LIMIT_EXCEEDED:  'OFFLINE_LIMIT_EXCEEDED',
  LOGIN_FAILURE:           'LOGIN_FAILURE',
  OFFLINE_AUTH_CREATED:    'OFFLINE_AUTH_CREATED',
};

// ─── Verification Engine ───────────────────────────────────────────

/**
 * verifyTransaction — Simulates server-side transaction verification.
 * Runs the complete security check pipeline.
 * Returns { valid: boolean, reason: string, event?: string }
 */
export async function verifyTransaction(tx, senderPublicKeyJwk, expectedCounter) {
  // 1. Check transaction ID uniqueness (replay detection)
  const existing = await getTransaction(tx.id);
  if (existing && existing.status === TX_STATUS.SETTLED) {
    await logSecurityEvent({
      userId: tx.senderId,
      deviceId: tx.deviceId,
      eventType: SECURITY_EVENT.REPLAY_ATTEMPT,
      severity: 'HIGH',
      description: `Duplicate transaction ${tx.id} submitted (replay attack)`,
      status: 'BLOCKED',
      relatedTxId: tx.id,
    });
    return { valid: false, reason: 'Duplicate transaction ID — replay attack detected', event: SECURITY_EVENT.REPLAY_ATTEMPT };
  }

  // 2. Check nonce uniqueness
  const nonceOk = await checkAndSaveNonce(tx.nonce);
  if (!nonceOk) {
    await logSecurityEvent({
      userId: tx.senderId,
      deviceId: tx.deviceId,
      eventType: SECURITY_EVENT.REPLAY_ATTEMPT,
      severity: 'HIGH',
      description: `Nonce ${tx.nonce} already used — replay attack`,
      status: 'BLOCKED',
      relatedTxId: tx.id,
    });
    return { valid: false, reason: 'Nonce already used — replay attack detected', event: SECURITY_EVENT.REPLAY_ATTEMPT };
  }

  // 3. Device status check
  const device = await getDevice(tx.deviceId);
  if (device && device.status !== 'ACTIVE') {
    await logSecurityEvent({
      userId: tx.senderId,
      deviceId: tx.deviceId,
      eventType: SECURITY_EVENT.INVALID_DEVICE,
      severity: 'HIGH',
      description: `Transaction from ${device.status} device ${tx.deviceId}`,
      status: 'BLOCKED',
      relatedTxId: tx.id,
    });
    return { valid: false, reason: `Device is ${device.status}`, event: SECURITY_EVENT.INVALID_DEVICE };
  }

  // 4. Transaction counter check (monotonic)
  if (device && tx.counter !== undefined) {
    if (tx.counter <= device.transactionCounter) {
      await logSecurityEvent({
        userId: tx.senderId,
        deviceId: tx.deviceId,
        eventType: SECURITY_EVENT.INVALID_COUNTER,
        severity: 'HIGH',
        description: `Counter regression: expected >${device.transactionCounter}, got ${tx.counter}`,
        status: 'BLOCKED',
        relatedTxId: tx.id,
      });
      return { valid: false, reason: 'Transaction counter is invalid — possible replay', event: SECURITY_EVENT.INVALID_COUNTER };
    }
  }

  // 5. Authorization check (for offline transactions)
  if (tx.authorizationId) {
    const auth = await getActiveAuthorization(tx.deviceId);
    if (!auth) {
      await logSecurityEvent({
        userId: tx.senderId,
        deviceId: tx.deviceId,
        eventType: SECURITY_EVENT.EXPIRED_AUTHORIZATION,
        severity: 'MEDIUM',
        description: `No active authorization for device ${tx.deviceId}`,
        status: 'BLOCKED',
        relatedTxId: tx.id,
      });
      return { valid: false, reason: 'No active offline authorization', event: SECURITY_EVENT.EXPIRED_AUTHORIZATION };
    }

    if (new Date(auth.expiresAt) < new Date()) {
      await logSecurityEvent({
        userId: tx.senderId,
        deviceId: tx.deviceId,
        eventType: SECURITY_EVENT.EXPIRED_AUTHORIZATION,
        severity: 'MEDIUM',
        description: `Authorization ${auth.id} expired`,
        status: 'BLOCKED',
        relatedTxId: tx.id,
      });
      return { valid: false, reason: 'Offline authorization has expired', event: SECURITY_EVENT.EXPIRED_AUTHORIZATION };
    }

    if (tx.amount > auth.remainingAmount) {
      await logSecurityEvent({
        userId: tx.senderId,
        deviceId: tx.deviceId,
        eventType: SECURITY_EVENT.OFFLINE_LIMIT_EXCEEDED,
        severity: 'HIGH',
        description: `Amount Rs. ${tx.amount} exceeds remaining offline limit Rs. ${auth.remainingAmount}`,
        status: 'BLOCKED',
        relatedTxId: tx.id,
      });
      return { valid: false, reason: 'Amount exceeds offline spending limit', event: SECURITY_EVENT.OFFLINE_LIMIT_EXCEEDED };
    }
  }

  // 6. Signature verification
  if (tx.method === 'OFFLINE_QR') {
    if (!tx.signature) {
      await logSecurityEvent({
        userId: tx.senderId,
        deviceId: tx.deviceId,
        eventType: SECURITY_EVENT.INVALID_SIGNATURE,
        severity: 'HIGH',
        description: `Missing signature for offline transaction ${tx.id}`,
        status: 'BLOCKED',
        relatedTxId: tx.id,
      });
      return { valid: false, reason: 'Offline transaction must be cryptographically signed', event: SECURITY_EVENT.INVALID_SIGNATURE };
    }

    if (tx.signature !== 'DEMO_SIG' && senderPublicKeyJwk) {
      const payloadToVerify = buildSignablePayload(tx);
      const sigValid = await verifyTransactionSignature(senderPublicKeyJwk, payloadToVerify, tx.signature);
      if (!sigValid) {
        await logSecurityEvent({
          userId: tx.senderId,
          deviceId: tx.deviceId,
          eventType: SECURITY_EVENT.INVALID_SIGNATURE,
          severity: 'HIGH',
          description: `Invalid cryptographic signature for transaction ${tx.id}`,
          status: 'BLOCKED',
          relatedTxId: tx.id,
        });
        return { valid: false, reason: 'Transaction signature is invalid — payload tampered with', event: SECURITY_EVENT.INVALID_SIGNATURE };
      }
    }
  }

  return { valid: true, reason: 'All checks passed' };
}

/**
 * settleTransaction — Apply a verified transaction to both wallets.
 * Idempotent: if already SETTLED, returns success without double-applying.
 */
export async function settleTransaction(tx, walletState, updateWallets) {
  const existing = await getTransaction(tx.id);
  if (existing?.status === TX_STATUS.SETTLED) {
    return { success: true, alreadySettled: true };
  }

  // Apply the debit/credit
  await updateWallets(tx.senderId, tx.receiverId, tx.amount);

  // Mark settled
  await updateTransactionStatus(tx.id, TX_STATUS.SETTLED, {
    settledAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Build the signable payload — only the canonical fields used for signing.
 * MUST be deterministic and NOT include the signature itself.
 */
export function buildSignablePayload(tx) {
  return {
    id: tx.id,
    senderId: tx.senderId,
    receiverId: tx.receiverId,
    amount: tx.amount,
    currency: tx.currency,
    timestamp: tx.timestamp,
    nonce: tx.nonce,
    counter: tx.counter,
    authorizationId: tx.authorizationId || null,
    deviceId: tx.deviceId,
  };
}

// ─── Security Event Logger ─────────────────────────────────────────

export async function logSecurityEvent(event) {
  const secEvent = {
    id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    ...event,
  };
  await saveSecurityEvent(secEvent);
  return secEvent;
}

// ─── Double-Spend Detection ────────────────────────────────────────

/**
 * Check if sender has already sent more than their authorized offline limit.
 * Scans all OFFLINE_PENDING transactions for this device.
 */
export async function checkDoubleSpend(senderId, deviceId, newAmount, authRemainingAmount) {
  const all = await getAllTransactions();
  const pendingForDevice = all.filter(tx =>
    tx.senderId === senderId &&
    tx.deviceId === deviceId &&
    (tx.status === TX_STATUS.OFFLINE_PENDING || tx.status === TX_STATUS.SYNCING)
  );
  const totalPendingAmount = pendingForDevice.reduce((sum, tx) => sum + tx.amount, 0);

  if (totalPendingAmount + newAmount > authRemainingAmount) {
    await logSecurityEvent({
      userId: senderId,
      deviceId,
      eventType: SECURITY_EVENT.DOUBLE_SPEND_ATTEMPT,
      severity: 'HIGH',
      description: `Double-spend detected: pending Rs. ${totalPendingAmount} + new Rs. ${newAmount} > limit Rs. ${authRemainingAmount}`,
      status: 'BLOCKED',
    });
    return { detected: true, pendingAmount: totalPendingAmount };
  }

  return { detected: false };
}
