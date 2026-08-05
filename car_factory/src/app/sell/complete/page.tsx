import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Stepper } from "@/components/ui/Stepper";

const SELL_STEPS = [
  { label: "정보 입력", number: 1 },
  { label: "사진 등록", number: 2 },
  { label: "등록완료", number: 3 },
];

export default function SellCompletePage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[640px] px-4 py-8">
        <Stepper steps={SELL_STEPS} current={3} className="mb-10" />

        <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-sm md:px-10">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary-light">
            <CheckCircle2 className="size-9 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold text-text md:text-2xl">
            등록이 완료되었습니다!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            등록한 부품은 검토 후 목록에 노출됩니다.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/mypage/products"
              className="flex h-12 items-center justify-center rounded-lg border border-primary text-sm font-bold text-primary hover:bg-primary-light"
            >
              내 상품 보기
            </Link>
            <Link
              href="/"
              className="flex h-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark"
            >
              홈으로 가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
