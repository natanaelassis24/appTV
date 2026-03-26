import { extractBearerToken } from '../lib/admin-auth.js';
import { addHoursToDate, addMonthsToDate, generateAccessId } from '../lib/access-ids.js';
import { getAccessStatusDetails } from '../lib/access-status.js';
import { getPlanById } from '../lib/plans.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

function parseMonths(value) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseHours(value) {
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

  const token = extractBearerToken(req);

  const input = req.body && Object.keys(req.body).length ? req.body : req.query || {};
  const name = String(input?.name || 'Cliente').trim() || 'Cliente';
  const planId = String(input?.planId || 'mensal').trim() || 'mensal';
  const resolvedPlan = getPlanById(planId);
  const isTemporaryAccess = planId === 'temporary_2h' || planId === 'temporario_2h';
  const planName = String(
    resolvedPlan?.name ||
      input?.planName ||
      (isTemporaryAccess ? 'Acesso temporario 2h' : 'Plano manual')
  ).trim() || 'Plano manual';
  const paymentLabel = String(input?.paymentLabel || 'Gerado manualmente').trim() || 'Gerado manualmente';
  const expiresAtInput = parseDate(input?.expiresAt);
  const expiresInMonths = parseMonths(input?.expiresInMonths);
  const expiresInHours = parseHours(input?.expiresInHours) || (isTemporaryAccess ? 2 : null);

  try {
    const firestore = getFirestore();
    const auth = getAuth();
    const session = await auth.verifyIdToken(token);

    if (!session?.uid) {
      sendJson(res, 401, { error: 'Sessao administrativa invalida ou expirada.' });
      return;
    }

    let generated = null;
    let generatedDetails = null;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const accessId = generateAccessId();
      const accessRef = firestore.collection('access_registry').doc(accessId);
      const snapshot = await accessRef.get();

      if (snapshot.exists) {
        continue;
      }

      const planDurationMonths = Number(resolvedPlan?.durationMonths || 0) || null;
      const planDurationHours = isTemporaryAccess ? 2 : Number(resolvedPlan?.durationHours || 0) || null;
      const expiresAt =
        expiresAtInput ||
        (expiresInHours ? addHoursToDate(new Date(), expiresInHours) : null) ||
        (expiresInMonths ? addMonthsToDate(new Date(), expiresInMonths) : null) ||
        (planDurationMonths ? addMonthsToDate(new Date(), planDurationMonths) : null);
      const details = getAccessStatusDetails({ expiresAt });
      generatedDetails = details;

      await accessRef.set({
        accessId,
        name,
        planId,
        planName,
        planDurationMonths,
        planDurationHours,
        status: details.status,
        paymentLabel: isTemporaryAccess ? 'Acesso temporario' : paymentLabel,
        expiresAt,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString()
      });

      generated = {
        accessId,
        name,
        planId,
        planName,
        planDurationMonths,
        planDurationHours,
        status: details.status,
        paymentLabel: isTemporaryAccess ? 'Acesso temporario' : paymentLabel,
        expiresAt,
        warning: details.warning,
        warningMessage: details.warningMessage
      };

      break;
    }

    if (!generated) {
      throw new Error('Nao foi possivel gerar um ID unico. Tente novamente.');
    }

    sendJson(res, 200, {
      ...generated,
      expiresAtLabel: generatedDetails?.expiresAtLabel || generated.expiresAt || 'Nao definida'
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao gerar o ID.'
    });
  }
}
