import { getFirestore } from '../lib/firebase-admin.js';
import { getAccessStatus } from '../lib/access-status.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

function getStatusMessage(status) {
  if (status === 'active') {
    return 'Liberado';
  }

  return 'Bloqueado';
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

  try {
    const firestore = getFirestore();
    const doc = await firestore.collection('access_registry').doc(accessId).get();

    if (!doc.exists) {
      sendJson(res, 404, { error: 'ID nao encontrado.' });
      return;
    }

    const data = doc.data() || {};
    const status = getAccessStatus(data);
    const accessGranted = status === 'active';
    sendJson(res, 200, {
      accessId: data.accessId || doc.id,
      name: data.name || 'Cliente',
      planId: data.planId || 'manual',
      planName: data.planName || 'Plano nao definido',
      accessGranted,
      message: getStatusMessage(status),
      paymentLabel: data.paymentLabel || 'Aguardando confirmacao',
      expiresAt: data.expiresAt || null
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao consultar o ID.'
    });
  }
}
