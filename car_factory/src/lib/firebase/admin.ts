import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // App Hosting / Cloud Functions 환경에서는 기본 자격 증명 사용
  return initializeApp();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/** 콘솔 `(default)`가 아닌 서울 named DB `default` */
const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  "default";

export function getAdminDb() {
  return getFirestore(getAdminApp(), FIRESTORE_DATABASE_ID);
}
