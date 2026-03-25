import { extractBearerToken } from '../lib/admin-auth.js';
import { addMonthsToDate } from '../lib/access-ids.js';
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

function readAccessId(req) {
  const bodyAccessId = req.body?.accessId;
  const queryAccessId = req.query?.accessId;
  return String(bodyAccessId || queryAccessId || '').trim();
}

function parseDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMonths(value) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  if (!['POST', 'GET'].includes(req.method || '')) {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    sendJson(res, 405, { error: `Metodo nao permitido: ${req.method || 'desconhecido'}.` });
    return;
  }

  const token = extractBearerToken(req);
  if (!token) {
    sendJson(res, 401, { error: 'Token administrativo ausente.' });
    return;
  }

  const accessId = readAccessId(req);
  if (!accessId) {
    sendJson(res, 400, { error: 'accessId ausente.' });
    return;
  }

  try {
    const auth = getAuth();
    const session = await auth.verifyIdToken(token);

    if (!session?.uid) {
      sendJson(res, 401, { error: 'Sessao administrativa invalida ou expirada.' });
      return;
    }

    const firestore = getFirestore();
    const accessRef = firestore.collection('access_registry').doc(accessId);
    const snapshot = await accessRef.get();

    if (!snapshot.exists) {
      sendJson(res, 404, { error: 'ID nao encontrado.' });
      return;
    }

    const data = snapshot.data() || {};
    const resolvedPlan = getPlanById(String(data.planId || '').trim());
    const renewalMonths = parseMonths(req.body?.months || req.query?.months) || Number(resolvedPlan?.durationMonths || 0) || 1;
    const currentExpiry = parseDate(data.expiresAt);
    const baseline = currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
    const expiresAt = addMonthsToDate(baseline, renewalMonths);
    const details = getAccessStatusDetails({ expiresAt });

    await accessRef.update({
      expiresAt,
      status: details.status,
      paymentStatus: 'paid',
      paymentLabel: 'Plano renovado',
      renewedAt: new Date().toISOString()
    });

    sendJson(res, 200, {
      ok: true,
      accessId: data.accessId || accessId,
      name: data.name || 'Cliente',
      planId: data.planId || resolvedPlan?.id || 'mensal',
      planName: data.planName || resolvedPlan?.name || 'Plano nao definido',
      status: details.status,
      paymentLabel: 'Plano renovado',
      expiresAt,
      warning: details.warning,
      warningMessage: details.warningMessage,
      expiresAtLabel: details.expiresAtLabel
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao renovar o ID.'
    });
  }
}
