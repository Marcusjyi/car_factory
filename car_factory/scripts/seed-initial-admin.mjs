/**
 * Seed first superAdmin via Cloud Function (no password in repo).
 * Usage:
 *   node scripts/seed-initial-admin.mjs <email> <password>
 */
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const email = (process.argv[2] || "").trim().toLowerCase();
const password = process.argv[3] || "";

if (!email || !password) {
  console.error("Usage: node scripts/seed-initial-admin.mjs <email> <password>");
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMRBVqsMWDD4srRWOzYeRk5hN3OvGKOTk",
  authDomain: "car-factory-40a14.firebaseapp.com",
  projectId: "car-factory-40a14",
  appId: "1:854722224560:web:1095faeaf38da7fa0eb675",
});

const functions = getFunctions(app, "asia-northeast3");

const seed = httpsCallable(functions, "seedInitialAdmin");
seed({ email, password, displayName: "Super Admin" })
  .then((res) => {
    console.log(JSON.stringify(res.data, null, 2));
    console.log("Done. Sign in at admin app with email/password.");
  })
  .catch((e) => {
    console.error(e?.message || e);
    process.exit(1);
  });
