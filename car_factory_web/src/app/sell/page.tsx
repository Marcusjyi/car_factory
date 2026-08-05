"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Stepper } from "@/components/ui/Stepper";
import { useAuth } from "@/features/auth/AuthProvider";
import { getProductRepository } from "@/features/products/product-repository";
import { BRANDS, CATEGORY_GROUPS, getCategoryGroup } from "@/lib/constants";
import { getVehicleModels } from "@/lib/vehicle-models";
import { cn } from "@/lib/utils";
import type { ProductGrade } from "@/types/product";

const SELL_STEPS = [
  { label: "정보 입력", number: 1 },
  { label: "사진 등록", number: 2 },
  { label: "등록완료", number: 3 },
];

const YEARS = Array.from({ length: 2026 - 1995 + 1 }, (_, i) => 2026 - i);

type ConditionChoice = "new" | ProductGrade;

const CONDITIONS: Array<{
  value: ConditionChoice;
  label: string;
  desc: string;
}> = [
  {
    value: "new",
    label: "미사용 신품",
    desc: "미개봉·미장착, 새 제품",
  },
  { value: "A", label: "A급 (사용감 적음)", desc: "외관·기능 양호, 즉시 사용 가능" },
  { value: "B", label: "B급 (사용감 있음)", desc: "경미한 스크래치·마모 있음" },
  { value: "C", label: "C급 (사용감 많음)", desc: "수리/교체 필요, 부품용" },
];

export default function SellPage() {
  const router = useRouter();
  const { firebaseUser, user, status } = useAuth();
  const [manufacturer, setManufacturer] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");
  const [categoryGroupId, setCategoryGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [price, setPrice] = useState("");
  const [shippingFee, setShippingFee] = useState("3000");
  const [conditionChoice, setConditionChoice] = useState<ConditionChoice>("A");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const models = manufacturer ? getVehicleModels(manufacturer) : [];
  const categoryGroup = categoryGroupId
    ? getCategoryGroup(categoryGroupId)
    : undefined;
  const subCategories = categoryGroup?.children ?? [];

  async function onNext() {
    setError(null);
    if (status !== "authenticated" || !firebaseUser) {
      router.push("/login?next=/sell");
      return;
    }
    if (
      !manufacturer ||
      !modelId ||
      !year ||
      !categoryGroupId ||
      !categoryId ||
      !partName.trim()
    ) {
      setError(
        "제조사, 모델, 연식, 카테고리, 부품명을 모두 입력해주세요.",
      );
      return;
    }
    const priceNum = Number(price.replace(/,/g, ""));
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError("판매 가격을 입력해주세요.");
      return;
    }
    const shippingFeeNum = Number(shippingFee.replace(/,/g, ""));
    if (Number.isNaN(shippingFeeNum) || shippingFeeNum < 0) {
      setError("배송비를 확인해주세요. (0원 이상)");
      return;
    }

    const make = BRANDS.find((m) => m.id === manufacturer);
    const model = models.find((m) => m.id === modelId);
    if (!make || !model) {
      setError("차량 정보를 확인해주세요.");
      return;
    }

    setSaving(true);
    try {
      const repo = getProductRepository();
      const productId = await repo.createDraft(firebaseUser.uid, {
        manufacturer: make.label,
        vehicleMakeId: make.id,
        vehicleModelId: model.id,
        vehicleModelName: model.label,
        modelYearFrom: Number(year),
        partName: partName.trim(),
        partNumber: partNumber.trim(),
        condition: conditionChoice === "new" ? "new" : "used",
        conditionGrade: conditionChoice === "new" ? null : conditionChoice,
        conditionDescription:
          conditionChoice === "new" ? "미사용 신품" : `${conditionChoice}급`,
        sellerDisplayName: user?.displayName?.trim() || "",
        categoryId,
        price: priceNum,
        shippingFee: shippingFeeNum,
        shippingFeeType: shippingFeeNum === 0 ? "included" : "separate",
        description: description.trim(),
      });
      sessionStorage.setItem("cf_draft_product_id", productId);
      router.push(`/sell/photos?productId=${productId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "임시 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[640px] px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-text">판매하기</h1>
          <p className="mt-2 text-sm text-text-secondary">
            간편한 3단계로 내 부품을 판매해보세요
          </p>
        </div>

        <Stepper steps={SELL_STEPS} current={1} className="mb-8" />

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <section className="mb-8">
            <h2 className="mb-4 text-base font-bold text-text">차량 선택</h2>
            <div className="space-y-3">
              <SelectField
                label="제조사"
                value={manufacturer}
                onChange={(v) => {
                  setManufacturer(v);
                  setModelId("");
                }}
              >
                <option value="">제조사 선택</option>
                {BRANDS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="모델"
                value={modelId}
                onChange={setModelId}
              >
                <option value="">모델 선택</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </SelectField>
              <SelectField label="연식" value={year} onChange={setYear}>
                <option value="">연식 선택</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </SelectField>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-base font-bold text-text">카테고리</h2>
            <div className="space-y-3">
              <SelectField
                label="대분류 *"
                value={categoryGroupId}
                onChange={(v) => {
                  setCategoryGroupId(v);
                  setCategoryId("");
                }}
              >
                <option value="">대분류 선택</option>
                {CATEGORY_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="중분류 *"
                value={categoryId}
                onChange={setCategoryId}
              >
                <option value="">
                  {categoryGroupId ? "중분류 선택" : "대분류를 먼저 선택"}
                </option>
                {subCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-base font-bold text-text">부품 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  부품명 <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="예: 헤드라이트, 범퍼, 사이드미러"
                    className="h-11 w-full rounded-lg border border-border px-3 pr-10 text-sm outline-none focus:border-primary"
                  />
                  {partName ? (
                    <button
                      type="button"
                      onClick={() => setPartName("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                      aria-label="부품명 지우기"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  부품번호{" "}
                  <span className="font-normal text-text-muted">(선택)</span>
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="예: 92101-3X000"
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  부품번호를 모르실 땐 비워두세요.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  판매 가격 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="예: 150000"
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  배송비 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shippingFee}
                  onChange={(e) =>
                    setShippingFee(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="예: 3000 (무료면 0)"
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  숫자만 입력해 주세요. 배송비 무료는 0으로 입력합니다.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  상세 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="상태, 장착 이력, 하자 여부 등을 적어주세요."
                />
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-base font-bold text-text">상태 선택</h2>
            <div className="space-y-2">
              {CONDITIONS.map((g) => (
                <label
                  key={g.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                    conditionChoice === g.value
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={g.value}
                    checked={conditionChoice === g.value}
                    onChange={() => setConditionChoice(g.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-bold text-text">{g.label}</p>
                    <p className="text-xs text-text-secondary">{g.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={() => void onNext()}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            다음
          </button>
        </div>
      </main>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-10 text-sm outline-none focus:border-primary"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}
