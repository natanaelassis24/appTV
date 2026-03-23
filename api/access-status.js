import { getFirestore } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function readAccessId(req) {
  return String(req.query?.id || req.body?.id || '').trim().toUpperCase();
}

function formatDateLabel(value) {
  if (!value) {
    return 'Nao definida';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function buildPayload(record, accessId) {
  const status = record?.status || 'blocked';
  const planName = record?.planName || 'Plano nao definido';
  const paymentLabel = record?.paymentLabel || 'Aguardando confirmacao';
  const expiresAt = record?.expiresAt || null;

  const messages = {
    active: 'Acesso liberado.',
    pending: 'Pagamento pendente.',
    blocked: 'Acesso bloqueado.'
  };

  return {
    accessId: record?.accessId || accessId,
    name: record?.name || 'Cliente',
    planName,
    status,
    paymentLabel,
    expiresAt,
    expiresAtLabel: formatDateLabel(expiresAt),
    message: messages[status] || 'Status desconhecido.'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  const accessId = readAccessId(req);
  if (!accessId) {
    sendJson(res, 400, { error: 'Informe um ID de acesso.' });
    return;
  }

  try {
    const firestore = getFirestore();
    const doc = await firestore.collection('access_registry').doc(accessId).get();

    if (doc.exists) {
      sendJson(res, 200, buildPayload(doc.data(), accessId));
      return;
    }

    const fallback = await firestore
      .collection('access_registry')
      .where('accessId', '==', accessId)
      .limit(1)
      .get();

    if (!fallback.empty) {
      sendJson(res, 200, buildPayload(fallback.docs[0].data(), accessId));
      return;
    }

    sendJson(res, 200, {
      accessId,
      name: 'Cliente',
      planName: 'Plano nao encontrado',
      status: 'blocked',
      paymentLabel: 'Nao localizado',
      expiresAt: null,
      expiresAtLabel: 'Nao definida',
      message: 'ID nao encontrado.'
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao consultar o ID.'
    });
  }
}
