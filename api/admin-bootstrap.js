import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  const token = String(req.headers?.authorization || req.headers?.Authorization || '').replace(
    /^Bearer\s+/i,
    ''
  );

  if (!token) {
    sendJson(res, 401, { error: 'Token administrativo ausente.' });
    return;
  }

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);

    if (!decoded?.uid) {
      sendJson(res, 401, { error: 'Token administrativo invalido.' });
      return;
    }

    const firestore = getFirestore();
    const ref = firestore.collection('admin_config').doc('panel');
    const snapshot = await ref.get();

    if (snapshot.exists) {
      sendJson(res, 409, { error: 'O painel admin ja foi configurado.' });
      return;
    }

    await ref.set({
      configured: true,
      ownerUid: decoded.uid,
      ownerEmail: decoded.email || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao inicializar o painel.'
    });
  }
}
