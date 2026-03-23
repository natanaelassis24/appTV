import crypto from 'node:crypto';

export function generateAccessId() {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ATV-${suffix}`;
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
