import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import { ProductCard } from "@/components/product/ProductCard";
import {
  productError,
  productLog,
  toCardProduct,
} from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import { CATEGORY_GROUPS } from "@/lib/constants";
import { PRODUCT_GRID_CLASS } from "@/lib/product-ui";
import {
  CarFront,
  Lightbulb,
  Armchair,
  Cog,
  Disc3,
  CircleDot,
  Snowflake,
  Cpu,
  CircleStop,
  Package,
  Wrench,
} from "lucide-react";

const CATEGORY_ICONS = [
  CarFront,
  Lightbulb,
  Armchair,
  Cog,
  Disc3,
  CircleDot,
  Snowflake,
  Cpu,
  CircleStop,
  Package,
];

export default async function HomePage() {
  let recentProducts: ReturnType<typeof toCardProduct>[] = [];
  try {
    const dtos = await getProductRepository().listProducts({
      statuses: ["selling", "reserved"],
      sort: "latest",
      limit: 5,
    });
    recentProducts = dtos.map(toCardProduct);
    productLog("HomePage", "recent products loaded", {
      count: recentProducts.length,
      ids: recentProducts.map((p) => p.id),
    });
  } catch (error) {
    productError("HomePage", error);
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <HomeHeroCarousel />

      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
          <div className="mb-4 flex items-center justify-between md:mb-5">
            <div>
              <h2 className="text-lg font-bold text-text">부품 찾아보기</h2>
              <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                대분류를 고르거나 부품번호·차종으로 바로 검색하세요.
              </p>
            </div>
            <Link
              href="/parts"
              className="hidden items-center text-sm font-medium text-text-secondary hover:text-primary sm:flex"
            >
              전체 검색 <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-11">
            {CATEGORY_GROUPS.map((c, i) => {
              const Icon = CATEGORY_ICONS[i] ?? Package;
              return (
                <Link
                  key={c.id}
                  href={`/parts?category=${c.id}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg px-1.5 py-3 text-center transition hover:border-text/20 hover:bg-white sm:gap-2 sm:px-2 sm:py-3.5"
                >
                  <Icon className="size-5 text-text" />
                  <span className="text-[11px] font-medium leading-tight text-text sm:text-xs">
                    {c.label}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/installers"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-light px-1.5 py-3 text-center transition hover:border-primary/50 sm:gap-2 sm:px-2 sm:py-3.5"
            >
              <Wrench className="size-5 text-primary" />
              <span className="text-[11px] font-semibold leading-tight text-primary sm:text-xs">
                장착점
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 pb-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">최근 등록된 부품</h2>
          <Link
            href="/parts"
            className="flex items-center text-sm text-text-secondary hover:text-primary"
          >
            더보기 <ChevronRight className="size-4" />
          </Link>
        </div>
        {recentProducts.length === 0 ? (
          <p className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-text-secondary">
            아직 등록된 부품이 없습니다.
          </p>
        ) : (
          <div className={PRODUCT_GRID_CLASS}>
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <FeatureBar />
    </div>
  );
}
