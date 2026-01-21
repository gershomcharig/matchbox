/**
 * Password hashing utilities using Web Crypto API (PBKDF2)
 * Works in both browser and Node.js environments
 */

const ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert ArrayBuffer or Uint8Array to hex string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derive a key from password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    ALGORITHM,
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH
  );
}

/**
 * Hash a password
 * Returns a string in format: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const derivedKey = await deriveKey(password, salt);

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedKey);

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * @param password - The password to verify
 * @param storedHash - The stored hash in format salt:hash
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');

  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = hexToBuffer(saltHex);
  const derivedKey = await deriveKey(password, salt);
  const derivedHashHex = bufferToHex(derivedKey);

  // Constant-time comparison to prevent timing attacks
  if (derivedHashHex.length !== hashHex.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < derivedHashHex.length; i++) {
    result |= derivedHashHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Session token management
 */
const SESSION_TOKEN_KEY = 'matchbox_session_token';
const TOKEN_LENGTH = 32; // 32 bytes = 256 bits

/**
 * Generate a cryptographically secure session token
 * Returns a URL-safe base64 string
 */
export function generateSessionToken(): string {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));
  const tokenHex = bufferToHex(tokenBytes);

  // Convert to base64url for URL-safe storage
  const base64 = btoa(
    String.fromCharCode.apply(null, Array.from(tokenBytes))
  );

  // Make it URL-safe: replace + with -, / with _, and remove =
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Store session token in localStorage
 * @param token - The session token to store
 */
export function setSessionToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

/**
 * Retrieve session token from localStorage
 * @returns The session token or null if not found
 */
export function getSessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }
  return null;
}

/**
 * Clear session token from localStorage
 */
export function clearSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

/**
 * Check if user has a valid session
 * For now, just checks if token exists
 * Later phases will add server-side validation
 */
export function isAuthenticated(): boolean {
  return getSessionToken() !== null;
}
