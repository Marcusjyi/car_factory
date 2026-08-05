export type ProductStatus =
  | "draft"
  | "selling"
  | "reserved"
  | "sold"
  | "hidden"
  | "blocked";

export type ProductCondition = "new" | "used" | "refurbished";

export type DeliveryMethod = "parcel" | "direct";

export type ShippingFeeType = "included" | "separate" | "cod";

export type ProductGrade = "A" | "B" | "C";

/**
 * 사진은 Cloud Storage에 저장하고, Firestore에는 URL·경로만 보관한다.
 * Storage: product-images/{sellerUid}/{productId}/{imageId}_{thumb|list|detail}.webp
 * 구 데이터는 단일 .jpg + downloadURL만 있을 수 있다.
 */
export interface ProductImage {
  /** detail Storage path (삭제용, 하위 호환) */
  path: string;
  /** detail URL — 상세 갤러리 */
  downloadURL: string;
  /** 소형 썸네일 (긴 변 ~400) */
  thumbURL?: string;
  thumbPath?: string;
  /** 목록·카드용 (긴 변 ~800) */
  listURL?: string;
  listPath?: string;
  /** detail 기준 픽셀 */
  width: number;
  height: number;
  sortOrder: number;
}

/** Firestore `products/{productId}` 판매 등록 문서 */
export interface ProductDocument {
  /** 문서 ID (products/{id} 와 동일, users.uid 대응) */
  id: string;
  /** 판매자 Auth UID */
  sellerUid: string;
  /** 판매자 닉네임 (공개 표시용 스냅샷) */
  sellerDisplayName: string;
  title: string;
  description: string;
  categoryId: string;
  /** 부품명 (필수) — 예: 헤드라이트 */
  partName: string;
  manufacturer: string;
  vehicleMakeId: string;
  vehicleModelId: string;
  vehicleModelName: string;
  modelYearFrom: number | null;
  modelYearTo: number | null;
  /** 부품번호 (선택) — 향후 부품번호 DB 연동 */
  partNumber: string;
  oemNumber: string | null;
  condition: ProductCondition;
  conditionGrade: ProductGrade | null;
  conditionDescription: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  deliveryMethods: DeliveryMethod[];
  shippingFeeType: ShippingFeeType;
  shippingFee: number;
  region: string | null;
  /** Storage URL 목록 (바이너리 미저장) */
  images: ProductImage[];
  /** images[0] listURL(또는 downloadURL) 캐시 — 홈·목록 카드용 */
  thumbnailURL: string;
  status: ProductStatus;
  /** 상품 고유번호 CF-YYMMDD-NNNNN (Functions 발급) */
  listingNumber?: string;
  viewCount: number;
  favoriteCount: number;
  chatCount: number;
  searchKeywords: string[];
  normalizedTitle: string;
  createdAt: string;
  updatedAt: string;
  soldAt: string | null;
}

export interface ProductPublicDto {
  id: string;
  title: string;
  price: number;
  thumbnailURL: string;
  images: ProductImage[];
  location: string | null;
  condition: ProductCondition;
  conditionGrade: ProductGrade | null;
  conditionDescription: string;
  manufacturer: string;
  vehicleMakeId: string;
  vehicleModelId: string;
  vehicleModelName: string;
  modelYearFrom: number | null;
  modelYearTo: number | null;
  partName: string;
  partNumber: string;
  categoryId: string;
  description: string;
  shippingFeeType: ShippingFeeType;
  shippingFee: number;
  viewCount: number;
  sellerUid: string;
  sellerDisplayName: string;
  status: ProductStatus;
  /** 예약 중인 구매자 (직거래) */
  reservedBuyerUid?: string | null;
  /** 진행 중 직거래 주문 ID */
  activeOrderId?: string | null;
  /** 판매완료 시각 (판매 후 채팅 기간 계산용) */
  soldAt?: string | null;
  /** 상품 고유번호 CF-YYMMDD-NNNNN */
  listingNumber?: string;
  createdAt: string;
}

export interface CreateProductDraftInput {
  manufacturer: string;
  vehicleMakeId: string;
  vehicleModelId: string;
  vehicleModelName: string;
  modelYearFrom: number | null;
  partName: string;
  partNumber: string;
  condition: ProductCondition;
  conditionGrade: ProductGrade | null;
  conditionDescription?: string;
  sellerDisplayName?: string;
  categoryId?: string;
  price?: number;
  shippingFee?: number;
  shippingFeeType?: ShippingFeeType;
  description?: string;
  region?: string | null;
}

export interface ProductSearchFilter {
  q?: string;
  categoryId?: string;
  manufacturer?: string;
  vehicleMakeId?: string;
  sellerUid?: string;
  /** true면 status 필터 없이 판매자 전체 상품 (내 상점용) */
  includeAllStatuses?: boolean;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  region?: string;
  status?: ProductStatus;
  /** 여러 상태 조회 (예: 판매중+예약중). 지정 시 status 무시 */
  statuses?: ProductStatus[];
  sort?: "latest" | "priceAsc" | "priceDesc" | "relevance";
  limit?: number;
}

export interface UpdateProductInput {
  manufacturer?: string;
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleModelName?: string;
  modelYearFrom?: number | null;
  modelYearTo?: number | null;
  partName?: string;
  partNumber?: string;
  condition?: ProductCondition;
  conditionGrade?: ProductGrade | null;
  conditionDescription?: string;
  categoryId?: string;
  price?: number;
  shippingFee?: number;
  shippingFeeType?: ShippingFeeType;
  description?: string;
  region?: string | null;
  status?: ProductStatus;
}
