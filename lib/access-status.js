const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PENDING_WINDOW_DAYS = 3;

export function parseAccessDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    const numeric = new Date(Number(raw));
    return Number.isNaN(numeric.getTime()) ? null : numeric;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const fallback = new Date(`${raw}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseStoredDate(value) {
  return parseAccessDateValue(value);
}

function computeFallbackExpiry(entry) {
  const createdAtDate = parseStoredDate(entry?.createdAt);
  const durationMonths = Number.parseInt(entry?.planDurationMonths || entry?.durationMonths || '', 10);
  const durationHours = Number.parseInt(entry?.planDurationHours || entry?.durationHours || '', 10);

  if (!createdAtDate) {
    return null;
  }

  if (Number.isFinite(durationHours) && durationHours > 0) {
    const next = new Date(createdAtDate);
    next.setHours(next.getHours() + durationHours);
    return next;
  }

  if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
    return null;
  }

  const next = new Date(createdAtDate);
  next.setMonth(next.getMonth() + durationMonths);
  return next;
}

function hasTimePrecision(entry, rawExpiresAt) {
  const raw = String(rawExpiresAt || '').trim();
  return Boolean(entry?.planDurationHours || entry?.durationHours || /T\d{2}:\d{2}/.test(raw) || /^\d+$/.test(raw));
}

export function formatAccessDateLabel(value) {
  const date = parseAccessDateValue(value);
  if (!date) {
    return 'Nao definida';
  }

  const raw = String(value || '').trim();
  const hasTime = /T\d{2}:\d{2}/.test(raw) || /:\d{2}/.test(raw) && !/^\d{4}-\d{2}-\d{2}$/.test(raw);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(hasTime ? { timeStyle: 'short' } : {})
  }).format(date);
}

export function getAccessStatusDetails(entry, referenceDate = new Date()) {
  const storedStatus = String(entry?.status || '').trim().toLowerCase();
  const expiresAtDate = parseAccessDateValue(entry?.expiresAt) || computeFallbackExpiry(entry);
  const preciseExpiry = hasTimePrecision(entry, entry?.expiresAt);

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

  if (preciseExpiry) {
    const diffMs = expiresAtDate.getTime() - referenceDate.getTime();
    const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));

    if (diffMs < 0) {
      return {
        status: 'blocked',
        accessGranted: false,
        warning: false,
        warningMessage: 'Seu acesso venceu.',
        daysRemaining: diffHours,
        expiresAtDate,
        expiresAtLabel: formatAccessDateLabel(expiresAtDate)
      };
    }

    const warning = diffMs <= PENDING_WINDOW_DAYS * MS_PER_DAY;
    const warningMessage = warning
      ? diffMs <= MS_PER_DAY
        ? `Seu acesso vence em ${Math.max(1, diffHours)} hora(s).`
        : `Seu acesso vence em ${Math.ceil(diffMs / MS_PER_DAY)} dia(s).`
      : '';

    return {
      status: 'active',
      accessGranted: true,
      warning,
      warningMessage,
      daysRemaining: diffHours,
      expiresAtDate,
      expiresAtLabel: formatAccessDateLabel(expiresAtDate)
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
