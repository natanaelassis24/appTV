import { getAuth, getFirestore, getFirebaseAdmin } from '../lib/firebase-admin.js';

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

    const adminApp = getFirebaseAdmin();
    const firestore = getFirestore();
    const projectId =
      adminApp?.options?.projectId ||
      adminApp?.options?.credential?.projectId ||
      null;

    const ref = firestore.collection('__diagnostics__').doc(`probe_${Date.now()}`);
    const payload = {
      ownerUid: decoded.uid,
      ownerEmail: decoded.email || null,
      createdAt: new Date().toISOString()
    };

    await ref.set(payload);
    const snapshot = await ref.get();
    const stored = snapshot.data() || null;
    await ref.delete();

    sendJson(res, 200, {
      ok: true,
      projectId,
      writeOk: true,
      readOk: Boolean(snapshot.exists),
      deleteOk: true,
      stored: stored ? { createdAt: stored.createdAt || null } : null
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao diagnosticar o Firebase.'
    });
  }
}
