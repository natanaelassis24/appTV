import { getFirestore } from '../lib/firebase-admin.js';
import { getAccessStatusDetails, isTemporaryAccessPlan } from '../lib/access-status.js';

const accessStatusCache = globalThis.__appTvAccessStatusCache || new Map();
globalThis.__appTvAccessStatusCache = accessStatusCache;

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

function getCacheEntry(accessId) {
  const cached = accessStatusCache.get(accessId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAtMs && cached.expiresAtMs <= Date.now()) {
    accessStatusCache.delete(accessId);
    return null;
  }

  const payload = cached.payload || null;
  if (!payload) {
    accessStatusCache.delete(accessId);
    return null;
  }

  const expiresAt = String(payload.expiresAt || '').trim();
  if (payload.accessGranted && expiresAt) {
    const expiresDate = new Date(`${expiresAt}T00:00:00`);
    if (!Number.isNaN(expiresDate.getTime())) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const expiresStart = new Date(
        expiresDate.getFullYear(),
        expiresDate.getMonth(),
        expiresDate.getDate()
      );

      if (todayStart.getTime() > expiresStart.getTime()) {
        accessStatusCache.delete(accessId);
        return null;
      }
    }
  }

  return payload;
}

function setCacheEntry(accessId, payload, ttlMs) {
  if (!accessId || !payload || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    return;
  }

  accessStatusCache.set(accessId, {
    payload,
    expiresAtMs: Date.now() + ttlMs
  });
}

function getCacheTtlMs(details) {
  if (!details) {
    return 0;
  }

  if (details.status === 'blocked') {
    return 60 * 1000;
  }

  if (details.warning) {
    return 2 * 60 * 1000;
  }

  return 5 * 60 * 1000;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  const accessId = String(req.query?.id || req.query?.accessId || '').trim();
  if (!accessId) {
    sendJson(res, 400, { error: 'Informe o ID de acesso.' });
    return;
  }

  const cachedPayload = getCacheEntry(accessId);
  if (cachedPayload) {
    if (cachedPayload.status === 'blocked' && isTemporaryAccessPlan(cachedPayload)) {
      try {
        const firestore = getFirestore();
        await firestore.collection('access_registry').doc(accessId).delete();
      } catch {
        // ignore cleanup failures on cached responses
      }
      accessStatusCache.delete(accessId);
    }

    sendJson(res, 200, {
      ...cachedPayload,
      cacheHit: true
    });
    return;
  }

  try {
    const firestore = getFirestore();
    const doc = await firestore.collection('access_registry').doc(accessId).get();

    if (!doc.exists) {
      sendJson(res, 404, { error: 'ID nao encontrado.' });
      return;
    }

    const data = doc.data() || {};
    const details = getAccessStatusDetails(data);
    const payload = {
      accessId: data.accessId || doc.id,
      name: data.name || 'Cliente',
      planId: data.planId || 'manual',
      planName: data.planName || 'Plano nao definido',
      status: details.status,
      accessGranted: details.accessGranted,
      warning: details.warning,
      warningMessage: details.warningMessage,
      daysRemaining: details.daysRemaining,
      message: details.warning ? details.warningMessage : details.accessGranted ? 'Liberado' : 'Bloqueado',
      paymentLabel: data.paymentLabel || 'Aguardando confirmacao',
      expiresAt: data.expiresAt || null,
      expiresAtLabel: details.expiresAtLabel
    };

    if (details.status === 'blocked' && isTemporaryAccessPlan(data)) {
      try {
        await firestore.collection('access_registry').doc(accessId).delete();
      } catch {
        // ignore cleanup failures after validation
      }
      accessStatusCache.delete(accessId);
    }

    setCacheEntry(accessId, payload, getCacheTtlMs(details));
    sendJson(res, 200, {
      ...payload,
      cacheHit: false
    });
  } catch (error) {
    const fallbackPayload = getCacheEntry(accessId);
    if (fallbackPayload && /resource[_\s-]?exhausted|quota/i.test(String(error?.message || ''))) {
      sendJson(res, 200, {
        ...fallbackPayload,
        cacheHit: true,
        warning: true,
        warningMessage: fallbackPayload.warningMessage || 'Acesso validado pelo cache temporario.'
      });
      return;
    }

    sendJson(res, 500, {
      error: error?.message || 'Falha ao consultar o ID.'
    });
  }
}
