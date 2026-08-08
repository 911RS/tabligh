import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { secrets, updateSecrets } from './store/store.js';
import { env } from './config.js';

/** Hash a panel password: scrypt with a random salt → "salt:hash" (hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Verify a password against a stored "salt:hash". */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = (stored || '').split(':');
  if (!saltHex || !hashHex) return false;
  const hash = Buffer.from(hashHex, 'hex');
  const test = scryptSync(password, Buffer.from(saltHex, 'hex'), 32);
  return hash.length === test.length && timingSafeEqual(hash, test);
}

/**
 * The env-supplied panel password, hashed once at boot.
 *
 * Hashed rather than compared as a string so the same scrypt + timingSafeEqual
 * path guards it as the stored one, with no length leak and no early-exit
 * comparison. The salt is per-process and never persisted — there is nothing to
 * store, the source of truth is the environment.
 */
const envPasswordHash = env.panelPassword ? hashPassword(env.panelPassword) : '';

/** True when the operator set PANEL_PASSWORD, so there is nothing to claim. */
export function panelPasswordConfigured(): boolean {
  return envPasswordHash !== '';
}

/**
 * Check a login against whichever password is in force.
 *
 * PANEL_PASSWORD wins over the stored hash: an operator who sets it in the
 * environment expects that to be the credential, and it must not be possible
 * for a value in the data volume to override what the environment says.
 */
export function verifyPanelPassword(password: string): boolean {
  if (envPasswordHash) return verifyPassword(password, envPasswordHash);
  return verifyPassword(password, secrets().panelPasswordHash);
}

/** Ensure a session-signing secret exists (generate + persist on first use). */
function sessionSecret(): string {
  let s = secrets().sessionSecret;
  if (!s) {
    s = randomBytes(32).toString('hex');
    updateSecrets({ sessionSecret: s });
  }
  return s;
}

const SESSION_TTL_MS = 30 * 24 * 3600_000; // 30 days

/** Signed session token: base64(payload).hmac — no server-side session store. */
export function signSession(): string {
  const payload = Buffer.from(JSON.stringify({ exp: nowMs() + SESSION_TTL_MS })).toString('base64url');
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > nowMs();
  } catch {
    return false;
  }
}

/** Read a cookie value from a request's Cookie header. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

// Date.now via a wrapper so the module stays testable/mockable.
function nowMs(): number {
  return Date.now();
}

export const SESSION_COOKIE = 'tabligh_session';
