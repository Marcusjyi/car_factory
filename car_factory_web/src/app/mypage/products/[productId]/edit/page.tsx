"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, Loader2, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MyPageSidebar } from "@/components/layout/MyPageSidebar";
import { useAuth } from "@/features/auth/AuthProvider";
import { getProductRepository } from "@/features/products/product-repository";
import {
  BRANDS,
  CATEGORY_GROUPS,
  getCategoryGroup,
  getGroupBySubCategory,
} from "@/lib/constants";
import { getVehicleModels } from "@/lib/vehicle-models";
import { cn } from "@/lib/utils";
import type { ProductGrade } from "@/types/product";

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

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function EditMyProductPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const productId = params?.productId;
  const { firebaseUser, user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const models = manufacturer ? getVehicleModels(manufacturer) : [];
  const categoryGroup = categoryGroupId
    ? getCategoryGroup(categoryGroupId)
    : undefined;
  const subCategories = categoryGroup?.children ?? [];

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !firebaseUser) {
      router.replace(`/login?next=/mypage/products/${productId}/edit`);
      return;
    }
    if (!productId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const product = await getProductRepository().getOwnedProduct(
          productId,
          firebaseUser.uid,
        );
        if (cancelled) return;
        if (!product) {
          setError("상품을 찾을 수 없습니다.");
          return;
        }
        if (product.status === "hidden" || product.status === "blocked") {
          setError("삭제되었거나 제재된 상품은 수정할 수 없습니다.");
          return;
        }
        if (product.status === "sold") {
          setError(
            "판매완료된 상품은 수정할 수 없습니다. 기록 보관용으로 유지됩니다.",
          );
          return;
        }
        if (product.status === "reserved") {
          setError(
            "예약 중인 상품은 수정할 수 없습니다. 예약을 취소한 뒤 수정해 주세요.",
          );
          return;
        }

        setManufacturer(product.vehicleMakeId || "");
        setModelId(product.vehicleModelId || "");
        setYear(product.modelYearFrom ? String(product.modelYearFrom) : "");
        const group = getGroupBySubCategory(product.categoryId);
        setCategoryGroupId(group?.id ?? "");
        setCategoryId(product.categoryId || "");
        setPartName(product.partName || "");
        setPartNumber(product.partNumber || "");
        setPrice(product.price ? String(product.price) : "");
        setShippingFee(String(product.shippingFee ?? 0));
        setConditionChoice(
          product.condition === "new"
            ? "new"
            : (product.conditionGrade as ProductGrade) || "A",
        );
        setDescription(product.description || "");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "상품을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, productId, router, status]);

  async function onSave() {
    if (!firebaseUser || !productId) return;
    setError(null);

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

    const title =
      `${make.label} ${model.label} ${partName.trim()}`.trim();
    const keywords = Array.from(
      new Set(
        [
          make.label,
          model.label,
          partName.trim(),
          partNumber.trim(),
          year,
        ]
          .flatMap((t) => normalize(t).split(" "))
          .filter(Boolean),
      ),
    );

    setSaving(true);
    try {
      await getProductRepository().updateOwnedProduct(
        productId,
        firebaseUser.uid,
        {
          manufacturer: make.label,
          vehicleMakeId: make.id,
          vehicleModelId: model.id,
          vehicleModelName: model.label,
          modelYearFrom: Number(year),
          modelYearTo: Number(year),
          partName: partName.trim(),
          partNumber: partNumber.trim(),
          oemNumber: partNumber.trim() || null,
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
          title,
          searchKeywords: keywords,
          normalizedTitle: normalize(title),
        },
      );
      router.push("/mypage/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:flex-row md:gap-8">
        <MyPageSidebar activeHref="/mypage/products" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-text">상품 수정</h1>
              <p className="mt-1 text-sm text-text-secondary">
                등록한 부품 정보를 수정할 수 있습니다.
              </p>
            </div>
            <Link
              href="/mypage/products"
              className="text-sm font-medium text-text-secondary hover:text-primary"
            >
              ← 목록으로
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-[12px] border border-border bg-white py-16 text-sm text-text-muted">
              <Loader2 className="size-4 animate-spin" />
              불러오는 중…
            </div>
          ) : error && !manufacturer && !partName ? (
            <div className="mt-6 rounded-[12px] border border-dashed border-border bg-white p-10 text-center text-sm text-text-secondary">
              {error}
              <div className="mt-4">
                <Link
                  href="/mypage/products"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  내 상점 관리로 돌아가기
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
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
                      onChange={(e) =>
                        setPrice(e.target.value.replace(/[^\d]/g, ""))
                      }
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
                      className="h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                    />
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

              {error ? (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={saving}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  저장하기
                </button>
                <Link
                  href={`/sell/photos?productId=${productId}&from=edit`}
                  className="flex h-12 flex-1 items-center justify-center rounded-lg border border-border text-sm font-bold text-text-secondary hover:border-primary hover:text-primary"
                >
                  사진 수정
                </Link>
              </div>
            </div>
          )}
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
