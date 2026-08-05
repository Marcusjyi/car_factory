import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { MyPageDashboardClient } from "@/components/mypage/MyPageDashboardClient";

export default function MyPageDashboard() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <MyPageSidebar activeHref="/mypage" />
          <div className="min-w-0 flex-1">
            <MyPageDashboardClient />
          </div>
        </div>
      </main>
    </div>
  );
}
