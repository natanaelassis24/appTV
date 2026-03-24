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

export const PUBLIC_RUNTIME_CONFIG = {
  firebaseWebApiKey: normalizeValue(import.meta.env.APP_FIREBASE_WEB_API_KEY),
  telegramUrl: normalizeValue(import.meta.env.APP_TELEGRAM_URL),
  apkDownloadUrl: normalizeValue(import.meta.env.APP_APK_DOWNLOAD_URL) || '/app-tv-android.apk'
};
