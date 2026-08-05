/**
 * Seed users/_schema via Firestore REST + Firebase CLI token (global firebase-tools).
 */
const path = require("path");
const globalTools = path.join(
  process.env.APPDATA || "",
  "npm",
  "node_modules",
  "firebase-tools",
);

async function getAccessToken() {
  const auth = require(path.join(globalTools, "lib", "auth"));
  const token = await auth.getAccessToken(true);
  if (typeof token === "string") return token;
  if (token?.access_token) return token.access_token;
  throw new Error("Firebase CLI access token missing. Run: firebase login");
}

function str(v) {
  return { stringValue: v };
}
function bool(v) {
  return { booleanValue: v };
}
function nullVal() {
  return { nullValue: null };
}
function int(v) {
  return { integerValue: String(v) };
}
function double(v) {
  return { doubleValue: v };
}

async function main() {
  const accessToken = await getAccessToken();
  const projectId = "car-factory-40a14";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/default/documents/users/_schema`;

  const now = new Date().toISOString();
  const body = {
    fields: {
      uid: str("_schema"),
      name: str(""),
      displayName: str("스키마 샘플 (삭제 가능)"),
      photoURL: nullVal(),
      email: nullVal(),
      phoneNumber: nullVal(),
      providers: { arrayValue: { values: [str("google")] } },
      providerAccounts: {
        arrayValue: {
          values: [
            {
              mapValue: {
                fields: {
                  provider: str("google"),
                  providerUserId: str("_schema"),
                },
              },
            },
          ],
        },
      },
      defaultRegion: nullVal(),
      role: str("user"),
      status: str("active"),
      tradeStats: {
        mapValue: {
          fields: {
            purchaseCount: int(0),
            saleCount: int(0),
            ratingAverage: double(0),
            ratingCount: int(0),
          },
        },
      },
      termsAcceptedAt: str(now),
      privacyAcceptedAt: str(now),
      createdAt: str(now),
      updatedAt: str(now),
      lastLoginAt: str(now),
      profileCompleted: bool(false),
      _note: str(
        "실제 회원 문서는 로그인 시 Auth UID로 자동 생성됩니다. 이 문서는 컬렉션 확인용입니다.",
      ),
    },
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(res.status, text);
    process.exit(1);
  }
  console.log("OK created users/_schema");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
