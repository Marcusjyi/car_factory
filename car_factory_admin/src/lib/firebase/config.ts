import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || "default";

const FUNCTIONS_REGION =
  process.env.NEXT_PUBLIC_FUNCTIONS_REGION || "asia-northeast3";

function assertFirebaseConfig() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error(
      "Firebase client config missing. Set NEXT_PUBLIC_FIREBASE_* in apphosting.yaml (BUILD).",
    );
  }
}

export function getFirebaseApp() {
  if (!getApps().length) {
    assertFirebaseConfig();
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getClientAuth() {
  return getAuth(getFirebaseApp());
}

export function getClientFirestore() {
  const app = getFirebaseApp();
  try {
    return initializeFirestore(
      app,
      { experimentalForceLongPolling: true },
      FIRESTORE_DATABASE_ID,
    );
  } catch {
    return getFirestore(app, FIRESTORE_DATABASE_ID);
  }
}

export function getClientStorage() {
  return getStorage(getFirebaseApp());
}

export function getClientFunctions() {
  return getFunctions(getFirebaseApp(), FUNCTIONS_REGION);
}

export async function callSeedPartners(): Promise<{ ok: boolean; count: number }> {
  const fn = httpsCallable(getClientFunctions(), "seedPartners");
  const res = await fn({});
  return res.data as { ok: boolean; count: number };
}
