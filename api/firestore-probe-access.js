import { extractBearerToken } from '../lib/admin-auth.js';
import { addMonthsToDate, generateAccessId } from '../lib/access-ids.js';
import { getAccessStatus } from '../lib/access-status.js';
import { getPlanById } from '../lib/plans.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendJson(res, 405, { error: `Metodo nao permitido: ${req.method || 'desconhecido'}.` });
    return;
  }

  const token = extractBearerToken(req);
  if (!token) {
    sendJson(res, 401, { error: 'Token administrativo ausente.' });
    return;
  }

  try {
    const firestore = getFirestore();
    const auth = getAuth();
    const session = await auth.verifyIdToken(token);

    if (!session?.uid) {
      sendJson(res, 401, { error: 'Sessao administrativa invalida ou expirada.' });
      return;
    }

    const input = req.body && Object.keys(req.body).length ? req.body : req.query || {};
    const name = String(input?.name || 'Cliente Prova').trim() || 'Cliente Prova';
    const planId = String(input?.planId || 'mensal').trim() || 'mensal';
    const resolvedPlan = getPlanById(planId);
    const planName = String(resolvedPlan?.name || 'Plano manual').trim() || 'Plano manual';
    const expiresInMonths = parseMonths(input?.expiresInMonths) || Number(resolvedPlan?.durationMonths || 0) || 1;
    const expiresAt = addMonthsToDate(new Date(), expiresInMonths);
    const accessId = generateAccessId();
    const accessRef = firestore.collection('access_registry').doc(accessId);

    await accessRef.set({
      accessId,
      name,
      planId,
      planName,
      status: getAccessStatus({ expiresAt }),
      paymentLabel: 'Prova Firestore',
      expiresAt,
      paymentStatus: 'paid',
      probe: true,
      createdAt: new Date().toISOString()
    });

    const snapshot = await accessRef.get();
    const data = snapshot.data() || {};

    sendJson(res, 200, {
      ok: true,
      accessId: data.accessId || accessId,
      name: data.name || name,
      planId: data.planId || planId,
      planName: data.planName || planName,
      status: data.status || 'active',
      paymentLabel: data.paymentLabel || 'Prova Firestore',
      expiresAt: data.expiresAt || expiresAt,
      createdAt: data.createdAt || null,
      probe: true
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao criar a prova no Firestore.'
    });
  }
}
