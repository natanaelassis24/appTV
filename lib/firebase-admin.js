import admin from 'firebase-admin';

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return '';
}

function normalizePrivateKey(rawValue) {
  if (!rawValue) {
    return '';
  }

  let value = String(rawValue).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  value = value.replace(/\\n/g, '\n');

  return value;
}

function readFirebaseConfig() {
  const projectId = readEnv('FIREBASE_PROJECT_ID', 'ID_DO_PROJETO_FIREBASE');
  const clientEmail = readEnv(
    'FIREBASE_CLIENT_EMAIL',
    'E_MAIL_DO_CLIENTE_FIREBASE',
    'E-MAIL_DO_CLIENTE_FIREBASE'
  );
  const privateKey = normalizePrivateKey(readEnv('FIREBASE_PRIVATE_KEY'));

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase nao configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = readFirebaseConfig();

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  return admin;
}

export function getFirestore() {
  return getFirebaseAdmin().firestore();
}

export function getAuth() {
  return getFirebaseAdmin().auth();
}
