import { getFirestore } from '../lib/firebase-admin.js';

function buildMessage(entry) {
  if (entry.status === 'active') {
    return 'Pagamento confirmado e acesso liberado no aplicativo Android TV.';
  }

  if (entry.status === 'pending') {
    return 'Pagamento ainda nao confirmado. Assim que a compensacao ocorrer, o acesso sera liberado.';
  }

  return 'Esse ID esta bloqueado no momento. Revise o pagamento ou entre em contato no Telegram.';
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Nao definida';
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short'
    }).format(new Date(`${dateValue}T00:00:00`));
  } catch (_) {
    return dateValue;
  }
}

function normalizeEntry(entry) {
  return {
    accessId: entry.accessId,
    name: entry.name || 'Cliente',
    planId: entry.planId || 'nao-definido',
    planName: entry.planName || 'Plano nao definido',
    status: entry.status || 'pending',
    paymentStatus: entry.paymentStatus || 'pending',
    paymentLabel: entry.paymentLabel || 'Aguardando confirmacao',
    expiresAt: entry.expiresAt || null,
    expiresAtLabel: formatDate(entry.expiresAt),
    message: buildMessage(entry)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const accessId = String(req.query.id || '')
    .trim()
    .toUpperCase();

  if (!accessId) {
    res.status(400).json({ error: 'Informe um ID de acesso.' });
    return;
  }

  try {
    const firestore = getFirestore();
    const accessRef = firestore.collection('access_registry').doc(accessId);
    const accessSnapshot = await accessRef.get();

    if (!accessSnapshot.exists) {
      res.status(404).json({ error: 'ID de acesso nao encontrado.' });
      return;
    }

    const entry = accessSnapshot.data();

    res.status(200).json(normalizeEntry(entry));
  } catch (error) {
    res.status(500).json({
      error:
        error?.message ||
        'Falha ao consultar o registro de acesso no Firebase.'
    });
  }
}
