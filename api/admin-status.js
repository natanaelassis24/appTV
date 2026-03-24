import { getAuth } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
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
