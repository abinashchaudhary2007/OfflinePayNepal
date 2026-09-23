/**
 * crypto.js — Cryptographic utilities using Web Crypto API
 * 
 * Uses ECDSA with P-256 curve (widely supported, Ed25519 not yet
 * available in SubtleCrypto in all browsers as of 2026).
 * 
 * DEMO SYSTEM — Educational prototype only.
 * - Private keys are stored in IndexedDB as non-extractable CryptoKey objects
 * - Private keys NEVER leave the device
 * - Only public keys are shared/registered
 * 
 * Security note: In a production system, you would use a hardware security
 * module or Secure Enclave. This prototype stores keys in IndexedDB which
 * provides reasonable isolation for a demo application.
 */

import { saveKeyMaterial, getKeyMaterial } from './db.js';

const KEY_ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_ALGORITHM = { name: 'ECDSA', hash: 'SHA-256' };

const getSubtle = () => (typeof window !== 'undefined' ? window.crypto.subtle : globalThis.crypto.subtle);
const getCrypto = () => (typeof window !== 'undefined' ? window.crypto : globalThis.crypto);

/**
 * Generate a new ECDSA P-256 key pair for a device.
 * The private key is non-extractable and stored only in IndexedDB.
 * Returns the public key as a JWK (JSON Web Key) for server registration.
 */
export async function generateDeviceKeyPair(deviceId) {
  const subtle = getSubtle();
  const keyPair = await subtle.generateKey(
    KEY_ALGORITHM,
    false, // non-extractable private key
    ['sign', 'verify']
  );

  // Export public key as JWK for server registration
  const publicKeyJwk = await subtle.exportKey('jwk', keyPair.publicKey);

  // Store keys in IndexedDB — private key as CryptoKey object (non-extractable)
  await saveKeyMaterial(deviceId, {
    privateKey: keyPair.privateKey,  // CryptoKey — not plain bytes
    publicKey: keyPair.publicKey,    // CryptoKey
    publicKeyJwk,
    algorithm: KEY_ALGORITHM.namedCurve,
    createdAt: new Date().toISOString(),
  });

  return { publicKeyJwk };
}

/**
 * Load existing key pair for a device from IndexedDB.
 * Returns null if not found.
 */
export async function loadDeviceKeys(deviceId) {
  return getKeyMaterial(deviceId);
}

/**
 * Sign a transaction payload using the device's private key.
 * Returns a base64-encoded signature string.
 * 
 * @param {string} deviceId - Device ID to look up keys
 * @param {object} payload  - Transaction object to sign
 */
export async function signTransaction(deviceId, payload) {
  const keys = await loadDeviceKeys(deviceId);
  if (!keys || !keys.privateKey) {
    throw new Error('Device keys not found. Device may not be registered.');
  }

  // Create canonical string representation (sorted keys for determinism)
  const canonicalPayload = canonicalize(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalPayload);

  const signatureBuffer = await getSubtle().sign(
    SIGN_ALGORITHM,
    keys.privateKey,
    data
  );

  // Convert ArrayBuffer to base64 string for transport/storage
  const signatureB64 = arrayBufferToBase64(signatureBuffer);
  return signatureB64;
}

/**
 * Verify a transaction signature using a public key JWK.
 * Used by the receiver to locally verify an incoming payment.
 * 
 * @param {object} publicKeyJwk - Sender's public key as JWK
 * @param {object} payload      - Transaction payload (without signature)
 * @param {string} signatureB64 - Base64-encoded signature
 */
export async function verifyTransactionSignature(publicKeyJwk, payload, signatureB64) {
  try {
    const publicKey = await getSubtle().importKey(
      'jwk',
      publicKeyJwk,
      KEY_ALGORITHM,
      true,
      ['verify']
    );

    const canonicalPayload = canonicalize(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalPayload);
    const signatureBuffer = base64ToArrayBuffer(signatureB64);

    const isValid = await getSubtle().verify(
      SIGN_ALGORITHM,
      publicKey,
      signatureBuffer,
      data
    );

    return isValid;
  } catch (err) {
    console.error('[crypto] Signature verification failed:', err);
    return false;
  }
}

/**
 * Generate a cryptographically secure nonce.
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  getCrypto().getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique transaction ID.
 */
export function generateTransactionId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TX-${ts}-${rand}`;
}

/**
 * Generate a unique device ID.
 */
export function generateDeviceId() {
  const array = new Uint8Array(4);
  getCrypto().getRandomValues(array);
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `DEV-${hex}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Deterministic JSON stringify — sorts keys for canonical form.
 */
function canonicalize(obj) {
  if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
