/**
 * Seed products/_schema via Firebase CLI auth (same path as `firebase projects:list`).
 */
const path = require("path");

const globalTools = path.join(
  process.env.APPDATA || "",
  "npm",
  "node_modules",
  "firebase-tools",
);

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
function arr(values) {
  return { arrayValue: { values } };
}
function map(fields) {
  return { mapValue: { fields } };
}

async function main() {
  const { requireAuth } = require(path.join(globalTools, "lib", "requireAuth"));
  const { Client } = require(path.join(globalTools, "lib", "apiv2"));
  const {
    getGlobalDefaultAccount,
    getProjectDefaultAccount,
    setActiveAccount,
  } = require(path.join(globalTools, "lib", "auth"));

  const projectId = "car-factory-40a14";
  const options = { project: projectId, projectId };

  const account =
    getProjectDefaultAccount(process.cwd()) || getGlobalDefaultAccount();
  if (account) {
    setActiveAccount(options, account);
    options.user = account.user;
    options.tokens = account.tokens;
  }

  await requireAuth(options);

  const sampleImageUrl =
    "https://firebasestorage.googleapis.com/v0/b/car-factory-40a14.firebasestorage.app/o/product-images%2F_schema%2F_schema%2Fsample.jpg?alt=media";

  const fields = {
    id: str("_schema"),
    sellerUid: str("_schema"),
    title: str("현대 쏘나타 헤드라이트 (스키마 샘플)"),
    description: str("판매 등록 스키마 샘플 문서입니다. 삭제해도 됩니다."),
    categoryId: str("misc"),
    partName: str("헤드라이트"),
    manufacturer: str("현대"),
    vehicleMakeId: str("hyundai"),
    vehicleModelId: str("sonata"),
    vehicleModelName: str("쏘나타"),
    modelYearFrom: int(2020),
    modelYearTo: int(2020),
    partNumber: str("92101-L1000"),
    oemNumber: str("92101-L1000"),
    condition: str("used"),
    conditionGrade: str("A"),
    conditionDescription: str("A급"),
    price: int(150000),
    negotiable: bool(false),
    quantity: int(1),
    deliveryMethods: arr([str("parcel")]),
    shippingFeeType: str("separate"),
    shippingFee: int(3000),
    region: nullVal(),
    images: arr([
      map({
        path: str("product-images/_schema/_schema/sample.jpg"),
        downloadURL: str(sampleImageUrl),
        width: int(1600),
        height: int(1200),
        sortOrder: int(0),
      }),
    ]),
    thumbnailURL: str(sampleImageUrl),
    status: str("draft"),
    viewCount: int(0),
    favoriteCount: int(0),
    chatCount: int(0),
    searchKeywords: arr([
      str("현대"),
      str("쏘나타"),
      str("헤드라이트"),
      str("92101-l1000"),
      str("2020"),
    ]),
    normalizedTitle: str("현대 쏘나타 헤드라이트 (스키마 샘플)"),
    soldAt: nullVal(),
    createdAt: str(new Date().toISOString()),
    updatedAt: str(new Date().toISOString()),
    _note: str(
      "사진은 Storage(product-images/...)에 저장하고, 이 문서 images[].downloadURL에 URL만 둡니다.",
    ),
  };

  const client = new Client({
    urlPrefix: "https://firestore.googleapis.com",
    auth: true,
  });

  const docPath = `/v1/projects/${projectId}/databases/default/documents/products/_schema`;
  await client.patch(docPath, { fields });

  console.log("OK: products/_schema written to Firestore database `default`");
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
