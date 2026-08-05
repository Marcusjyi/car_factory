/** users/{uid}/addresses/{addressId} */
export interface ShippingAddressDocument {
  id: string;
  /** 배송지 별칭 — 예: 집, 회사 */
  label: string;
  recipient: string;
  phone: string;
  address1: string;
  address2: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertShippingAddressInput {
  label?: string;
  recipient: string;
  phone: string;
  address1: string;
  address2?: string;
  isDefault?: boolean;
}
