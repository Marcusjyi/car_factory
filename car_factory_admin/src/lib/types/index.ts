export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  employeeId?: string;
  /** E.164 또는 국내 형식 — 삭제 시 Firebase Phone Auth OTP */
  phoneNumber?: string;
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

/** 장착 파트너스 (partners) */
export interface Partner {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  specialties: string[];
  specialtyLabel: string;
  badges: string[];
  photoURL: string;
  photoPath?: string;
  /** 읽기 전용 — 대시보드에서 수정하지 않음 */
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** 어드민 생성·수정 시 쓰는 필드 (별점·표시순서 제외) */
export type PartnerWriteInput = {
  name: string;
  region: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  specialties: string[];
  specialtyLabel: string;
  badges: string[];
  photoURL: string;
  photoPath?: string;
  /** 웹·앱 동시 노출 */
  isActive: boolean;
};

/** 장착점 예약 (partnerReservations) */
export type PartnerReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface PartnerReservation {
  id: string;
  customerName: string;
  customerPhone: string;
  uid?: string;
  partnerId: string;
  partnerName: string;
  partnerRegion: string;
  partnerAddress: string;
  partnerPhone: string;
  preferredDate: string;
  preferredTime: string;
  partOrOrder: string;
  memo: string;
  status: PartnerReservationStatus;
  source: "web" | "app";
  createdAt: Date | null;
  updatedAt: Date | null;
  adminNote?: string;
}
