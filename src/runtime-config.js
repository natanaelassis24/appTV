const normalizeValue = value => {
  if (!value) {
    return '';
  }

  let next = String(value).trim();

  if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
    next = next.slice(1, -1);
  }

  return next;
};

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

function getBrowserOrigin() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const origin = String(window.location.origin || '').trim();
    return origin && origin !== 'null' ? origin.replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

function isLocalOrigin(origin) {
  const value = String(origin || '').trim().toLowerCase();
  return (
    value.startsWith('http://localhost') ||
    value.startsWith('http://127.0.0.1') ||
    value.startsWith('https://localhost') ||
    value.startsWith('https://127.0.0.1')
  );
}

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  const configuredBase = PUBLIC_RUNTIME_CONFIG.apiBaseUrl || '';

  if (!configuredBase) {
    return normalizedPath;
  }

  return `${configuredBase.replace(/\/$/, '')}${normalizedPath}`;
}

export const PUBLIC_RUNTIME_CONFIG = {
  apiBaseUrl:
    normalizeValue(env.APP_API_BASE_URL) ||
    (isLocalOrigin(getBrowserOrigin()) ? getBrowserOrigin() : '') ||
    normalizeValue(env.APP_BASE_URL) ||
    getBrowserOrigin(),
  firebaseWebApiKey: normalizeValue(env.APP_FIREBASE_WEB_API_KEY),
  telegramUrl: normalizeValue(env.APP_TELEGRAM_URL),
  apkDownloadUrl: normalizeValue(env.APP_APK_DOWNLOAD_URL) || '/app-tv-android.apk'
};
