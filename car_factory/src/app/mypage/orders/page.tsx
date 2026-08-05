import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { OrdersListClient } from "./OrdersListClient";

export default function MyPageOrdersPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:flex-row md:gap-8 md:py-10">
        <MyPageSidebar activeHref="/mypage/orders" />
        <div className="min-w-0 flex-1 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',Segoe_UI,sans-serif]">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
            거래 내역
          </h1>
          <p className="mt-1 text-[15px] tracking-[-0.01em] text-[#86868b]">
            거래 기록을 한곳에서 확인하세요.
          </p>
          <OrdersListClient />
        </div>
      </main>
    </div>
  );
}
