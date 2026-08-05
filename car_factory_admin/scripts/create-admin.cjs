/**
 * Run from car_factory/functions so CommonJS firebase-admin loads cleanly:
 *   node ../car_factory_admin/scripts/create-admin.cjs <email> <password> [displayName] [employeeId] [role]
 * Or:
 *   node scripts/create-admin.cjs ...
 */
const {initializeApp, cert, getApps} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {readFileSync} = require("fs");
const {resolve} = require("path");

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const DISPLAY_NAME = process.argv[4] ?? "Admin";
const EMPLOYEE_ID = process.argv[5] ?? "000001";
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
    "Usage: node scripts/create-admin.cjs <email> <password> [displayName] [employeeId] [role]",
  );
  process.exit(1);
}

function initAdmin() {
  if (getApps().length) return;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    initializeApp({
      credential: cert(JSON.parse(key)),
      projectId: PROJECT_ID,
    });
    return;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;
  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({projectId: PROJECT_ID, clientEmail, privateKey}),
      projectId: PROJECT_ID,
    });
    return;
  }

  const candidates = [
    resolve(__dirname, "../service-account.json"),
    resolve(__dirname, "../../car_factory/service-account.json"),
    resolve(__dirname, "../../car_factory/functions/service-account.json"),
  ];
  for (const path of candidates) {
    try {
      const json = JSON.parse(readFileSync(path, "utf8"));
      initializeApp({
        credential: cert(json),
        projectId: json.project_id || PROJECT_ID,
      });
      return;
    } catch {
      // try next
    }
  }

  initializeApp({projectId: PROJECT_ID});
}

async function main() {
  initAdmin();
  const auth = getAuth();
  const db = getFirestore(getApps()[0], DATABASE_ID);

  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    console.log(`Auth user already exists: ${user.uid}`);
    await auth.updateUser(user.uid, {
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
    });
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
    });
    console.log(`Created auth user: ${user.uid}`);
  }

  const adminRef = db.collection("admins").doc(user.uid);
  const existing = await adminRef.get();
  await adminRef.set(
    {
      email: EMAIL,
      displayName: DISPLAY_NAME,
      employeeId: EMPLOYEE_ID,
      isApproved: true,
      role: ROLE,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : {createdAt: FieldValue.serverTimestamp()}),
    },
    {merge: true},
  );

  console.log(`admins/${user.uid} document saved (db=${DATABASE_ID})`);
  console.log(
    JSON.stringify(
      {uid: user.uid, email: EMAIL, role: ROLE, isApproved: true},
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
