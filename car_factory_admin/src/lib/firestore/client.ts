import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/config";
import { parseAdminDoc } from "@/lib/auth/parse-admin";
import { startOfTodayKST, toDate } from "@/lib/utils/format";
import type {
  AdminUser,
  AppUser,
  DashboardStats,
  OrderRow,
  Partner,
  PartnerWriteInput,
  Product,
  ProductStatus,
} from "@/lib/types";

function parseUser(id: string, data: DocumentData): AppUser {
  const address = data.address as DocumentData | null | undefined;
  const tradeStats = data.tradeStats as DocumentData | null | undefined;
  return {
    uid: id,
    name: data.name ? String(data.name) : undefined,
    displayName: data.displayName ? String(data.displayName) : undefined,
    email: data.email ? String(data.email) : undefined,
    phoneNumber: data.phoneNumber
      ? String(data.phoneNumber)
      : data.phone
        ? String(data.phone)
        : undefined,
    providers: Array.isArray(data.providers)
      ? data.providers.map(String)
      : undefined,
    defaultRegion: data.defaultRegion ? String(data.defaultRegion) : undefined,
    address1: address?.address1 ? String(address.address1) : undefined,
    status: data.status as AppUser["status"] | undefined,
    role: data.role ? String(data.role) : undefined,
    profileCompleted: data.profileCompleted === true,
    purchaseCount: Number(tradeStats?.purchaseCount ?? 0),
    saleCount: Number(tradeStats?.saleCount ?? 0),
    ratingAverage: Number(tradeStats?.ratingAverage ?? 0),
    ratingCount: Number(tradeStats?.ratingCount ?? 0),
    lastLoginAt: toDate(data.lastLoginAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(getClientFirestore(), "users", uid));
  if (!snap.exists()) return null;
  return parseUser(snap.id, snap.data());
}

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    const snap = await getDoc(doc(getClientFirestore(), "admins", uid));
    if (!snap.exists()) return null;
    return parseAdminDoc(snap.id, snap.data());
  } catch {
    return null;
  }
}

export async function listUsers(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "users"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
    );
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  } catch {
    const snap = await getDocs(
      query(collection(getClientFirestore(), "users"), limit(200)),
    );
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  }
}

export async function listProducts(): Promise<Product[]> {
  const mapDoc = (d: { id: string; data: () => DocumentData }): Product => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title ?? ""),
      partName: data.partName ? String(data.partName) : undefined,
      price: Number(data.price ?? 0),
      status: (data.status as ProductStatus) ?? "selling",
      sellerUid: String(data.sellerUid ?? ""),
      sellerName: data.sellerDisplayName
        ? String(data.sellerDisplayName)
        : data.sellerName
          ? String(data.sellerName)
          : undefined,
      listingNumber: data.listingNumber
        ? String(data.listingNumber)
        : undefined,
      thumbnailURL: data.thumbnailURL
        ? String(data.thumbnailURL)
        : (() => {
            const images = Array.isArray(data.images) ? data.images : [];
            const first = images[0] as
              | { listURL?: string; downloadURL?: string; thumbURL?: string }
              | undefined;
            return (
              first?.listURL ||
              first?.thumbURL ||
              first?.downloadURL ||
              undefined
            );
          })(),
      region: data.region ? String(data.region) : undefined,
      createdAt: toDate(data.createdAt),
    };
  };

  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "products"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
    );
    return snap.docs.map(mapDoc);
  } catch {
    const snap = await getDocs(
      query(collection(getClientFirestore(), "products"), limit(200)),
    );
    return snap.docs.map(mapDoc);
  }
}

export async function listProductsBySeller(
  sellerUid: string,
): Promise<Product[]> {
  const mapDoc = (d: { id: string; data: () => DocumentData }): Product => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title ?? ""),
      partName: data.partName ? String(data.partName) : undefined,
      price: Number(data.price ?? 0),
      status: (data.status as ProductStatus) ?? "selling",
      sellerUid: String(data.sellerUid ?? ""),
      sellerName: data.sellerDisplayName
        ? String(data.sellerDisplayName)
        : undefined,
      listingNumber: data.listingNumber
        ? String(data.listingNumber)
        : undefined,
      thumbnailURL: data.thumbnailURL
        ? String(data.thumbnailURL)
        : (() => {
            const images = Array.isArray(data.images) ? data.images : [];
            const first = images[0] as
              | { listURL?: string; downloadURL?: string; thumbURL?: string }
              | undefined;
            return (
              first?.listURL ||
              first?.thumbURL ||
              first?.downloadURL ||
              undefined
            );
          })(),
      region: data.region ? String(data.region) : undefined,
      createdAt: toDate(data.createdAt),
    };
  };

  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "products"),
        where("sellerUid", "==", sellerUid),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );
    return snap.docs.map(mapDoc);
  } catch {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "products"),
        where("sellerUid", "==", sellerUid),
        limit(100),
      ),
    );
    return snap.docs.map(mapDoc);
  }
}

export async function listOrders(): Promise<OrderRow[]> {
  const mapDoc = (d: { id: string; data: () => DocumentData }): OrderRow => {
    const data = d.data();
    return {
      id: d.id,
      productId: data.productId ? String(data.productId) : undefined,
      buyerUid: data.buyerUid ? String(data.buyerUid) : undefined,
      sellerUid: data.sellerUid ? String(data.sellerUid) : undefined,
      status: String(data.status ?? "pending"),
      totalPrice: data.totalPrice != null ? Number(data.totalPrice) : undefined,
      createdAt: toDate(data.createdAt),
    };
  };

  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "orders"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
    );
    return snap.docs.map(mapDoc);
  } catch {
    try {
      const snap = await getDocs(
        query(collection(getClientFirestore(), "orders"), limit(200)),
      );
      return snap.docs.map(mapDoc);
    } catch {
      return [];
    }
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getClientFirestore();
  const today = startOfTodayKST();
  const [usersSnap, productsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "products")),
  ]);

  let todaySignups = 0;
  for (const d of usersSnap.docs) {
    const created = toDate(d.data().createdAt);
    if (created && created >= today) todaySignups++;
  }

  let sellingProducts = 0;
  let reservedProducts = 0;
  let soldProducts = 0;
  for (const d of productsSnap.docs) {
    const status = String(d.data().status ?? "");
    if (status === "selling") sellingProducts++;
    if (status === "reserved") reservedProducts++;
    if (status === "sold") soldProducts++;
  }

  return {
    totalUsers: usersSnap.size,
    totalProducts: productsSnap.size,
    sellingProducts,
    todaySignups,
    reservedProducts,
    soldProducts,
  };
}

function parsePartner(id: string, data: DocumentData): Partner {
  return {
    id,
    name: String(data.name ?? ""),
    region: String(data.region ?? ""),
    address: String(data.address ?? ""),
    phone: String(data.phone ?? ""),
    hours: String(data.hours ?? ""),
    description: String(data.description ?? ""),
    specialties: Array.isArray(data.specialties)
      ? data.specialties.map(String)
      : [],
    specialtyLabel: String(data.specialtyLabel ?? ""),
    badges: Array.isArray(data.badges) ? data.badges.map(String) : [],
    photoURL: String(data.photoURL ?? ""),
    photoPath: data.photoPath ? String(data.photoPath) : undefined,
    ratingAverage: Number(data.ratingAverage ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    isActive: data.isActive !== false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function listPartners(): Promise<Partner[]> {
  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "partners"),
        orderBy("name", "asc"),
        limit(200),
      ),
    );
    return snap.docs.map((d) => parsePartner(d.id, d.data()));
  } catch {
    const snap = await getDocs(
      query(collection(getClientFirestore(), "partners"), limit(200)),
    );
    return snap.docs
      .map((d) => parsePartner(d.id, d.data()))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }
}

export async function getPartner(id: string): Promise<Partner | null> {
  const snap = await getDoc(doc(getClientFirestore(), "partners", id));
  if (!snap.exists()) return null;
  return parsePartner(snap.id, snap.data());
}

export async function createPartner(
  id: string,
  input: PartnerWriteInput,
): Promise<void> {
  const ref = doc(getClientFirestore(), "partners", id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("이미 존재하는 파트너 ID입니다.");
  }
  await setDoc(ref, {
    ...input,
    // 별점은 대시보드에서 설정하지 않음
    ratingAverage: 0,
    ratingCount: 0,
    // 하위 호환: 예전 isFeatured 쿼리와 맞춤 (노출=앱·웹 동시)
    isFeatured: input.isActive,
    displayOrder: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePartner(
  id: string,
  input: PartnerWriteInput,
): Promise<void> {
  await updateDoc(doc(getClientFirestore(), "partners", id), {
    name: input.name,
    region: input.region,
    address: input.address,
    phone: input.phone,
    hours: input.hours,
    description: input.description,
    specialties: input.specialties,
    specialtyLabel: input.specialtyLabel,
    badges: input.badges,
    photoURL: input.photoURL,
    photoPath: input.photoPath ?? null,
    isActive: input.isActive,
    isFeatured: input.isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePartner(id: string): Promise<void> {
  await deleteDoc(doc(getClientFirestore(), "partners", id));
}

/** 활성 파트너 — 이름순 */
export async function listActivePartners(): Promise<Partner[]> {
  try {
    const snap = await getDocs(
      query(
        collection(getClientFirestore(), "partners"),
        where("isActive", "==", true),
        orderBy("name", "asc"),
        limit(200),
      ),
    );
    return snap.docs.map((d) => parsePartner(d.id, d.data()));
  } catch {
    const all = await listPartners();
    return all.filter((p) => p.isActive);
  }
}
