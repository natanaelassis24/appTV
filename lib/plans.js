export const PLAN_CATALOG = {
  mensal: {
    id: 'mensal',
    name: 'Plano Mensal',
    price: 20,
    priceLabel: 'R$ 20',
    period: '/mes',
    durationMonths: 1,
    description: 'Acesso mensal ao app Android TV.'
  },
  trimestral: {
    id: 'trimestral',
    name: 'Plano Trimestral',
    price: 45,
    priceLabel: 'R$ 45',
    period: '/3 meses',
    durationMonths: 3,
    description: 'Opcao com melhor custo mensal para uso recorrente.'
  },
  anual: {
    id: 'anual',
    name: 'Plano Anual',
    price: 120,
    priceLabel: 'R$ 120',
    period: '/ano',
    durationMonths: 12,
    description: 'Melhor custo-beneficio para quem quer manter acesso continuo.'
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
