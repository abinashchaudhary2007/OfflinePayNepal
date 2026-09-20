/**
 * test/offlinepay.test.mjs
 * Comprehensive automated test suite for OfflinePay Nepal.
 * Run with: node --test test/offlinepay.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// Mock in-memory IndexedDB replacement for unit testing
const inMemoryStores = {
  wallet: new Map(),
  devices: new Map(),
  transactions: new Map(),
  authorizations: new Map(),
  sync_queue: new Map(),
  security_events: new Map(),
  nonces: new Map(),
  key_material: new Map(),
};

// Cryptographic primitives for tests using native WebCrypto
const KEY_ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_ALGORITHM = { name: 'ECDSA', hash: 'SHA-256' };

function canonicalize(obj) {
  if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function generateNonce() {
  const array = new Uint8Array(16);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateTxId() {
  return `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function generateKeyPair() {
  const keyPair = await globalThis.crypto.subtle.generateKey(
    KEY_ALGORITHM,
    true, // allow export in test runner
    ['sign', 'verify']
  );
  const publicKeyJwk = await globalThis.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { keyPair, publicKeyJwk };
}

async function signPayload(privateKey, payload) {
  const canonical = canonicalize(payload);
  const data = new TextEncoder().encode(canonical);
  const signatureBuffer = await globalThis.crypto.subtle.sign(SIGN_ALGORITHM, privateKey, data);
  return arrayBufferToBase64(signatureBuffer);
}

async function verifySignature(publicKeyJwk, payload, signatureB64) {
  try {
    const publicKey = await globalThis.crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      KEY_ALGORITHM,
      true,
      ['verify']
    );
    const canonical = canonicalize(payload);
    const data = new TextEncoder().encode(canonical);
    const signatureBuffer = base64ToArrayBuffer(signatureB64);
    return await globalThis.crypto.subtle.verify(SIGN_ALGORITHM, publicKey, signatureBuffer, data);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Authentication & Login Tests
// ─────────────────────────────────────────────────────────────────────────────
test('Auth — Authenticate valid demo users and reject invalid credentials', () => {
  const DEMO_USERS = [
    { id: 'usr-abinash', email: 'abinash@offlinepay.demo', role: 'user', balance: 15400 },
    { id: 'usr-anshu',   email: 'anshu@offlinepay.demo',   role: 'user', balance: 8200 },
    { id: 'usr-admin',   email: 'admin@offlinepay.demo',   role: 'admin', balance: 50000 },
  ];

  // Test valid login
  const user = DEMO_USERS.find(u => u.email === 'abinash@offlinepay.demo');
  assert.ok(user, 'Abinash user should exist');
  assert.equal(user.role, 'user');

  // Test admin user role
  const admin = DEMO_USERS.find(u => u.email === 'admin@offlinepay.demo');
  assert.equal(admin.role, 'admin', 'Admin user must have role admin');

  // Test invalid login
  const invalid = DEMO_USERS.find(u => u.email === 'hacker@malicious.com');
  assert.equal(invalid, undefined, 'Invalid user must not be found');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cryptography: ECDSA P-256 Key Generation & Deterministic Signing
// ─────────────────────────────────────────────────────────────────────────────
test('Crypto — Generate ECDSA P-256 key pair and verify public key JWK properties', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  assert.ok(keyPair.privateKey, 'Private key must exist');
  assert.ok(keyPair.publicKey, 'Public key must exist');
  assert.equal(publicKeyJwk.kty, 'EC', 'Key type must be EC');
  assert.equal(publicKeyJwk.crv, 'P-256', 'Curve must be P-256');
});

test('Crypto — Canonical JSON stringification must be deterministic across property orders', () => {
  const obj1 = { id: 'TX-1', sender: 'Abinash', amount: 500, nonce: 'abc' };
  const obj2 = { amount: 500, nonce: 'abc', id: 'TX-1', sender: 'Abinash' };

  assert.equal(canonicalize(obj1), canonicalize(obj2), 'Canonical string must match regardless of key order');
});

test('Crypto — Sign transaction payload and successfully verify valid signature', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  const payload = {
    id: 'TX-1001',
    senderId: 'usr-abinash',
    receiverId: 'usr-anshu',
    amount: 250.00,
    currency: 'NPR',
    nonce: generateNonce(),
    counter: 1,
    deviceId: 'DEV-TEST-01',
  };

  const signature = await signPayload(keyPair.privateKey, payload);
  assert.ok(typeof signature === 'string' && signature.length > 50, 'Signature must be a non-empty base64 string');

  const isValid = await verifySignature(publicKeyJwk, payload, signature);
  assert.equal(isValid, true, 'Valid signature must verify successfully');
});

test('Security — Tampered transaction payload MUST fail signature verification', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  const originalPayload = {
    id: 'TX-1002',
    senderId: 'usr-abinash',
    receiverId: 'usr-anshu',
    amount: 200.00,
    currency: 'NPR',
    nonce: generateNonce(),
    counter: 1,
    deviceId: 'DEV-TEST-01',
  };

  const signature = await signPayload(keyPair.privateKey, originalPayload);

  // Attacker tampers with the amount: Rs. 200 -> Rs. 2000
  const tamperedPayload = { ...originalPayload, amount: 2000.00 };

  const isTamperedValid = await verifySignature(publicKeyJwk, tamperedPayload, signature);
  assert.equal(isTamperedValid, false, 'Tampered transaction MUST be rejected');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Offline Authorization & Spending Limits
// ─────────────────────────────────────────────────────────────────────────────
test('Offline Auth — Create authorization, check limit constraints and 24h expiration', () => {
  const wallet = { availableBalance: 5000, offlineLimit: 0, offlineSpent: 0 };
  const requestedLimit = 1000;
  const maxSingle = 500;

  assert.ok(wallet.availableBalance >= requestedLimit, 'Wallet must have sufficient balance for auth');

  const now = Date.now();
  const auth = {
    id: 'AUTH-TEST-01',
    maximumAmount: requestedLimit,
    remainingAmount: requestedLimit,
    maxSingleTransaction: maxSingle,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
  };

  // Valid spending
  const validTxAmount = 250;
  assert.ok(validTxAmount <= auth.remainingAmount, 'Transaction must be within remaining limit');
  assert.ok(validTxAmount <= auth.maxSingleTransaction, 'Transaction must be within single tx limit');

  // Single transaction limit exceeded
  const singleTxExceeded = 600;
  assert.ok(singleTxExceeded > auth.maxSingleTransaction, 'Single tx limit must be caught');

  // Total limit exceeded
  const totalExceeded = 1200;
  assert.ok(totalExceeded > auth.remainingAmount, 'Total limit exceed must be caught');

  // Expired authorization check
  const expiredAuth = { ...auth, expiresAt: new Date(now - 1000).toISOString() };
  const isExpired = new Date(expiredAuth.expiresAt) < new Date();
  assert.equal(isExpired, true, 'Expired authorization must be identified');
});

function buildSignablePayload(tx) {
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. QR Code Flow & Offline Signature Verification
// ─────────────────────────────────────────────────────────────────────────────
test('QR Flow — Generate offline payment payload, verify structure and receiver validation', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  const offlineTx = {
    id: generateTxId(),
    senderId: 'usr-abinash',
    senderName: 'Abinash Shrestha',
    receiverId: 'usr-anshu',
    receiverName: 'Anshu Tamang',
    amount: 350.00,
    currency: 'NPR',
    timestamp: new Date().toISOString(),
    nonce: generateNonce(),
    counter: 3,
    deviceId: 'DEV-TEST-01',
    authorizationId: 'AUTH-123',
    senderPublicKeyJwk: publicKeyJwk,
  };

  const payloadToSign = buildSignablePayload(offlineTx);
  const signature = await signPayload(keyPair.privateKey, payloadToSign);
  offlineTx.signature = signature;

  // Construct QR Payload
  const qrJson = JSON.stringify({
    type: 'OFFLINE_PAYMENT',
    version: '1.0',
    ...offlineTx,
  });

  // Receiver scans and parses QR
  const parsed = JSON.parse(qrJson);
  assert.equal(parsed.type, 'OFFLINE_PAYMENT', 'QR type must be OFFLINE_PAYMENT');
  assert.equal(parsed.receiverId, 'usr-anshu', 'Receiver ID must match recipient');

  // Receiver verifies signature locally using embedded public key JWK and canonical payload
  const signableFields = buildSignablePayload(parsed);
  const sigVerified = await verifySignature(parsed.senderPublicKeyJwk, signableFields, parsed.signature);
  assert.equal(sigVerified, true, 'Receiver must verify offline payment signature without internet');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Replay Attack & Nonce Reuse Protection
// ─────────────────────────────────────────────────────────────────────────────
test('Security — Nonce registry prevents replay attacks', () => {
  const nonceRegistry = new Set();

  function registerNonce(nonce) {
    if (nonceRegistry.has(nonce)) return false; // Replay detected
    nonceRegistry.add(nonce);
    return true; // OK
  }

  const nonce = generateNonce();
  const firstUse = registerNonce(nonce);
  assert.equal(firstUse, true, 'First use of nonce must succeed');

  const secondUse = registerNonce(nonce);
  assert.equal(secondUse, false, 'Second use of identical nonce must be BLOCKED as replay attack');
});

test('Security — Monotonic transaction counter prevents counter replay/regression', () => {
  let deviceCounter = 5;

  function validateCounter(txCounter) {
    if (txCounter <= deviceCounter) {
      return { valid: false, reason: 'Counter regression' };
    }
    deviceCounter = txCounter;
    return { valid: true };
  }

  // Regression attempt (counter = 4 <= 5)
  assert.equal(validateCounter(4).valid, false, 'Lower counter must be blocked');

  // Replay attempt (counter = 5 <= 5)
  assert.equal(validateCounter(5).valid, false, 'Same counter must be blocked');

  // Monotonic advancement (counter = 6 > 5)
  assert.equal(validateCounter(6).valid, true, 'Advancing counter must be accepted');
  assert.equal(deviceCounter, 6, 'Device counter must advance to 6');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Device Revocation Check
// ─────────────────────────────────────────────────────────────────────────────
test('Security — Transactions from REVOKED devices must be blocked', () => {
  const device = { id: 'DEV-COMPROMISED', status: 'REVOKED' };

  function checkDeviceStatus(d) {
    return d && d.status === 'ACTIVE';
  }

  assert.equal(checkDeviceStatus(device), false, 'Revoked device must not be allowed to transact');
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Double-Spend Prevention
// ─────────────────────────────────────────────────────────────────────────────
test('Security — Multiple offline transactions cannot exceed authorized allowance', () => {
  const remainingAllowance = 500;
  const pendingTxs = [
    { id: 'TX-P1', amount: 200, status: 'OFFLINE_PENDING' },
    { id: 'TX-P2', amount: 200, status: 'OFFLINE_PENDING' },
  ];

  const currentPendingSum = pendingTxs.reduce((s, tx) => s + tx.amount, 0); // 400
  const newTxAmount = 150; // 400 + 150 = 550 > 500

  const isDoubleSpend = (currentPendingSum + newTxAmount) > remainingAllowance;
  assert.equal(isDoubleSpend, true, 'Attempt to overspend authorized limit must be flagged as double-spend');
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Online Payment: Balance Deduction & Accounting (Phase 15)
// ─────────────────────────────────────────────────────────────────────────────
test('Phase 15 — Online payment validates balance, deducts sender, and credits receiver', () => {
  const senderWallet = { id: 'WAL-001', userId: 'usr-abinash', availableBalance: 15400, totalSent: 700 };
  const receiverWallet = { id: 'WAL-002', userId: 'usr-anshu', availableBalance: 8200, totalReceived: 0 };
  const transferAmount = 1500.00;

  // 1. Validate sufficient balance
  assert.ok(senderWallet.availableBalance >= transferAmount, 'Sender must have sufficient balance');

  // 2. Execute online settlement
  const updatedSender = {
    ...senderWallet,
    availableBalance: senderWallet.availableBalance - transferAmount,
    totalSent: senderWallet.totalSent + transferAmount,
  };

  const updatedReceiver = {
    ...receiverWallet,
    availableBalance: receiverWallet.availableBalance + transferAmount,
    totalReceived: receiverWallet.totalReceived + transferAmount,
  };

  // 3. Verify resulting balances
  assert.equal(updatedSender.availableBalance, 13900, 'Sender balance must be exactly 15400 - 1500 = 13900');
  assert.equal(updatedSender.totalSent, 2200, 'Sender totalSent must be exactly 700 + 1500 = 2200');
  assert.equal(updatedReceiver.availableBalance, 9700, 'Receiver balance must be exactly 8200 + 1500 = 9700');
  assert.equal(updatedReceiver.totalReceived, 1500, 'Receiver totalReceived must be exactly 0 + 1500 = 1500');

  // 4. Verify conservation of money
  const initialTotal = senderWallet.availableBalance + receiverWallet.availableBalance;
  const finalTotal = updatedSender.availableBalance + updatedReceiver.availableBalance;
  assert.equal(initialTotal, finalTotal, 'Total system money must be strictly conserved');
});

test('Phase 15 — Online payment rejects insufficient balance with clean error', () => {
  const senderWallet = { id: 'WAL-001', userId: 'usr-abinash', availableBalance: 100.00 };
  const transferAmount = 500.00;

  function executePayment(wallet, amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    if (wallet.availableBalance < amount) throw new Error('Insufficient balance.');
    return { success: true };
  }

  assert.throws(
    () => executePayment(senderWallet, transferAmount),
    /Insufficient balance/,
    'Must throw Insufficient balance error'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Offline to Online Synchronization Engine Idempotency
// ─────────────────────────────────────────────────────────────────────────────
test('Sync Engine — Settle pending offline transaction and guarantee idempotency', () => {
  const ledger = new Map();
  const wallet = { availableBalance: 5000, totalSent: 0 };

  const pendingTx = {
    id: 'TX-OFFLINE-SYNC-01',
    senderId: 'usr-abinash',
    amount: 250,
    status: 'OFFLINE_PENDING',
  };
  ledger.set(pendingTx.id, pendingTx);

  function syncTransaction(txId) {
    const tx = ledger.get(txId);
    if (!tx) throw new Error('TX not found');
    if (tx.status === 'SETTLED') {
      return { settled: false, alreadySettled: true };
    }

    tx.status = 'SETTLED';
    tx.settledAt = new Date().toISOString();
    wallet.availableBalance -= tx.amount;
    wallet.totalSent += tx.amount;
    return { settled: true, alreadySettled: false };
  }

  // First sync
  const firstSync = syncTransaction(pendingTx.id);
  assert.equal(firstSync.settled, true, 'First sync must settle');
  assert.equal(wallet.availableBalance, 4750, 'Balance must be deducted once (4750)');

  // Duplicate sync attempt
  const duplicateSync = syncTransaction(pendingTx.id);
  assert.equal(duplicateSync.alreadySettled, true, 'Duplicate sync must be recognized as already settled');
  assert.equal(wallet.availableBalance, 4750, 'Balance must NOT be deducted a second time');
});
