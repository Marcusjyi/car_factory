import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

type FirebaseWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

function readNextPublicConfig(): FirebaseWebConfig | null {
  const config: FirebaseWebConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (config.apiKey && config.authDomain && config.projectId && config.appId) {
    return config;
  }
  return null;
}

function readWebAppConfigEnv(): FirebaseWebConfig | null {
  const raw = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirebaseWebConfig;
  } catch {
    return null;
  }
}

function resolveFirebaseConfig(): FirebaseWebConfig | null {
  return readNextPublicConfig() ?? readWebAppConfigEnv();
}

export function isFirebaseConfigured() {
  if (resolveFirebaseConfig()) return true;
  // App Hosting 빌드에서 SDK가 FIREBASE_WEBAPP_CONFIG로 자동 초기화 가능
  return Boolean(
    process.env.FIREBASE_CONFIG ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT,
  );
}

/** 콘솔의 `(default)`(nam5)가 아니라, 서울 DB ID `default`를 사용 */
const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || "default";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functionsClient: Functions | undefined;

const FUNCTIONS_REGION =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "asia-northeast3";

export function getFirebaseApp() {
  if (!app) {
    if (getApps().length) {
      app = getApps()[0]!;
    } else {
      const config = resolveFirebaseConfig();
      // App Hosting: 인자 없이 initializeApp() → 자동 주입 설정 사용
      app = config ? initializeApp(config) : initializeApp();
    }
  }
  return app;
}

export function getClientAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getClientDb() {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    try {
      // 일부 네트워크에서 WebChannel이 막히면 "client is offline" 발생 → long polling
      db = initializeFirestore(
        firebaseApp,
        { experimentalForceLongPolling: true },
        FIRESTORE_DATABASE_ID,
      );
    } catch {
      db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);
    }
  }
  return db;
}

export function getClientStorage() {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

export function getClientFunctions() {
  if (!functionsClient) {
    functionsClient = getFunctions(getFirebaseApp(), FUNCTIONS_REGION);
  }
  return functionsClient;
}
