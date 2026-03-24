import { extractBearerToken } from '../lib/admin-auth.js';
import { addMonthsToDate, generateAccessId } from '../lib/access-ids.js';
import { getAccessStatus } from '../lib/access-status.js';
import { getPlanById } from '../lib/plans.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
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

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const normalized = `${year}-${month}-${day}`;
    const date = new Date(`${normalized}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return normalized;
    }
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return raw;
    }
  }

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return raw;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  if (!['POST', 'GET'].includes(req.method)) {
    sendJson(res, 405, { error: `Metodo nao permitido: ${req.method || 'desconhecido'}.` });
    return;
  }

  const token = extractBearerToken(req);

  const input = req.method === 'GET' ? req.query || {} : req.body || {};
  const name = String(input?.name || 'Cliente').trim() || 'Cliente';
  const planId = String(input?.planId || 'mensal').trim() || 'mensal';
  const resolvedPlan = getPlanById(planId);
  const planName = String(resolvedPlan?.name || input?.planName || 'Plano manual').trim() || 'Plano manual';
  const paymentLabel = String(input?.paymentLabel || 'Gerado manualmente').trim() || 'Gerado manualmente';
  const expiresAtInput = parseDate(input?.expiresAt);
  const expiresInMonths = parseMonths(input?.expiresInMonths);

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

      const planDurationMonths = Number(resolvedPlan?.durationMonths || 0) || null;
      const expiresAt =
        expiresAtInput ||
        (expiresInMonths ? addMonthsToDate(new Date(), expiresInMonths) : null) ||
        (planDurationMonths ? addMonthsToDate(new Date(), planDurationMonths) : null);
      const status = getAccessStatus({ expiresAt });

      await accessRef.set({
        accessId,
        name,
        planId,
        planName,
        status,
        paymentLabel,
        expiresAt,
        paymentStatus: 'paid',
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
