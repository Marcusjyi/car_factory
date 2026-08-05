import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  "default";

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
    });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  return initializeApp({ projectId });
}

export function getAdminFirestore() {
  initAdmin();
  return getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
}

export function getAdminAuth() {
  initAdmin();
  return getAuth();
}
