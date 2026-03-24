import { extractBearerToken } from '../lib/admin-auth.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS');
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'DELETE, POST, GET, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  if (!['DELETE', 'POST', 'GET'].includes(req.method || '')) {
    res.setHeader('Allow', 'DELETE, POST, GET, OPTIONS');
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
    await accessRef.delete();

    sendJson(res, 200, {
      ok: true,
      accessId: data.accessId || accessId,
      name: data.name || 'Cliente',
      planName: data.planName || 'Plano nao definido'
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao excluir o ID.'
    });
  }
}
