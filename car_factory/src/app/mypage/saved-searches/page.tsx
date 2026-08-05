import { redirect } from "next/navigation";

/** 찜한 검색 메뉴 제거 — 대시보드로 안내 */
export default function MyPageSavedSearchesPage() {
  redirect("/mypage");
}
