import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { MyProfileClient } from "@/components/mypage/MyProfileClient";

export default function MyPageProfilePage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:flex-row md:gap-8">
        <MyPageSidebar activeHref="/mypage/profile" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-text">내 정보 관리</h1>
          <p className="mt-1 text-sm text-text-secondary">
            기본 정보와 배송지를 수정할 수 있습니다.
          </p>
          <MyProfileClient />
        </div>
      </main>
    </div>
  );
}
