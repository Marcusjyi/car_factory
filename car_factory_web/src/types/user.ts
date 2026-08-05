export type AuthProviderId = "kakao" | "naver" | "google" | "apple";

export type UserRole = "user" | "admin" | "super_admin";

export type UserStatus = "active" | "suspended" | "withdrawn";

/** 거주지/회원 주소 (배송지와 별개) */
export interface UserAddress {
  address1: string;
  address2: string;
}

/** 기본 배송지 (주문 배송용, 주소와 별개) */
export interface UserShippingAddress {
  label: string;
  recipient: string;
  phone: string;
  address1: string;
  address2: string;
}

/** 판매자 기본 입금 계좌 (직거래 계좌이체) */
export interface UserTransferAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface UserDocument {
  uid: string;
  /** 실명 (기본정보·배송용) */
  name: string;
  /** 닉네임 (서비스 내 표시용) */
  displayName: string;
  photoURL: string | null;
  email: string | null;
  phoneNumber: string | null;
  providers: AuthProviderId[];
  providerAccounts: Array<{
    provider: AuthProviderId;
    providerUserId: string;
  }>;
  defaultRegion: string | null;
  /** 회원 주소 (거주지) */
  address: UserAddress | null;
  /** 기본 배송지 */
  shippingAddress: UserShippingAddress | null;
  /** 직거래 계좌이체용 기본 계좌 */
  defaultTransferAccount: UserTransferAccount | null;
  role: UserRole;
  status: UserStatus;
  tradeStats: {
    purchaseCount: number;
    saleCount: number;
    ratingAverage: number;
    ratingCount: number;
  };
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  profileCompleted: boolean;
}

export type PublicUserProfile = Pick<
  UserDocument,
  "uid" | "displayName" | "photoURL" | "defaultRegion" | "tradeStats"
>;
