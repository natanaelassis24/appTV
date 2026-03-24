import { extractBearerToken } from '../lib/admin-auth.js';
import { getAccessStatusDetails } from '../lib/access-status.js';
import { getAuth, getFirestore } from '../lib/firebase-admin.js';

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.status(statusCode).json(payload);
}

function readStatusFilter(req) {
  return String(req.query?.status || 'active').trim().toLowerCase();
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

function normalizeEntry(doc) {
  const data = doc.data();
  const details = getAccessStatusDetails(data);
  return {
    accessId: data?.accessId || doc.id,
    name: data?.name || 'Cliente',
    planName: data?.planName || 'Plano nao definido',
    status: details.status,
    warning: details.warning,
    warningMessage: details.warningMessage,
    paymentLabel: data?.paymentLabel || 'Aguardando confirmacao',
    expiresAt: data?.expiresAt || null,
    expiresAtLabel: details.expiresAtLabel
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 204, null);
    return;
  }

  const token = extractBearerToken(req);

  try {
    const firestore = getFirestore();
    const auth = getAuth();
    const session = await auth.verifyIdToken(token);

    if (!session?.uid) {
      sendJson(res, 401, { error: 'Sessao administrativa invalida ou expirada.' });
      return;
    }

    const snapshot = await firestore.collection('access_registry').get();

    const entries = snapshot.docs
      .map(normalizeEntry)
      .sort((left, right) => {
        const leftStamp = left.expiresAt ? new Date(`${left.expiresAt}T00:00:00`).getTime() : 0;
        const rightStamp = right.expiresAt ? new Date(`${right.expiresAt}T00:00:00`).getTime() : 0;

        if (rightStamp !== leftStamp) {
          return rightStamp - leftStamp;
        }

        return String(left.accessId).localeCompare(String(right.accessId));
      });

    const counts = entries.reduce(
      (accumulator, entry) => {
        accumulator.all += 1;
        if (entry.status in accumulator) {
          accumulator[entry.status] += 1;
        }
        return accumulator;
      },
      { all: 0, active: 0, pending: 0, blocked: 0 }
    );

    const statusFilter = readStatusFilter(req);
    const filteredEntries =
      statusFilter === 'all' ? entries : entries.filter(entry => entry.status === statusFilter);

    sendJson(res, 200, {
      entries: filteredEntries,
      counts
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error?.message || 'Falha ao carregar os registros.'
    });
  }
}
