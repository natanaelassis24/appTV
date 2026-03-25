export const PLAN_CATALOG = {
  mensal: {
    id: 'mensal',
    name: 'Plano Mensal',
    price: 10,
    priceLabel: 'R$ 10',
    period: '/mes',
    durationMonths: 1,
    description: 'Acesso mensal ao app Android TV.'
  },
  trimestral: {
    id: 'trimestral',
    name: 'Plano Trimestral',
    price: 27,
    priceLabel: 'R$ 27',
    period: '/3 meses',
    durationMonths: 3,
    description: 'Valor com 10% de desconto sobre 3 meses do plano mensal.'
  },
  anual: {
    id: 'anual',
    name: 'Plano Anual',
    price: 102,
    priceLabel: 'R$ 102',
    period: '/ano',
    durationMonths: 12,
    description: 'Valor com 15% de desconto sobre 12 meses do plano mensal.'
  }
};

export const PUBLIC_PLANS = Object.values(PLAN_CATALOG).map(plan => ({
  id: plan.id,
  name: plan.name,
  price: plan.priceLabel,
  priceAmount: plan.price,
  priceLabel: plan.priceLabel,
  period: plan.period,
  description: plan.description
}));

export function getPlanById(planId) {
  return PLAN_CATALOG[planId] || null;
}
