import { getAdminFirestore } from "@/lib/firebase/admin";
import { parseAdminDoc } from "@/lib/auth/parse-admin";
import { startOfTodayKST, toDate } from "@/lib/utils/format";
import type {
  AdminUser,
  AppUser,
  DashboardStats,
  OrderRow,
  Product,
  ProductStatus,
} from "@/lib/types";

export async function listAdminsServer(): Promise<AdminUser[]> {
  const snap = await getAdminFirestore().collection("admins").get();
  return snap.docs
    .map((d) => parseAdminDoc(d.id, d.data()))
    .filter((a): a is AdminUser => a != null);
}

export async function getDashboardStatsServer(): Promise<DashboardStats> {
  const db = getAdminFirestore();
  const today = startOfTodayKST();
  const [usersSnap, productsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("products").get(),
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

export async function listUsersServer(): Promise<AppUser[]> {
  const snap = await getAdminFirestore()
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    const address = data.address as Record<string, unknown> | null | undefined;
    const tradeStats = data.tradeStats as
      | Record<string, unknown>
      | null
      | undefined;
    return {
      uid: d.id,
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
  });
}

export async function listProductsServer(): Promise<Product[]> {
  const snap = await getAdminFirestore()
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title ?? ""),
      price: Number(data.price ?? 0),
      status: (data.status as ProductStatus) ?? "selling",
      sellerUid: String(data.sellerUid ?? ""),
      sellerName: data.sellerName ? String(data.sellerName) : undefined,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function listOrdersServer(): Promise<OrderRow[]> {
  try {
    const snap = await getAdminFirestore()
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId ? String(data.productId) : undefined,
        buyerUid: data.buyerUid ? String(data.buyerUid) : undefined,
        sellerUid: data.sellerUid ? String(data.sellerUid) : undefined,
        status: String(data.status ?? "pending"),
        totalPrice:
          data.totalPrice != null ? Number(data.totalPrice) : undefined,
        createdAt: toDate(data.createdAt),
      };
    });
  } catch {
    return [];
  }
}
