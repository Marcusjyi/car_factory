import { redirect } from "next/navigation";

/** PG 목업 체크아웃 제거 — 직거래는 상품 상세 「거래하기」로 진행 */
export default function CheckoutPage() {
  redirect("/cart");
}
