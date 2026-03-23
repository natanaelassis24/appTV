import { getBaseUrl } from '../lib/access-ids.js';
import { createMercadoPagoPayment } from '../lib/mercadopago.js';
import { getPlanById } from '../lib/plans.js';

function compactObject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, typeof value === 'object' && !Array.isArray(value) ? compactObject(value) : value])
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const { checkoutSessionId, planId, formData } = req.body || {};
    const plan = getPlanById(planId);

    if (!checkoutSessionId || !plan || !formData) {
      res.status(400).json({ error: 'Dados do pagamento incompletos.' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const paymentPayload = compactObject({
      ...formData,
      transaction_amount: Number(plan.price),
      description: plan.mercadopagoTitle,
      external_reference: checkoutSessionId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: {
        checkoutSessionId,
        planId: plan.id
      }
    });

    const payment = await createMercadoPagoPayment(paymentPayload);

    res.status(200).json({
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail || null,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticketUrl: payment.transaction_details?.external_resource_url || null
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || 'Falha ao processar o pagamento.'
    });
  }
}
