import { createAdminSessionToken, readAdminPassword } from '../lib/admin-auth.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const expectedPassword = readAdminPassword();
    if (!expectedPassword) {
      sendJson(res, 500, {
        error: 'Senha administrativa nao configurada.'
      });
      return;
    }

    const incomingPassword = String(req.body?.password || req.query?.password || '').trim();
    if (!incomingPassword) {
      sendJson(res, 400, { error: 'Informe a senha do painel.' });
      return;
    }

    if (incomingPassword !== expectedPassword) {
      sendJson(res, 401, { error: 'Senha invalida.' });
      return;
    }

    const token = createAdminSessionToken();
    sendJson(res, 200, { token });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao autenticar.'
    });
  }
}
