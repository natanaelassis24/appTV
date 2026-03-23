import { getFirestore } from '../lib/firebase-admin.js';

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const firestore = getFirestore();
    const snapshot = await firestore.collection('admin_config').doc('panel').get();

    sendJson(res, 200, {
      setupRequired: !snapshot.exists,
      configured: snapshot.exists
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao verificar o admin.'
    });
  }
}
