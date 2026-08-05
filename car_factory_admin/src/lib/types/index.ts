export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  employeeId?: string;
  isApproved: boolean;
  role: AdminRole;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type UserStatus = "active" | "blocked" | "suspended" | "withdrawn";

export interface AppUser {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  providers?: string[];
  defaultRegion?: string;
  address1?: string;
  status?: UserStatus;
  role?: string;
  profileCompleted?: boolean;
  purchaseCount?: number;
  saleCount?: number;
  ratingAverage?: number;
  ratingCount?: number;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ProductStatus =
  | "draft"
  | "selling"
  | "reserved"
  | "sold"
  | "hidden"
  | "deleted"
  | "blocked";

export interface Product {
  id: string;
  title: string;
  partName?: string;
  price: number;
  status: ProductStatus;
  sellerUid: string;
  sellerName?: string;
  listingNumber?: string;
  thumbnailURL?: string;
  region?: string;
  createdAt: Date | null;
}

export type OrderStatus =
  | "pending"
  | "reserved"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderRow {
  id: string;
  productId?: string;
  buyerUid?: string;
  sellerUid?: string;
  status: string;
  totalPrice?: number;
  createdAt: Date | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  sellingProducts: number;
  todaySignups: number;
  reservedProducts: number;
  soldProducts: number;
}
