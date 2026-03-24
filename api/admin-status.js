import { getAuth } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: `Metodo nao permitido: ${req.method || 'desconhecido'}.` });
    return;
  }

  try {
    const auth = getAuth();
    const result = await auth.listUsers(1);
    const configured = Array.isArray(result?.users) && result.users.length > 0;

    sendJson(res, 200, {
      setupRequired: !configured,
      configured
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao verificar o admin.'
    });
  }
}
