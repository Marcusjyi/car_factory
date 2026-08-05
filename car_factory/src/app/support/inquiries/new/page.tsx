import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";

const INQUIRY_CATEGORIES = [
  "주문/배송",
  "환불/교환",
  "부품 호환",
  "결제/정산",
  "판매 문의",
  "기타",
];

export default function NewInquiryPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav />
      <Breadcrumbs
        items={[
          { label: "고객센터", href: "/support" },
          { label: "1:1 문의" },
        ]}
      />

      <main className="mx-auto max-w-[640px] px-4 pb-12">
        <Link
          href="/support"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          고객센터로 돌아가기
        </Link>

        <section className="rounded-[12px] border border-border bg-white p-6 md:p-8">
          <h1 className="text-xl font-extrabold text-text">1:1 문의</h1>
          <p className="mt-2 text-sm text-text-secondary">
            문의 내용을 남겨 주시면 영업일 기준 1~2일 내 답변드립니다.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            * 로그인 후 이용 가능한 서비스입니다. (UI 미리보기)
          </p>

          <form className="mt-8 space-y-5" action="#" method="post">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-text">
                제목
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="문의 제목을 입력해 주세요"
                className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-semibold text-text"
              >
                문의 유형
              </label>
              <select
                id="category"
                name="category"
                defaultValue=""
                className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="" disabled>
                  유형을 선택해 주세요
                </option>
                {INQUIRY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-1.5 block text-sm font-semibold text-text"
              >
                문의 내용
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                placeholder="문의 내용을 자세히 입력해 주세요"
                className="w-full resize-y rounded-lg border border-border-strong bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark"
            >
              문의 등록
            </button>
          </form>
        </section>
      </main>

      <FeatureBar />
    </div>
  );
}
