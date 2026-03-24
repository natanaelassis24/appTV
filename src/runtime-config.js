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

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  return normalizedPath;
}

export const PUBLIC_RUNTIME_CONFIG = {
  firebaseWebApiKey: normalizeValue(env.APP_FIREBASE_WEB_API_KEY),
  telegramUrl: normalizeValue(env.APP_TELEGRAM_URL),
  apkDownloadUrl: normalizeValue(env.APP_APK_DOWNLOAD_URL) || '/app-tv-android.apk'
};
