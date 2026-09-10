// NORMAL ULTIMAX CONTROL
// Separate from KAI ULTIMAX. This file owns only Normal API authorization/target policy.

export const NORMAL_ULTIMAX_CONTROL = Object.freeze({
  identity: Object.freeze({ name: 'NORMAL API', surface: 'ADMIN_ULTIMAX_NORMAL_ONLY' }),
  authorization: Object.freeze({ required: true, ownerOnly: true, tokenRequired: true }),
  targets: Object.freeze({
    allowLocalhost: false,
    allowPrivateIPs: false,
    allowedProtocols: Object.freeze(['http:', 'https:']),
    rejectEmbeddedCredentials: true
  })
});

function tokenFromRequest(req) {
  const h = String(req?.headers?.authorization || '');
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signAdmin69(issuedAt, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(issuedAt));
  return b64url(new Uint8Array(sig));
}

export async function verifyAdmin69Authorization(req) {
  const token = tokenFromRequest(req);
  const secret = String(process.env.ADMIN69_PASSWORD || '');
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^\d+$/.test(parts[0])) return false;
  const issuedAt = Number(parts[0]);
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < -60 || age > 3600) return false;
  const expected = await signAdmin69(parts[0], secret);
  return expected === parts[1];
}

export function normalTargetHostIsPrivate(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true;
  const m = host.match(/^172\.(\d{1,3})\./);
  return !!(m && Number(m[1]) >= 16 && Number(m[1]) <= 31);
}

export function validateNormalTarget(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw new Error('A valid http:// or https:// target is required.'); }
  if (!NORMAL_ULTIMAX_CONTROL.targets.allowedProtocols.includes(url.protocol)) throw new Error('Unsupported target protocol.');
  if (NORMAL_ULTIMAX_CONTROL.targets.rejectEmbeddedCredentials && (url.username || url.password)) throw new Error('Embedded target credentials are not allowed.');
  if (!NORMAL_ULTIMAX_CONTROL.targets.allowLocalhost && normalTargetHostIsPrivate(url.hostname)) throw new Error('Local/private targets are disabled.');
  if (!NORMAL_ULTIMAX_CONTROL.targets.allowPrivateIPs && normalTargetHostIsPrivate(url.hostname)) throw new Error('Private IP targets are disabled.');
  return url;
}