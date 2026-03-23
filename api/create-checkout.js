import { generateCheckoutSessionId, getBaseUrl } from '../lib/access-ids.js';
import { getMercadoPagoPublicKey } from '../lib/mercadopago.js';
import { getPlanById } from '../lib/plans.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const planId = req.body?.planId;
    const plan = getPlanById(planId);

    if (!plan) {
      res.status(400).json({ error: 'Plano invalido.' });
      return;
    }

    const checkoutSessionId = generateCheckoutSessionId();
    const baseUrl = getBaseUrl(req);

    res.status(200).json({
      checkoutSessionId,
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
