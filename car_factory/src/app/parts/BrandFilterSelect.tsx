"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { BRANDS } from "@/lib/constants";

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-text outline-none focus:border-primary";

type BrandFilterSelectProps = {
  value?: string;
  categoryId?: string;
  subId?: string;
  q?: string;
};

export function BrandFilterSelect({
  value = "",
  categoryId,
  subId,
  q,
}: BrandFilterSelectProps) {
  const router = useRouter();

  function onChange(nextBrand: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("category", categoryId);
    if (subId) params.set("sub", subId);
    if (nextBrand) params.set("brand", nextBrand);
    const qs = params.toString();
    router.push(qs ? `/parts?${qs}` : "/parts");
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label="브랜드 선택"
      >
        <option value="">전체 브랜드</option>
        {BRANDS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
