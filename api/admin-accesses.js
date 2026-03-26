import { extractBearerToken } from '../lib/admin-auth.js';
import {
  getAccessStatusDetails,
  isTemporaryAccessPlan,
  parseAccessDateValue
} from '../lib/access-status.js';
import { getPlanById } from '../lib/plans.js';
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

  const date = parseAccessDateValue(value);
  if (!date || Number.isNaN(date.getTime())) {
    return value;
  }

  const raw = String(value || '').trim();
  const hasTime = /T\d{2}:\d{2}/.test(raw) || /:\d{2}/.test(raw) && !/^\d{4}-\d{2}-\d{2}$/.test(raw);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(hasTime ? { timeStyle: 'short' } : {})
  }).format(date);
}

function normalizeEntry(doc) {
  const data = doc.data();
  const plan = getPlanById(data?.planId);
  const details = getAccessStatusDetails({
    ...data,
    planDurationMonths: data?.planDurationMonths || plan?.durationMonths || null,
    planDurationHours: data?.planDurationHours || plan?.durationHours || null
  });
  return {
    accessId: data?.accessId || doc.id,
    name: data?.name || 'Cliente',
    planName: data?.planName || 'Plano nao definido',
    planId: data?.planId || 'manual',
    status: details.status,
    warning: details.warning,
    warningMessage: details.warningMessage,
    paymentLabel: data?.paymentLabel || 'Aguardando confirmacao',
    expiresAt: data?.expiresAt || null,
    expiresAtLabel: details.expiresAtLabel,
    createdAt: data?.createdAt || null
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

    const expiredTemporaryDocs = snapshot.docs.filter(doc => {
      const data = doc.data();
      return isTemporaryAccessPlan(data) && getAccessStatusDetails(data).status === 'blocked';
    });

    if (expiredTemporaryDocs.length > 0) {
      await Promise.all(
        expiredTemporaryDocs.map(doc => firestore.collection('access_registry').doc(doc.id).delete())
      );
    }

    const expiredTemporaryIds = new Set(expiredTemporaryDocs.map(doc => doc.id));

    const entries = snapshot.docs
      .filter(doc => !expiredTemporaryIds.has(doc.id))
      .map(normalizeEntry)
      .sort((left, right) => {
        const leftDate = parseAccessDateValue(left.expiresAt);
        const rightDate = parseAccessDateValue(right.expiresAt);
        const leftStamp = leftDate ? leftDate.getTime() : 0;
        const rightStamp = rightDate ? rightDate.getTime() : 0;

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
