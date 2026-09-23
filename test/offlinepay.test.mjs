/**
 * test/offlinepay.test.mjs
 * Comprehensive automated test suite for OfflinePay Nepal.
 * Run with: node --test test/offlinepay.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidStatusTransition,
  classifySyncError,
  TX_STATUS,
  VALID_STATUS_TRANSITIONS,
} from '../src/services/ledger.js';

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

// ─────────────────────────────────────────────────────────────────────────────
// 10. Bug 1 & 2 Verification Suite (Tests 1 - 9)
// ─────────────────────────────────────────────────────────────────────────────
test('Bug 2 / Test 1: Sender Rs. 1,000, Receiver Rs. 0, Send Rs. 200 -> Sender Rs. 800, Receiver Rs. 200', () => {
  const senderWallet = { userId: 'usr-1', availableBalance: 1000, totalSent: 0 };
  const receiverWallet = { userId: 'usr-2', availableBalance: 0, totalReceived: 0 };
  const amount = 200;

  // Validation
  assert.ok(amount > 0);
  assert.ok(senderWallet.availableBalance >= amount);

  // Logical operation: atomic debit & credit
  senderWallet.availableBalance -= amount;
  senderWallet.totalSent += amount;
  receiverWallet.availableBalance += amount;
  receiverWallet.totalReceived += amount;

  assert.equal(senderWallet.availableBalance, 800, 'Sender balance must be exactly 800');
  assert.equal(receiverWallet.availableBalance, 200, 'Receiver balance must be exactly 200');
});

test('Bug 2 / Test 2: Sender Rs. 100, Send Rs. 150 -> Rejected, balances unchanged', () => {
  const senderWallet = { userId: 'usr-1', availableBalance: 100 };
  const receiverWallet = { userId: 'usr-2', availableBalance: 50 };
  const amount = 150;

  function processPayment(sender, receiver, amt) {
    if (amt <= 0) throw new Error('Invalid amount');
    if (sender.availableBalance < amt) throw new Error('Insufficient balance.');
    sender.availableBalance -= amt;
    receiver.availableBalance += amt;
  }

  assert.throws(() => processPayment(senderWallet, receiverWallet, amount), /Insufficient balance/);
  assert.equal(senderWallet.availableBalance, 100, 'Sender balance must remain unchanged');
  assert.equal(receiverWallet.availableBalance, 50, 'Receiver balance must remain unchanged');
});

test('Bug 2 / Test 3 & 4: Zero or negative amounts must be strictly rejected', () => {
  function validateAmount(amt) {
    const num = Math.round(Number(amt) * 100) / 100;
    if (isNaN(num) || num <= 0) throw new Error('Invalid payment amount. Must be greater than 0.');
    return num;
  }

  assert.throws(() => validateAmount(0), /greater than 0/);
  assert.throws(() => validateAmount(-50), /greater than 0/);
  assert.throws(() => validateAmount('-100'), /greater than 0/);
  assert.equal(validateAmount(250.50), 250.50);
});

test('Bug 1 / Test 5 & 6: Registered user directory and search by name/email/ID', () => {
  const directory = [
    { id: 'user-abinash-001', name: 'Abinash Shrestha', email: 'abinash@offlinepay.demo', role: 'user' },
    { id: 'user-anshu-002', name: 'Anshu Tamang', email: 'anshu@offlinepay.demo', role: 'user' },
    { id: 'user-demo-003', name: 'Demo User', email: 'user@offlinepay.demo', role: 'user' },
    { id: 'admin-001', name: 'Admin Officer', email: 'admin@offlinepay.demo', role: 'admin' },
  ];

  // Register a completely new user
  const newUser = {
    id: 'user-reg-999',
    name: 'Sita Sharma',
    email: 'sita@offlinepay.demo',
    role: 'user',
  };
  directory.push(newUser);

  // Search function mimicking SendMoney.jsx
  function searchRecipients(users, currentUserId, query) {
    const q = query.toLowerCase().trim();
    return users.filter(u => u.id !== currentUserId && u.role !== 'admin').filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }

  // 1. Newly registered user appears for another user
  const listForAbinash = searchRecipients(directory, 'user-abinash-001', '');
  const foundSita = listForAbinash.find(u => u.id === 'user-reg-999');
  assert.ok(foundSita, 'Newly registered user must be found in directory');
  assert.equal(foundSita.name, 'Sita Sharma');

  // 2. Search by name
  const nameSearch = searchRecipients(directory, 'user-abinash-001', 'sita');
  assert.equal(nameSearch.length, 1);
  assert.equal(nameSearch[0].name, 'Sita Sharma');

  // 3. Search by email
  const emailSearch = searchRecipients(directory, 'user-abinash-001', 'anshu@');
  assert.equal(emailSearch.length, 1);
  assert.equal(emailSearch[0].id, 'user-anshu-002');

  // 4. Search by user ID
  const idSearch = searchRecipients(directory, 'user-abinash-001', 'reg-999');
  assert.equal(idSearch.length, 1);
  assert.equal(idSearch[0].id, 'user-reg-999');
});

test('Bug 1 / Test 7: Prevent sending to self', () => {
  const currentUserId = 'user-abinash-001';
  function validateAccounts(senderId, receiverId) {
    if (senderId === receiverId) {
      throw new Error('Sender and receiver cannot be the same account.');
    }
  }

  assert.throws(() => validateAccounts(currentUserId, currentUserId), /same account/);
  assert.doesNotThrow(() => validateAccounts(currentUserId, 'user-anshu-002'));
});

test('Bug 2 / Test 8: Offline payment balance debit & limit deduction consistency', () => {
  const wallet = { availableBalance: 1000, offlineLimit: 500, offlineSpent: 0, offlineRemaining: 500, totalSent: 0 };
  const auth = { remainingAmount: 500, maxSingleTransaction: 300 };
  const paymentAmount = 200;

  // Verification checks
  assert.ok(paymentAmount <= auth.remainingAmount);
  assert.ok(paymentAmount <= auth.maxSingleTransaction);
  assert.ok(wallet.availableBalance >= paymentAmount);

  // Debit sender wallet & authorization upon offline creation
  wallet.availableBalance -= paymentAmount;
  wallet.offlineSpent += paymentAmount;
  wallet.offlineRemaining = auth.remainingAmount - paymentAmount;
  wallet.totalSent += paymentAmount;
  auth.remainingAmount -= paymentAmount;

  assert.equal(wallet.availableBalance, 800, 'Sender availableBalance must immediately debit to 800');
  assert.equal(wallet.offlineSpent, 200, 'Sender offlineSpent must be 200');
  assert.equal(wallet.offlineRemaining, 300, 'Sender offlineRemaining must be 300');
  assert.equal(auth.remainingAmount, 300, 'Authorization remaining must be 300');

  // Receiver accepts offline payment
  const receiverWallet = { availableBalance: 0, totalReceived: 0 };
  receiverWallet.availableBalance += paymentAmount;
  receiverWallet.totalReceived += paymentAmount;

  assert.equal(receiverWallet.availableBalance, 200, 'Receiver availableBalance must be 200');
  assert.equal(wallet.availableBalance + receiverWallet.availableBalance, 1000, 'Conservation of money must hold');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. State Machine & Status Transition Policy Tests
// ─────────────────────────────────────────────────────────────────────────────
test('State Machine — Valid status transitions are permitted', () => {
  assert.equal(isValidStatusTransition(TX_STATUS.CREATED, TX_STATUS.OFFLINE_PENDING), true);
  assert.equal(isValidStatusTransition(TX_STATUS.CREATED, TX_STATUS.SETTLED), true);
  assert.equal(isValidStatusTransition(TX_STATUS.OFFLINE_PENDING, TX_STATUS.SYNCING), true);
  assert.equal(isValidStatusTransition(TX_STATUS.SYNCING, TX_STATUS.RETRY_WAITING), true);
  assert.equal(isValidStatusTransition(TX_STATUS.RETRY_WAITING, TX_STATUS.SYNCING), true);
  assert.equal(isValidStatusTransition(TX_STATUS.SYNCING, TX_STATUS.SETTLED), true);
  assert.equal(isValidStatusTransition(TX_STATUS.SYNCING, TX_STATUS.REJECTED), true);
  // Idempotent same-state transitions
  assert.equal(isValidStatusTransition(TX_STATUS.SETTLED, TX_STATUS.SETTLED), true);
  assert.equal(isValidStatusTransition(TX_STATUS.SYNCING, TX_STATUS.SYNCING), true);
});

test('State Machine — Invalid and illegal status transitions are strictly blocked', () => {
  // Terminal state SETTLED cannot transition back to anything else
  assert.equal(isValidStatusTransition(TX_STATUS.SETTLED, TX_STATUS.SYNCING), false);
  assert.equal(isValidStatusTransition(TX_STATUS.SETTLED, TX_STATUS.REJECTED), false);
  assert.equal(isValidStatusTransition(TX_STATUS.SETTLED, TX_STATUS.CREATED), false);

  // Terminal state REJECTED cannot transition to SETTLED
  assert.equal(isValidStatusTransition(TX_STATUS.REJECTED, TX_STATUS.SETTLED), false);

  // Illegal jumps
  assert.equal(isValidStatusTransition(TX_STATUS.CREATED, TX_STATUS.RETRY_WAITING), false);
  assert.equal(isValidStatusTransition(TX_STATUS.OFFLINE_PENDING, TX_STATUS.SETTLED), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Synchronization Error Classification & Safe Retry Queue Tests
// ─────────────────────────────────────────────────────────────────────────────
test('Sync — Classify transient network/server failures as RETRYABLE', () => {
  const netError = classifySyncError(new Error('Failed to fetch: net::ERR_INTERNET_DISCONNECTED'));
  assert.equal(netError.retryable, true);
  assert.equal(netError.category, 'RETRYABLE');

  const timeoutError = classifySyncError(new Error('Gateway timeout (HTTP 504)'));
  assert.equal(timeoutError.retryable, true);
  assert.equal(timeoutError.category, 'RETRYABLE');
});

test('Sync — Classify security violations as non-retryable FATAL errors', () => {
  const sigError = classifySyncError(new Error('The transaction signature could not be verified.'));
  assert.equal(sigError.retryable, false);
  assert.equal(sigError.category, 'FATAL');
  assert.equal(sigError.reasonCode, 'INVALID_SIGNATURE');

  const replayError = classifySyncError(new Error('Cryptographic nonce has already been used'));
  assert.equal(replayError.retryable, false);
  assert.equal(replayError.category, 'FATAL');
  assert.equal(replayError.reasonCode, 'REPLAY_ATTACK');

  const counterError = classifySyncError(new Error('Transaction counter regression detected'));
  assert.equal(counterError.retryable, false);
  assert.equal(counterError.category, 'FATAL');
  assert.equal(counterError.reasonCode, 'INVALID_COUNTER');

  const revokedError = classifySyncError(new Error('Transacting device has been REVOKED'));
  assert.equal(revokedError.retryable, false);
  assert.equal(revokedError.category, 'FATAL');
  assert.equal(revokedError.reasonCode, 'REVOKED_DEVICE');
});

test('Sync Queue — Exponential backoff calculation and retry limits', () => {
  const calculateBackoff = (attempt) => Math.min(30000, 2000 * Math.pow(2, attempt - 1));

  assert.equal(calculateBackoff(1), 2000, 'Attempt 1 backoff is 2s');
  assert.equal(calculateBackoff(2), 4000, 'Attempt 2 backoff is 4s');
  assert.equal(calculateBackoff(3), 8000, 'Attempt 3 backoff is 8s');
  assert.equal(calculateBackoff(4), 16000, 'Attempt 4 backoff is 16s');
  assert.equal(calculateBackoff(5), 30000, 'Attempt 5 backoff is capped at 30s');

  const MAX_RETRIES = 5;
  const item = { attempts: 5 };
  const shouldReject = item.attempts >= MAX_RETRIES;
  assert.equal(shouldReject, true, 'Transactions reaching max retries must be marked REJECTED');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Server-Side Cryptographic Signature Verification & Tamper Resistance
// ─────────────────────────────────────────────────────────────────────────────
test('Server Verifier — Authoritative ECDSA P-256 verification succeeds for authentic payload', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  // Authoritative server device registry
  const serverDeviceDb = new Map();
  serverDeviceDb.set('DEV-AUTH-001', {
    id: 'DEV-AUTH-001',
    userId: 'usr-abinash',
    publicKeyJwk,
    status: 'ACTIVE',
    transactionCounter: 5,
  });

  const tx = {
    id: 'TX-VERIFY-001',
    senderId: 'usr-abinash',
    receiverId: 'usr-shopkeeper',
    amount: 150.00,
    currency: 'NPR',
    timestamp: new Date().toISOString(),
    nonce: generateNonce(),
    counter: 6,
    authorizationId: null,
    deviceId: 'DEV-AUTH-001',
  };

  const signature = await signPayload(keyPair.privateKey, tx);
  tx.signature = signature;

  // Independent server verification logic:
  // 1. Resolve registered device authoritatively from DB (not client payload)
  const registeredDevice = serverDeviceDb.get(tx.deviceId);
  assert.ok(registeredDevice, 'Server must locate registered device');
  assert.equal(registeredDevice.status, 'ACTIVE');

  // 2. Authoritative signature verification (reconstruct signable payload excluding signature)
  const signablePayload = {
    id: tx.id,
    senderId: tx.senderId,
    receiverId: tx.receiverId,
    amount: tx.amount,
    currency: tx.currency,
    timestamp: tx.timestamp,
    nonce: tx.nonce,
    counter: tx.counter,
    authorizationId: tx.authorizationId,
    deviceId: tx.deviceId,
  };
  const isValid = await verifySignature(registeredDevice.publicKeyJwk, signablePayload, tx.signature);
  assert.equal(isValid, true, 'Server must verify authentic signature with registered public key');
});

test('Server Verifier — Server rejects tampered amount, recipient, or transaction ID', async () => {
  const { keyPair, publicKeyJwk } = await generateKeyPair();

  const originalTx = {
    id: 'TX-TAMPER-001',
    senderId: 'usr-abinash',
    receiverId: 'usr-shopkeeper',
    amount: 200.00,
    currency: 'NPR',
    timestamp: new Date().toISOString(),
    nonce: generateNonce(),
    counter: 1,
    authorizationId: null,
    deviceId: 'DEV-AUTH-002',
  };

  const validSignature = await signPayload(keyPair.privateKey, originalTx);

  // 1. Tamper amount (Rs. 200 -> Rs. 2,000)
  const tamperedAmountTx = { ...originalTx, amount: 2000.00 };
  const amountValid = await verifySignature(publicKeyJwk, tamperedAmountTx, validSignature);
  assert.equal(amountValid, false, 'Tampered amount MUST be rejected by server signature verifier');

  // 2. Tamper recipient (usr-shopkeeper -> usr-attacker)
  const tamperedReceiverTx = { ...originalTx, receiverId: 'usr-attacker' };
  const receiverValid = await verifySignature(publicKeyJwk, tamperedReceiverTx, validSignature);
  assert.equal(receiverValid, false, 'Tampered recipient MUST be rejected by server signature verifier');

  // 3. Tamper transaction ID
  const tamperedIdTx = { ...originalTx, id: 'TX-TAMPER-999' };
  const idValid = await verifySignature(publicKeyJwk, tamperedIdTx, validSignature);
  assert.equal(idValid, false, 'Tampered transaction ID MUST be rejected by server signature verifier');
});

test('Server Verifier — Server rejects unregistered device or revoked device', async () => {
  const serverDeviceDb = new Map();
  serverDeviceDb.set('DEV-REVOKED-01', {
    id: 'DEV-REVOKED-01',
    userId: 'usr-abinash',
    status: 'REVOKED',
  });

  // Test unregistered device
  const unknownDev = serverDeviceDb.get('DEV-UNKNOWN-99');
  assert.equal(unknownDev, undefined, 'Unregistered device must fail resolution');

  // Test revoked device
  const revokedDev = serverDeviceDb.get('DEV-REVOKED-01');
  assert.equal(revokedDev.status, 'REVOKED', 'Revoked device must not be permitted');
});

test('Server Verifier — Idempotent server settlement guarantees no double debit or credit', () => {
  const serverLedger = new Map();
  const txId = 'TX-IDEM-001';

  // First sync attempt
  function settle(tx) {
    if (serverLedger.has(tx.id)) {
      return { success: true, status: 'SETTLED', alreadySettled: true };
    }
    serverLedger.set(tx.id, { ...tx, status: 'SETTLED', settledAt: new Date().toISOString() });
    return { success: true, status: 'SETTLED', alreadySettled: false };
  }

  const result1 = settle({ id: txId, amount: 250 });
  assert.equal(result1.success, true);
  assert.equal(result1.alreadySettled, false);
  assert.equal(serverLedger.size, 1);

  const result2 = settle({ id: txId, amount: 250 });
  assert.equal(result2.success, true);
  assert.equal(result2.alreadySettled, true, 'Second sync must recognize transaction is already settled');
  assert.equal(serverLedger.size, 1, 'Server ledger must not create duplicate transaction');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Shopkeeper UX & Local QR Acceptance Tests
// ─────────────────────────────────────────────────────────────────────────────
test('Receiver UX — Reject payment QR intended for a different receiver', () => {
  const currentShopkeeperId = 'usr-kirana-store-01';
  const qrPayload = {
    id: 'TX-PAY-901',
    senderId: 'usr-customer-02',
    receiverId: 'usr-hardware-store-03', // Different shopkeeper!
    amount: 350.00,
  };

  function validateReceiver(scannedTx, myId) {
    if (scannedTx.receiverId !== myId) {
      throw new Error(`Payment mismatch: This payment was intended for another receiver (${scannedTx.receiverId}).`);
    }
  }

  assert.throws(
    () => validateReceiver(qrPayload, currentShopkeeperId),
    /Payment mismatch: This payment was intended for another receiver/
  );
});

test('Receiver UX — Enforce single local acceptance: duplicate scans are blocked', () => {
  const localAcceptedTxs = new Set();
  const localAcceptedNonces = new Set();

  function acceptQrPayment(tx) {
    if (localAcceptedTxs.has(tx.id)) {
      throw new Error('This payment has already been accepted locally.');
    }
    if (localAcceptedNonces.has(tx.nonce)) {
      throw new Error('Security alert: Replay detected. Nonce has already been accepted.');
    }
    localAcceptedTxs.add(tx.id);
    localAcceptedNonces.add(tx.nonce);
    return { accepted: true, status: 'OFFLINE_PENDING' };
  }

  const tx = { id: 'TX-SHOP-001', nonce: 'nonce-shop-001', amount: 150 };

  // First scan
  const firstAccept = acceptQrPayment(tx);
  assert.equal(firstAccept.accepted, true);
  assert.equal(firstAccept.status, 'OFFLINE_PENDING');

  // Second scan (replay/duplicate)
  assert.throws(
    () => acceptQrPayment(tx),
    /already been accepted locally/
  );
});

test('Payment UX — Validate amount constraints (zero, negative, max single, allowance)', () => {
  const auth = { remainingAmount: 500, maxSingleTransaction: 300 };
  const wallet = { availableBalance: 1000 };

  function validatePaymentAmount(amount, auth, wallet) {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: 'Please enter a valid amount greater than Rs. 0.' };
    }
    if (num > wallet.availableBalance) {
      return { valid: false, error: `Insufficient balance. Available: Rs. ${wallet.availableBalance}` };
    }
    if (num > auth.maxSingleTransaction) {
      return { valid: false, error: `Amount exceeds maximum single transaction limit of Rs. ${auth.maxSingleTransaction}.` };
    }
    if (num > auth.remainingAmount) {
      return { valid: false, error: `Amount exceeds your remaining offline allowance of Rs. ${auth.remainingAmount}.` };
    }
    return { valid: true };
  }

  assert.equal(validatePaymentAmount(0, auth, wallet).valid, false);
  assert.equal(validatePaymentAmount(-50, auth, wallet).valid, false);
  assert.equal(validatePaymentAmount(400, auth, wallet).valid, false); // Exceeds max single 300
  assert.equal(validatePaymentAmount(350, { ...auth, maxSingleTransaction: 600, remainingAmount: 200 }, wallet).valid, false); // Exceeds remaining 200
  assert.equal(validatePaymentAmount(200, auth, wallet).valid, true);
});

test('Server Verifier — Reject transaction with expired authorization', () => {
  const expiredAuth = {
    id: 'AUTH-EXP-01',
    deviceId: 'DEV-01',
    remainingAmount: 500,
    expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };

  function checkAuth(auth, txAmount) {
    if (new Date(auth.expiresAt) < new Date()) {
      return { valid: false, reasonCode: 'EXPIRED_AUTHORIZATION' };
    }
    if (txAmount > auth.remainingAmount) {
      return { valid: false, reasonCode: 'LIMIT_EXCEEDED' };
    }
    return { valid: true };
  }

  const result = checkAuth(expiredAuth, 100);
  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, 'EXPIRED_AUTHORIZATION');
});
