import { generateCheckoutSessionId, getBaseUrl } from '../lib/access-ids.js';
import { createMercadoPagoPreference, getMercadoPagoPublicKey } from '../lib/mercadopago.js';
import { getPlanById } from '../lib/plans.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const planId = String(req.body?.planId || req.query?.planId || '').trim();
    const plan = getPlanById(planId);

    if (!plan) {
      res.status(400).json({ error: 'Plano invalido.' });
      return;
    }

    const checkoutSessionId = generateCheckoutSessionId();
    const baseUrl = getBaseUrl(req);
    const preference = await createMercadoPagoPreference({
      items: [
        {
          id: plan.id,
          title: plan.mercadopagoTitle,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: 'BRL'
        }
      ],
      external_reference: checkoutSessionId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: {
        checkoutSessionId,
        planId: plan.id
      }
    });

    res.status(200).json({
      checkoutSessionId,
      preferenceId: preference.id,
      checkoutUrl: preference.sandbox_init_point || preference.init_point || null,
      publicKey: getMercadoPagoPublicKey(),
      amount: plan.price,
      title: plan.mercadopagoTitle,
      planId: plan.id,
      callbackBaseUrl: baseUrl
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || 'Falha ao criar o checkout.'
    });
  }
}
