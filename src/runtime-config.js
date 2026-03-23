const normalizeUrl = value => {
  if (!value) {
    return '';
  }

  return String(value).trim();
};

export const PUBLIC_RUNTIME_CONFIG = {
  telegramUrl: normalizeUrl(import.meta.env.VITE_TELEGRAM_URL),
  apkDownloadUrl: normalizeUrl(import.meta.env.VITE_APK_DOWNLOAD_URL) || '/app-tv-android.apk',
  mercadoPagoPublicKey:
    normalizeUrl(import.meta.env.MERCADO_PAGO_PUBLIC_KEY) ||
    normalizeUrl(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY) ||
    'TEST-59489e44-d61a-45db-92d4-9a8e48687106'
};
