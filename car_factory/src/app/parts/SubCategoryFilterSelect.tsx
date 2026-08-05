"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getCategoryGroup } from "@/lib/constants";

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm text-text outline-none focus:border-primary";

type SubCategoryFilterSelectProps = {
  groupId?: string;
  value?: string;
  brandId?: string;
  q?: string;
};

export function SubCategoryFilterSelect({
  groupId,
  value = "",
  brandId,
  q,
}: SubCategoryFilterSelectProps) {
  const router = useRouter();
  const group = groupId ? getCategoryGroup(groupId) : undefined;
  const options = group?.children ?? [];

  function onChange(nextSub: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (groupId) params.set("category", groupId);
    if (nextSub) params.set("sub", nextSub);
    if (brandId) params.set("brand", brandId);
    const qs = params.toString();
    router.push(qs ? `/parts?${qs}` : "/parts");
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label="중분류 선택"
        disabled={!group}
      >
        <option value="">{group ? "전체 중분류" : "대분류를 먼저 선택"}</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
