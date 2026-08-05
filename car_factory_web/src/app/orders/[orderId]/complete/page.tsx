import { redirect } from "next/navigation";

type OrderCompletePageProps = {
  params: Promise<{ orderId: string }>;
};

/** 레거시 PG 목업 경로 → 직거래 상세로 연결 */
export default async function OrderCompletePage({
  params,
}: OrderCompletePageProps) {
  const { orderId } = await params;
  redirect(`/orders/${orderId}`);
}
