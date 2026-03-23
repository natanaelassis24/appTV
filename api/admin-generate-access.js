import { extractBearerToken } from '../lib/admin-auth.js';
import { addMonthsToDate, generateAccessId } from '../lib/access-ids.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function normalizeStatus(value) {
  const status = String(value || 'pending').trim().toLowerCase();
  return ['active', 'pending', 'blocked'].includes(status) ? status : 'pending';
}

function parseMonths(value) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return raw;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  const token = extractBearerToken(req);

  const name = String(req.body?.name || 'Cliente').trim() || 'Cliente';
  const planName = String(req.body?.planName || 'Plano manual').trim() || 'Plano manual';
  const planId = String(req.body?.planId || 'manual').trim() || 'manual';
  const status = normalizeStatus(req.body?.status);
  const paymentLabel = String(req.body?.paymentLabel || 'Gerado manualmente').trim() || 'Gerado manualmente';
  const expiresAtInput = parseDate(req.body?.expiresAt);
  const expiresInMonths = parseMonths(req.body?.expiresInMonths);

  try {
    const firestore = getFirestore();
    const auth = getAuth();
    const session = await auth.verifyIdToken(token);

    if (!session?.uid) {
      sendJson(res, 401, { error: 'Sessao administrativa invalida ou expirada.' });
      return;
    }

    let generated = null;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const accessId = generateAccessId();
      const accessRef = firestore.collection('access_registry').doc(accessId);
      const snapshot = await accessRef.get();

      if (snapshot.exists) {
        continue;
      }

      const expiresAt =
        expiresAtInput || (expiresInMonths ? addMonthsToDate(new Date(), expiresInMonths) : null);

      await accessRef.set({
        accessId,
        name,
        planId,
        planName,
        status,
        paymentLabel,
        expiresAt,
        paymentStatus: status === 'active' ? 'paid' : 'manual',
        createdAt: new Date().toISOString()
      });

      generated = {
        accessId,
        name,
        planId,
        planName,
        status,
        paymentLabel,
        expiresAt
      };

      break;
    }

    if (!generated) {
      throw new Error('Nao foi possivel gerar um ID unico. Tente novamente.');
    }

    sendJson(res, 200, {
      ...generated,
      expiresAtLabel: generated.expiresAt || 'Nao definida'
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao gerar o ID.'
    });
  }
}
