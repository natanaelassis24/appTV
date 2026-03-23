import { generateCheckoutSessionId, getBaseUrl } from '../lib/access-ids.js';
import { createMercadoPagoPreference } from '../lib/mercadopago.js';
import { getPlanById } from '../lib/plans.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const planId =
      req.method === 'GET'
        ? req.query?.planId
        : req.body?.planId;
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
          currency_id: 'BRL',
          unit_price: plan.price
        }
      ],
      external_reference: checkoutSessionId,
      metadata: {
        checkoutSessionId,
        planId: plan.id
      },
      back_urls: {
        success: `${baseUrl}/?checkout=success`,
        pending: `${baseUrl}/?checkout=pending`,
        failure: `${baseUrl}/?checkout=failure`
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    });

    if (req.method === 'GET') {
      res.writeHead(302, {
        Location: preference.init_point
      });
      res.end();
      return;
    }

    res.status(200).json({
      checkoutSessionId,
      checkoutUrl: preference.init_point,
      sandboxCheckoutUrl: preference.sandbox_init_point || null
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || 'Falha ao criar o checkout.'
    });
  }
}
