import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { MyShopProductsClient } from "@/components/mypage/MyShopProductsClient";

export default function MyPageProductsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:flex-row md:gap-8">
        <MyPageSidebar activeHref="/mypage/products" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-text">내 상점 관리</h1>
          <p className="mt-1 text-sm text-text-secondary">
            등록한 부품과 판매 현황을 관리할 수 있습니다.
          </p>
          <MyShopProductsClient />
        </div>
      </main>
    </div>
  );
}
