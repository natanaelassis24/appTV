import { getAuth, getFirestore, getFirebaseConfig, getFirebaseAdmin } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

function extractBearerToken(req) {
  return String(req.headers?.authorization || req.headers?.Authorization || '').replace(/^Bearer\s+/i, '');
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

  const token = extractBearerToken(req);
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

    const snapshot = await firestore.collection('access_registry').limit(5).get();
    const entries = snapshot.docs.map(doc => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        accessId: data.accessId || doc.id,
        name: data.name || 'Cliente',
        planName: data.planName || 'Plano nao definido',
        status: data.status || 'pending',
        paymentLabel: data.paymentLabel || 'Aguardando confirmacao',
        expiresAt: data.expiresAt || null
      };
    });

    sendJson(res, 200, {
      ok: true,
      projectId,
      configuredProjectId: firebaseConfig?.projectId || null,
      collection: 'access_registry',
      readOk: true,
      totalDocs: snapshot.size,
      sampleEntries: entries,
      ownerUid: decoded.uid,
      ownerEmail: decoded.email || null
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao diagnosticar a leitura do Firestore.'
    });
  }
}
