const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PENDING_WINDOW_DAYS = 3;

function parseDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatAccessDateLabel(value) {
  const date = parseDateValue(value);
  if (!date) {
    return 'Nao definida';
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

export function getAccessStatusDetails(entry, referenceDate = new Date()) {
  const storedStatus = String(entry?.status || '').trim().toLowerCase();
  const expiresAtDate = parseDateValue(entry?.expiresAt);

  if (!expiresAtDate) {
    const status = ['active', 'pending', 'blocked'].includes(storedStatus) ? storedStatus : 'active';
    return {
      status,
      accessGranted: status === 'active',
      warning: false,
      warningMessage: '',
      daysRemaining: null,
      expiresAtDate: null,
      expiresAtLabel: formatAccessDateLabel(entry?.expiresAt)
    };
  }

  const today = startOfDay(referenceDate);
  const expiresDay = startOfDay(expiresAtDate);
  const diffDays = Math.floor((expiresDay.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffDays < 0) {
    return {
      status: 'blocked',
      accessGranted: false,
      warning: false,
      warningMessage: 'Seu acesso venceu.',
      daysRemaining: diffDays,
      expiresAtDate,
      expiresAtLabel: formatAccessDateLabel(expiresAtDate)
    };
  }

  const warning = diffDays <= PENDING_WINDOW_DAYS;
  const warningMessage = warning
    ? diffDays === 0
      ? 'Seu acesso vence hoje.'
      : `Seu acesso vence em ${diffDays} dia(s).`
    : '';

  return {
    status: 'active',
    accessGranted: true,
    warning,
    warningMessage,
    daysRemaining: diffDays,
    expiresAtDate,
    expiresAtLabel: formatAccessDateLabel(expiresAtDate)
  };
}

export function getAccessStatus(entry, referenceDate = new Date()) {
  return getAccessStatusDetails(entry, referenceDate).status;
}

export function isAccessExpired(entry, referenceDate = new Date()) {
  const details = getAccessStatusDetails(entry, referenceDate);
  return details.status === 'blocked';
}

export function isAccessExpiringSoon(entry, referenceDate = new Date()) {
  const details = getAccessStatusDetails(entry, referenceDate);
  return Boolean(details.warning);
}

export function getAccessDaysRemaining(entry, referenceDate = new Date()) {
  const details = getAccessStatusDetails(entry, referenceDate);
  return details.daysRemaining;
}
