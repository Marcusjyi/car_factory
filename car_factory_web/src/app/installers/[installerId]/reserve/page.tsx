import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Phone, Wrench } from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { getInstallerById } from "@/lib/partners-server";
import { InstallerReserveForm } from "./ReserveForm";

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

            <InstallerReserveForm
              partner={{
                id: shop.id,
                name: shop.name,
                region: shop.region,
                address: shop.address,
                phone: shop.phone,
              }}
            />
          </div>
        </section>
      </main>

      <FeatureBar />
    </div>
  );
}
