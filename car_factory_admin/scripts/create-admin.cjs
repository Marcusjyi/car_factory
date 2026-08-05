/**
 * Firebase Admin CLI — Auth + Firestore admins/{uid}
 *
 *   cd car_factory_admin
 *   npm run create-admin -- <email> <password> [displayName] [employeeId] [role]
 *
 * 인증 (하나):
 *   1) car_factory_admin/.env.local 또는 ../car_factory_web/.env.local
 *      FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *   2) FIREBASE_SERVICE_ACCOUNT_KEY (JSON 문자열)
 *   3) service-account.json
 *        - car_factory_admin/
 *        - car_factory_web/
 *        - car_factory_web/functions/
 */

const {existsSync, readFileSync} = require("fs");
const {resolve} = require("path");
const {initializeApp, cert, getApps} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

const ADMIN_ROOT = resolve(__dirname, "..");
const STORE = resolve(ADMIN_ROOT, "../car_factory_web");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(ADMIN_ROOT, ".env.local"));
loadEnvFile(resolve(STORE, ".env.local"));

const EMAIL = (process.argv[2] || "").trim().toLowerCase();
const PASSWORD = process.argv[3];
const DISPLAY_NAME = process.argv[4] || "Admin";
const EMPLOYEE_ID = process.argv[5] || "";
const ROLE = process.argv[6] === "admin" ? "admin" : "super_admin";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "car-factory-40a14";

const DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  "default";

if (!EMAIL || !PASSWORD) {
  console.error(
    "Usage:\n  npm run create-admin -- <email> <password> [displayName] [employeeId] [role]",
  );
  console.error(
    'Example:\n  npm run create-admin -- admin@example.com "secret12" "Marcus" "000001" super_admin',
  );
  process.exit(1);
}

if (PASSWORD.length < 6) {
  console.error("password must be at least 6 characters");
  process.exit(1);
}

function loadServiceAccountJson() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) return JSON.parse(key);

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;
  if (clientEmail && privateKey) {
    return {
      projectId: PROJECT_ID,
      clientEmail,
      privateKey,
    };
  }

  const candidates = [
    resolve(ADMIN_ROOT, "service-account.json"),
    resolve(STORE, "service-account.json"),
    resolve(STORE, "functions", "service-account.json"),
  ];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    return JSON.parse(readFileSync(filePath, "utf8"));
  }
  return null;
}

function initAdmin() {
  if (getApps().length) return;

  const sa = loadServiceAccountJson();
  if (!sa) {
    console.error("Firebase Admin credential missing.");
    console.error("Put one of:");
    console.error("  - car_factory_admin/.env.local  FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
    console.error("  - car_factory_web/.env.local     same keys");
    console.error("  - service-account.json in car_factory_admin/ or car_factory_web/");
    process.exit(1);
  }

  initializeApp({
    credential: cert(sa),
    projectId: sa.project_id || sa.projectId || PROJECT_ID,
  });
}

async function main() {
  initAdmin();
  const auth = getAuth();
  const db = getFirestore(getApps()[0], DATABASE_ID);

  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    await auth.updateUser(user.uid, {
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
    });
    console.log("Auth user updated:", user.uid);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
    });
    console.log("Auth user created:", user.uid);
  }

  const payload = {
    email: EMAIL,
    displayName: DISPLAY_NAME,
    isApproved: true,
    role: ROLE,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (EMPLOYEE_ID) payload.employeeId = EMPLOYEE_ID;

  const ref = db.collection("admins").doc(user.uid);
  const existing = await ref.get();
  if (!existing.exists) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, {merge: true});

  console.log("Firestore saved: admins/" + user.uid + " (db=" + DATABASE_ID + ")");
  console.log(
    JSON.stringify(
      {
        uid: user.uid,
        email: EMAIL,
        displayName: DISPLAY_NAME,
        employeeId: EMPLOYEE_ID || null,
        role: ROLE,
        isApproved: true,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
