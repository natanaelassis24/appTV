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

function readFirebaseConfig() {
  const projectId = readEnv('FIREBASE_PROJECT_ID', 'ID_DO_PROJETO_FIREBASE');
  const clientEmail = readEnv(
    'FIREBASE_CLIENT_EMAIL',
    'E_MAIL_DO_CLIENTE_FIREBASE',
    'E-MAIL_DO_CLIENTE_FIREBASE'
  );
  const privateKey = readEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

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
