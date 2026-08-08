import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Phone, Wrench } from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { getInstallerById } from "@/lib/partners-server";

type PageProps = {
  params: Promise<{ installerId: string }>;
};

export const dynamic = "force-dynamic";

export default async function InstallerReservePage({ params }: PageProps) {
  const { installerId } = await params;
  const shop = await getInstallerById(installerId);
  if (!shop) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav />
      <Breadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "장착 대행점", href: "/installers" },
          { label: "예약" },
        ]}
      />

      <main className="mx-auto max-w-[720px] px-4 pb-12">
        <Link
          href="/installers"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          장착 대행점 목록
        </Link>

        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="relative h-48 w-full bg-gray-100">
            <Image
              src={shop.image}
              alt={shop.name}
              fill
              className="object-cover"
              sizes="720px"
              priority
            />
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-xl font-extrabold text-text md:text-2xl">
                  {shop.name} 예약
                </h1>
                <span className="text-xs font-semibold text-primary">
                  {shop.region}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {shop.description}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{shop.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-primary" />
                  <a
                    href={`tel:${shop.phone.replace(/-/g, "")}`}
                    className="hover:text-primary"
                  >
                    {shop.phone}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{shop.hours}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{shop.specialties.join(" · ")}</span>
                </li>
              </ul>
            </div>

            <form className="space-y-5 border-t border-border pt-6" action="#">
              <h2 className="text-base font-bold text-text">예약 정보</h2>

              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold text-text"
                >
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="예약자 이름"
                  className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-semibold text-text"
                >
                  연락처
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="date"
                    className="mb-1.5 block text-sm font-semibold text-text"
                  >
                    희망 날짜
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="mb-1.5 block text-sm font-semibold text-text"
                  >
                    희망 시간
                  </label>
                  <select
                    id="time"
                    name="time"
                    required
                    defaultValue=""
                    className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
                  >
                    <option value="" disabled>
                      시간 선택
                    </option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="part"
                  className="mb-1.5 block text-sm font-semibold text-text"
                >
                  장착 부품 / 주문번호
                </label>
                <input
                  id="part"
                  name="part"
                  type="text"
                  placeholder="예: 헤드램프 / CF-2026-0012"
                  className="h-11 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="memo"
                  className="mb-1.5 block text-sm font-semibold text-text"
                >
                  요청 사항
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  rows={4}
                  placeholder="차량 정보, 특이사항 등을 적어 주세요"
                  className="w-full rounded-lg border border-border-strong bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark"
              >
                예약 신청하기
              </button>
              <p className="text-center text-xs text-text-muted">
                * 현재는 UI 미리보기입니다. 신청 내용은 저장되지 않습니다.
              </p>
            </form>
          </div>
        </section>
      </main>

      <FeatureBar />
    </div>
  );
}
