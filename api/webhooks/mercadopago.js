import { getFirestore } from '../../lib/firebase-admin.js';
import { addMonthsToDate, generateAccessId } from '../../lib/access-ids.js';
import { getMercadoPagoPayment } from '../../lib/mercadopago.js';
import { getPlanById } from '../../lib/plans.js';

function extractPaymentId(req) {
  return (
    req.query?.['data.id'] ||
    req.query?.id ||
    req.body?.data?.id ||
    req.body?.id ||
    null
  );
}

function extractEventType(req) {
  return (
    req.query?.type ||
    req.query?.topic ||
    req.body?.type ||
    req.body?.topic ||
    null
  );
}

function mapPaymentStatus(status) {
  if (status === 'approved') {
    return {
      status: 'active',
      paymentLabel: 'Pago'
    };
  }

  if (
    status === 'pending' ||
    status === 'in_process' ||
    status === 'in_mediation'
  ) {
    return {
      status: 'pending',
      paymentLabel: 'Aguardando confirmacao'
    };
  }

  return {
    status: 'blocked',
    paymentLabel: 'Nao confirmado'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const eventType = extractEventType(req);

    if (eventType && eventType !== 'payment') {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const paymentId = extractPaymentId(req);

    if (!paymentId) {
      res.status(400).json({ error: 'Evento sem payment id.' });
      return;
    }

    const payment = await getMercadoPagoPayment(paymentId);
    const checkoutSessionId =
      payment.external_reference ||
      payment.metadata?.checkoutSessionId ||
      payment.metadata?.sessionId ||
      null;

    if (!checkoutSessionId) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const firestore = getFirestore();
    const plan = getPlanById(payment.metadata?.planId || '');

    if (!plan) {
      res.status(400).json({ error: 'Plano nao encontrado para este pagamento.' });
      return;
    }

    const mappedStatus = mapPaymentStatus(payment.status);
    let accessId = null;
    let expiresAt = null;

    if (payment.status === 'approved' && plan) {
      const baseDate = payment.date_approved || new Date().toISOString();
      expiresAt = addMonthsToDate(baseDate, plan.durationMonths);
      accessId = generateAccessId();
    }

    if (accessId) {
      const accessRef = firestore.collection('access_registry').doc(accessId);
      const accessUpdatePayload = {
        accessId,
        checkoutSessionId,
        planId: plan.id,
        planName: plan.name,
        status: mappedStatus.status,
        paymentStatus: payment.status,
        paymentLabel: mappedStatus.paymentLabel,
        mpPaymentId: String(payment.id),
        mpStatusDetail: payment.status_detail || null,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      if (expiresAt) {
        accessUpdatePayload.expiresAt = expiresAt;
      }

      await accessRef.set(accessUpdatePayload, { merge: true });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: error?.message || 'Falha ao processar webhook do Mercado Pago.'
    });
  }
}
