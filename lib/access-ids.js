import crypto from 'node:crypto';

export function formatAccessId(suffix) {
  const normalized = Number.parseInt(suffix, 10);
  const safeSuffix = Number.isFinite(normalized) && normalized >= 0 ? normalized : 0;
  return `ATA-${String(safeSuffix).padStart(4, '0')}`;
}

export function generateAccessId() {
  const suffix = crypto.randomInt(0, 10000);
  return formatAccessId(suffix);
}

export function generateCheckoutSessionId() {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CHK-${suffix}`;
}

export function addMonthsToDate(dateInput, months) {
  const date = new Date(dateInput);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function getBaseUrl(req) {
  const configuredBaseUrl =
    process.env.APP_BASE_URL || process.env.URL_BASE_DO_APLICATIVO;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}
