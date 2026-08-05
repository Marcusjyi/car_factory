import { redirect } from "next/navigation";

/** 배송지는 내 정보 관리로 통합 */
export default function MyPageAddressesPage() {
  redirect("/mypage/profile#address");
}
