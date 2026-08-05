/** users/{uid}/cartItems/{productId}
 *
 * productId = 판매 등록(리스팅) ID.
 * 같은 부품이라도 판매자(리스팅)가 다르면 productId가 다르므로 장바구니 행이 분리된다.
 * 가격·배송비는 장바구니 로드 시 상품 문서와 비교해, 변동된 경우에만 반영한다.
 */
export interface CartItemDocument {
  productId: string;
  sellerUid: string;
  sellerDisplayName: string;
  title: string;
  thumbnailURL: string;
  conditionDescription: string;
  yearRange: string;
  quantity: number;
  /** 상품 문서 기준 최신 판매가 */
  price: number;
  /** 상품 문서 기준 최신 배송비 */
  shippingFee: number;
  /** 상품이 삭제·비공개 등으로 조회 불가 */
  unavailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddCartItemInput = {
  productId: string;
  sellerUid: string;
  sellerDisplayName?: string;
  title: string;
  thumbnailURL?: string;
  conditionDescription?: string;
  yearRange?: string;
  price: number;
  shippingFee?: number;
  quantity?: number;
};

/** UI용 장바구니 행 (선택 상태는 클라이언트 전용) */
export type CartListItem = CartItemDocument & {
  selected: boolean;
};
