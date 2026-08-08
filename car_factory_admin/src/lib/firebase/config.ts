import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from "firebase/auth";
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

/**
 * localStorage 지속성 사용.
 * firebase 12.17+ IndexedDB는 탭이 hidden이면 "Database is closing/hidden"를 던짐
 * (reCAPTCHA/팝업 포커스 시). Phone Auth·재인증에 영향.
 */
export function getClientAuth() {
  const app = getFirebaseApp();
  try {
    return initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    return getAuth(app);
  }
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

export async function callDeletePartner(
  partnerId: string,
  employeeId: string,
): Promise<{ ok: boolean; partnerId: string }> {
  const fn = httpsCallable(getClientFunctions(), "deletePartner");
  const res = await fn({ partnerId, employeeId });
  return res.data as { ok: boolean; partnerId: string };
}

export async function callSetMyAdminPhone(
  phoneNumber: string,
): Promise<{ ok: boolean; phoneNumber: string; authUpdated: boolean }> {
  const fn = httpsCallable(getClientFunctions(), "setMyAdminPhone");
  const res = await fn({ phoneNumber });
  return res.data as {
    ok: boolean;
    phoneNumber: string;
    authUpdated: boolean;
  };
}
