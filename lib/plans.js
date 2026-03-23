export const PLAN_CATALOG = {
  mensal: {
    id: 'mensal',
    name: 'Plano Mensal',
    price: 20,
    priceLabel: 'R$ 20',
    period: '/mes',
    durationMonths: 1,
    description: 'Acesso mensal ao app Android TV.',
    mercadopagoTitle: 'App TV Android - Plano Mensal'
  },
  trimestral: {
    id: 'trimestral',
    name: 'Plano Trimestral',
    price: 45,
    priceLabel: 'R$ 45',
    period: '/3 meses',
    durationMonths: 3,
    description: 'Opcao com melhor custo mensal para uso recorrente.',
    mercadopagoTitle: 'App TV Android - Plano Trimestral'
  },
  anual: {
    id: 'anual',
    name: 'Plano Anual',
    price: 120,
    priceLabel: 'R$ 120',
    period: '/ano',
    durationMonths: 12,
    description: 'Melhor custo-beneficio para quem quer manter acesso continuo.',
    mercadopagoTitle: 'App TV Android - Plano Anual'
  }
};

export const PUBLIC_PLANS = Object.values(PLAN_CATALOG).map(plan => ({
  id: plan.id,
  name: plan.name,
  price: plan.priceLabel,
  period: plan.period,
  description: plan.description
}));

export function getPlanById(planId) {
  return PLAN_CATALOG[planId] || null;
}
