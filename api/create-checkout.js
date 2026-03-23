import { getFirestore } from '../lib/firebase-admin.js';
import { generateAccessId, getBaseUrl } from '../lib/access-ids.js';
import { createMercadoPagoPreference } from '../lib/mercadopago.js';
import { getPlanById } from '../lib/plans.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const { planId } = req.body || {};
    const plan = getPlanById(planId);

    if (!plan) {
      res.status(400).json({ error: 'Plano invalido.' });
      return;
    }

    const firestore = getFirestore();
    const accessId = generateAccessId();
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
      external_reference: accessId,
      metadata: {
        accessId,
        planId: plan.id
      },
      back_urls: {
        success: `${baseUrl}/?checkout=success&accessId=${accessId}`,
        pending: `${baseUrl}/?checkout=pending&accessId=${accessId}`,
        failure: `${baseUrl}/?checkout=failure&accessId=${accessId}`
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    });

    await firestore.collection('access_registry').doc(accessId).set({
      accessId,
      planId: plan.id,
      planName: plan.name,
      status: 'pending',
      paymentStatus: 'pending',
      paymentLabel: 'Aguardando confirmacao',
      expiresAt: null,
      createdAt: new Date().toISOString(),
      mpPreferenceId: preference.id,
      mpInitPoint: preference.init_point || null
    });

    res.status(200).json({
      accessId,
      checkoutUrl: preference.init_point,
      sandboxCheckoutUrl: preference.sandbox_init_point || null
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || 'Falha ao criar o checkout.'
    });
  }
}
