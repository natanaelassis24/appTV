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

function isLocalhost() {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }

  const hostname = String(window.location.hostname || '').toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function joinUrl(baseUrl, path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!normalizedBase) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;

  if (isLocalhost()) {
    return normalizedPath;
  }

  const apiBase = normalizeValue(env.APP_API_BASE_URL || env.APP_BASE_URL);
  return apiBase ? joinUrl(apiBase, normalizedPath) : normalizedPath;
}

export const PUBLIC_RUNTIME_CONFIG = {
  firebaseWebApiKey: normalizeValue(env.APP_FIREBASE_WEB_API_KEY),
  telegramUrl: normalizeValue(env.APP_TELEGRAM_URL),
  apkDownloadUrl: normalizeValue(env.APP_APK_DOWNLOAD_URL) || '/app-tv-android.apk'
};
