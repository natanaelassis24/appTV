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

export function getAccessStatus(entry, referenceDate = new Date()) {
  const storedStatus = String(entry?.status || '').trim().toLowerCase();
  const expiresAtDate = parseDateValue(entry?.expiresAt);

  if (!expiresAtDate) {
    return ['active', 'pending', 'blocked'].includes(storedStatus) ? storedStatus : 'active';
  }

  const today = startOfDay(referenceDate);
  const expiresDay = startOfDay(expiresAtDate);
  const diffDays = Math.floor((expiresDay.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffDays < 0) {
    return 'blocked';
  }

  if (diffDays <= PENDING_WINDOW_DAYS) {
    return 'pending';
  }

  return 'active';
}

