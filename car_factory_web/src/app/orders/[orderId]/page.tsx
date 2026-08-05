import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { OrderDetailClient } from "./OrderDetailClient";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <SiteHeader />
      <Breadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "거래 내역", href: "/mypage/orders" },
          { label: "거래 상세" },
        ]}
      />
      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-2 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',Segoe_UI,sans-serif]">
        <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          거래 상세
        </h1>
        <OrderDetailClient orderId={orderId} />
      </main>
    </div>
  );
}
