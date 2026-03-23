function getAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.TOKEN_DE_ACESSO_MERCADO_PAGO;

  if (!accessToken) {
    throw new Error('Defina MERCADO_PAGO_ACCESS_TOKEN nas variaveis da Vercel.');
  }

  return accessToken;
}

export function getMercadoPagoPublicKey() {
  const publicKey =
    process.env.VITE_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.MERCADO_PAGO_PUBLIC_KEY ||
    process.env.PUBLIC_KEY_MERCADO_PAGO ||
    process.env.CHAVE_PUBLICA_MERCADO_PAGO;

  if (!publicKey) {
    throw new Error(
      'Defina VITE_MERCADO_PAGO_PUBLIC_KEY, MERCADO_PAGO_PUBLIC_KEY ou PUBLIC_KEY_MERCADO_PAGO nas variaveis da Vercel.'
    );
  }

  return publicKey;
}

async function mercadoPagoRequest(pathname, options = {}) {
  const response = await fetch(`https://api.mercadopago.com${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha na API do Mercado Pago.');
  }

  return payload;
}

export async function createMercadoPagoPreference(body) {
  return mercadoPagoRequest('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function createMercadoPagoPayment(body) {
  return mercadoPagoRequest('/v1/payments', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function getMercadoPagoPayment(paymentId) {
  return mercadoPagoRequest(`/v1/payments/${paymentId}`, {
    method: 'GET'
  });
}
