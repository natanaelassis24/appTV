import crypto from 'node:crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return '';
}

export function readAdminPassword() {
  return readEnv('ADMIN_PANEL_PASSWORD', 'ADMIN_PASSWORD');
}

export function readAdminSessionSecret() {
  return readEnv('ADMIN_SESSION_SECRET', 'ADMIN_TOKEN_SECRET', 'ADMIN_PANEL_PASSWORD');
}

export function createAdminSessionToken(payload = {}) {
  const secret = readAdminSessionSecret();

  if (!secret) {
    throw new Error('Defina ADMIN_SESSION_SECRET ou ADMIN_TOKEN_SECRET nas variaveis.');
  }

  const sessionPayload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    ...payload
  };

  const encoded = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token) {
    return null;
  }

  const secret = readAdminSessionSecret();
  if (!secret) {
    return null;
  }

  const [encoded, signature] = String(token).split('.');
  if (!encoded || !signature) {
    return null;
  }

  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const provided = Buffer.from(signature);
  const required = Buffer.from(expected);

  if (provided.length !== required.length || !crypto.timingSafeEqual(provided, required)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.expiresAt || Date.now() > Number(payload.expiresAt)) {
      return null;
    }

    return payload;
  } catch (_) {
    return null;
  }
}

export function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}
