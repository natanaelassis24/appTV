import { getAuth, getFirestore, getFirebaseAdmin, getFirebaseConfig } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
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
    const firebaseConfig = getFirebaseConfig();
    const firestore = getFirestore();
    const projectId =
      adminApp?.options?.projectId ||
      adminApp?.options?.credential?.projectId ||
      firebaseConfig?.projectId ||
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
      configuredProjectId: firebaseConfig?.projectId || null,
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
