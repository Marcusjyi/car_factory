import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, Wrench } from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { INSTALLERS } from "@/lib/installers";

export default function InstallersPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav />

      <Breadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "장착 대행점" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-12">
        <section className="mb-8">
          <h1 className="text-2xl font-extrabold text-text md:text-3xl">
            장착 대행점
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary md:text-base">
            카팩토리에서 구매한 부품을 가까운 장착 대행점에서 설치해 보세요.
          </p>
        </section>

        <ul className="grid gap-5 md:grid-cols-2">
          {INSTALLERS.map((shop) => (
            <li key={shop.id}>
              <Link
                href={`/installers/${shop.id}/reserve`}
                className="block overflow-hidden rounded-2xl border border-border bg-white transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="relative h-44 w-full bg-gray-100">
                  <Image
                    src={shop.image}
                    alt={shop.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 560px"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-bold text-text">{shop.name}</h2>
                    <span className="text-xs font-semibold text-primary">
                      {shop.region}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {shop.description}
                  </p>
                  <ul className="space-y-1.5 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{shop.address}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0 text-primary" />
                      <span>{shop.phone}</span>
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
                  <p className="pt-1 text-sm font-bold text-primary">
                    예약하기 →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-text-muted">
          장착 대행점 제휴 문의는{" "}
          <Link href="/support/inquiries/new" className="text-primary hover:underline">
            고객센터 1:1 문의
          </Link>
          로 남겨 주세요.
        </p>
      </main>

      <FeatureBar />
    </div>
  );
}
