import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  "default";

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "car-factory-40a14.firebasestorage.app";

function initAdmin() {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "car-factory-40a14";

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      projectId,
      storageBucket: STORAGE_BUCKET,
    });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket: STORAGE_BUCKET,
    });
  }

  return initializeApp({ projectId, storageBucket: STORAGE_BUCKET });
}

export function getAdminFirestore() {
  initAdmin();
  return getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
}

export function getAdminAuth() {
  initAdmin();
  return getAuth();
}

export function getAdminBucket() {
  initAdmin();
  return getStorage().bucket(STORAGE_BUCKET);
}
