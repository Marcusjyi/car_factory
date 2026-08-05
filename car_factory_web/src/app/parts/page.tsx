import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import {
  productError,
  productLog,
  toCardProduct,
} from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import {
  BRANDS,
  CATEGORIES,
  CATEGORY_GROUPS,
  getCategoryGroup,
  getGroupBySubCategory,
  getSubCategory,
  getSubCategoryIdsByGroup,
} from "@/lib/constants";
import type { Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { BrandFilterSelect } from "./BrandFilterSelect";
import { PartsResultsSection } from "./PartsResultsSection";
import { SubCategoryFilterSelect } from "./SubCategoryFilterSelect";

type PartsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sub?: string;
    brand?: string;
  }>;
};

const CONDITIONS = ["미사용 신품", "중고 (A급)", "중고 (B급)", "중고 (C급)"] as const;
const DELIVERY_METHODS = ["택배", "직거래", "화물택배"] as const;
const FILTER_TEXT = "text-sm";
const FILTER_LABEL = `${FILTER_TEXT} text-text-secondary`;
const FILTER_INPUT =
  "h-9 w-full rounded-lg border border-border px-2.5 text-sm text-text outline-none focus:border-primary";
const FILTER_SELECT =
  "h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-text outline-none focus:border-primary";
const FILTER_CHECKBOX = "size-4 rounded border-border-strong accent-primary";

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

function filterListedProducts(
  items: Product[],
  input: {
    q?: string;
    groupId?: string;
    subId?: string;
    brandId?: string;
  },
) {
  let next = items;

  if (input.subId) {
    next = next.filter((p) => p.categoryId === input.subId);
  } else if (input.groupId) {
    const ids = new Set(getSubCategoryIdsByGroup(input.groupId));
    next = next.filter((p) => ids.has(p.categoryId));
  }

  if (input.brandId) {
    next = next.filter((p) => p.brand === input.brandId);
  }

  const q = input.q ? normalize(input.q) : "";
  if (!q) return next;

  const subMatch = CATEGORIES.find(
    (c) => normalize(c.label) === q || normalize(c.id) === q,
  );
  const groupMatch = CATEGORY_GROUPS.find(
    (g) => normalize(g.label) === q || normalize(g.id) === q,
  );

  return next.filter((product) => {
    if (subMatch && product.categoryId === subMatch.id) return true;
    if (groupMatch) {
      const ids = getSubCategoryIdsByGroup(groupMatch.id);
      if (ids.includes(product.categoryId)) return true;
    }
    return (
      normalize(product.title).includes(q) ||
      normalize(product.partNumber).includes(q) ||
      normalize(product.brand).includes(q) ||
      normalize(product.condition).includes(q) ||
      normalize(product.categoryId).includes(q)
    );
  });
}

export default async function PartsPage({ searchParams }: PartsPageProps) {
  const params = await searchParams;
  const queryFromQ = params.q?.trim() || undefined;
  const brandId = params.brand?.trim() || undefined;
  const brand = BRANDS.find((b) => b.id === brandId);

  let groupId = params.category?.trim() || undefined;
  let subId = params.sub?.trim() || undefined;

  if (groupId && !getCategoryGroup(groupId)) {
    const asSub = getSubCategory(groupId);
    if (asSub) {
      subId = groupId;
      groupId = getGroupBySubCategory(groupId)?.id;
    }
  }

  const group = groupId ? getCategoryGroup(groupId) : undefined;
  const sub = subId ? getSubCategory(subId) : undefined;

  const displayQuery =
    queryFromQ ?? sub?.label ?? group?.label ?? (groupId || subId || "전체");
  const searchBoxValue = queryFromQ ?? sub?.label ?? group?.label ?? "";

  const invalid =
    (groupId && !group) || (subId && !sub) || (brandId && !brand);

  let products: Product[] = [];

  productLog("PartsPage", "request", {
    rawCategory: params.category ?? null,
    rawSub: params.sub ?? null,
    rawBrand: params.brand ?? null,
    rawQ: params.q ?? null,
    groupId: group?.id ?? null,
    subId: sub?.id ?? null,
    brandId: brand?.id ?? null,
    invalid,
  });

  if (!invalid) {
    try {
      const dtos = await getProductRepository().listProducts({
        statuses: ["selling", "reserved"],
        sort: "latest",
        limit: 100,
        // 중분류가 있으면 Firestore에서 직접 필터
        categoryId: sub?.id,
        vehicleMakeId: brand?.id,
      });

      const cards = dtos.map(toCardProduct);
      products = filterListedProducts(cards, {
        q: group || sub ? undefined : queryFromQ,
        // sub는 이미 Firestore categoryId로 걸렀으므로 중복 필터 생략 가능하지만
        // group만 선택된 경우는 클라이언트에서 대분류 하위 id로 거름
        groupId: sub ? undefined : group?.id,
        subId: undefined,
        brandId: brand?.id,
      });

      productLog("PartsPage", "firestore products", {
        fetched: cards.length,
        afterFilter: products.length,
        fetchedIds: cards.map((p) => p.id),
        fetchedCategories: cards.map((p) => p.categoryId),
        resultIds: products.map((p) => p.id),
        source: "firestore",
      });
    } catch (error) {
      productError("PartsPage", error, {
        groupId: group?.id ?? null,
        subId: sub?.id ?? null,
        brandId: brand?.id ?? null,
      });
      products = [];
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader searchValue={searchBoxValue} />

      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1200px] gap-5 overflow-x-auto px-4">
          <Link
            href={
              brand
                ? `/parts?brand=${encodeURIComponent(brand.id)}`
                : queryFromQ
                  ? `/parts?q=${encodeURIComponent(queryFromQ)}`
                  : "/parts"
            }
            className={cn(
              "relative shrink-0 py-3 text-sm font-medium transition",
              !group
                ? "font-bold text-primary"
                : "text-text-secondary hover:text-primary",
            )}
          >
            전체
            {!group ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            ) : null}
          </Link>
          {CATEGORY_GROUPS.map((item) => {
            const active = group?.id === item.id;
            const hrefParams = new URLSearchParams();
            hrefParams.set("category", item.id);
            if (brand?.id) hrefParams.set("brand", brand.id);
            return (
              <Link
                key={item.id}
                href={`/parts?${hrefParams.toString()}`}
                className={cn(
                  "relative shrink-0 py-3 text-sm font-medium transition",
                  active
                    ? "font-bold text-primary"
                    : "text-text-secondary hover:text-primary",
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="mx-auto flex max-w-[1200px] gap-6 px-4 py-6">
        <aside className="hidden w-[220px] shrink-0 space-y-5 lg:block">
          <FilterSection title="브랜드">
            <BrandFilterSelect
              value={brand?.id ?? ""}
              categoryId={group?.id}
              subId={sub?.id}
              q={group || sub ? undefined : queryFromQ}
            />
          </FilterSection>

          <FilterSection title="중분류">
            <SubCategoryFilterSelect
              groupId={group?.id}
              value={sub?.id ?? ""}
              brandId={brand?.id}
              q={group || sub ? undefined : queryFromQ}
            />
          </FilterSection>

          <FilterSection title="상품 상태">
            <ul className="space-y-2">
              {CONDITIONS.map((condition) => (
                <li key={condition}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      FILTER_LABEL,
                    )}
                  >
                    <input type="checkbox" className={FILTER_CHECKBOX} />
                    {condition}
                  </label>
                </li>
              ))}
            </ul>
          </FilterSection>

          <FilterSection title="가격대">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="최소"
                className={FILTER_INPUT}
              />
              <span className={`${FILTER_TEXT} text-text-muted`}>~</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="최대"
                className={FILTER_INPUT}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <p className="text-xs text-text-muted">단위: 만원</p>
            </div>
          </FilterSection>

          <FilterSection title="지역">
            <div className="relative">
              <select defaultValue="" className={FILTER_SELECT}>
                <option value="">전국</option>
                <option value="seoul">서울</option>
                <option value="gyeonggi">경기</option>
                <option value="incheon">인천</option>
                <option value="busan">부산</option>
                <option value="daegu">대구</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </FilterSection>

          <FilterSection title="배송 방법">
            <ul className="space-y-2">
              {DELIVERY_METHODS.map((method) => (
                <li key={method}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      FILTER_LABEL,
                    )}
                  >
                    <input
                      type="checkbox"
                      defaultChecked={method === "택배"}
                      className={FILTER_CHECKBOX}
                    />
                    {method}
                  </label>
                </li>
              ))}
            </ul>
          </FilterSection>
        </aside>

        <PartsResultsSection query={displayQuery} products={products} />
      </main>

      <FeatureBar />
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-text">{title}</h2>
      {children}
    </section>
  );
}
