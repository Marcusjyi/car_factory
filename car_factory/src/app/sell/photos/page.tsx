"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Info, Loader2, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Stepper } from "@/components/ui/Stepper";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  MAX_PHOTOS,
  deleteProductImage,
  getThumbImageUrl,
  productThumbnailFromImages,
  uploadProductImage,
} from "@/features/products/image-upload";
import {
  productError,
  productLog,
} from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import type { ProductImage } from "@/types/product";

const SELL_STEPS = [
  { label: "정보 입력", number: 1 },
  { label: "사진 등록", number: 2 },
  { label: "등록완료", number: 3 },
];

function SellPhotosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, status } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const isEditMode = searchParams?.get("from") === "edit";

  useEffect(() => {
    const fromQuery = searchParams?.get("productId");
    const fromSession =
      typeof window !== "undefined"
        ? sessionStorage.getItem("cf_draft_product_id")
        : null;
    const id = fromQuery || fromSession;
    if (!id) {
      router.replace(isEditMode ? "/mypage/products" : "/sell");
      return;
    }
    setProductId(id);
  }, [searchParams, router, isEditMode]);

  useEffect(() => {
    if (!productId || status === "loading") return;
    if (status !== "authenticated" || !firebaseUser) {
      setLoadingPhotos(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPhotos(true);
      try {
        const product = await getProductRepository().getOwnedProduct(
          productId,
          firebaseUser.uid,
        );
        if (cancelled) return;
        if (product?.images?.length) {
          setPhotos(product.images);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "기존 사진을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPhotos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, firebaseUser, status]);

  async function onSelectFiles(files: FileList | null) {
    if (!files?.length || !productId || !firebaseUser) return;
    setError(null);
    setUploading(true);
    try {
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setError(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있습니다.`);
        return;
      }
      const allSelected = Array.from(files);
      const selected = allSelected.slice(0, remaining);
      const truncated = allSelected.length > remaining;
      const uploaded: ProductImage[] = [];
      for (let i = 0; i < selected.length; i++) {
        const image = await uploadProductImage({
          sellerUid: firebaseUser.uid,
          productId,
          file: selected[i]!,
          sortOrder: photos.length + i,
        });
        uploaded.push(image);
        setPhotos((prev) => [...prev, image]);
      }
      const next = [...photos, ...uploaded];
      await getProductRepository().updateOwnedProduct(
        productId,
        firebaseUser.uid,
        {
          images: next,
          thumbnailURL: productThumbnailFromImages(next),
        },
      );
      if (truncated) {
        setError(
          `최대 ${MAX_PHOTOS}장까지 가능해서 ${selected.length}장만 추가했습니다.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto(index: number) {
    if (!productId || !firebaseUser) return;
    const target = photos[index];
    if (!target) return;
    try {
      await deleteProductImage(target);
      const next = photos
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, sortOrder: i }));
      setPhotos(next);
      await getProductRepository().updateOwnedProduct(
        productId,
        firebaseUser.uid,
        {
          images: next,
          thumbnailURL: productThumbnailFromImages(next),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  }

  async function onPublish() {
    if (!productId || !firebaseUser) {
      router.push(
        isEditMode
          ? `/login?next=/sell/photos?productId=${productId}&from=edit`
          : "/login?next=/sell",
      );
      return;
    }
    productLog("SellPhotos", "publish clicked", {
      productId,
      sellerUid: firebaseUser.uid,
      photoCount: photos.length,
      isEditMode,
    });
    if (photos.length === 0) {
      setError("사진을 1장 이상 등록해주세요.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      if (isEditMode) {
        await getProductRepository().updateOwnedProduct(
          productId,
          firebaseUser.uid,
          {
            images: photos,
            thumbnailURL: productThumbnailFromImages(photos),
          },
        );
        productLog("SellPhotos", "edit photos saved", { productId });
        router.push("/mypage/products");
        return;
      }
      await getProductRepository().publishDraft(productId, firebaseUser.uid);
      productLog("SellPhotos", "publish success", { productId });
      sessionStorage.removeItem("cf_draft_product_id");
      router.push(`/sell/complete?productId=${productId}`);
    } catch (e) {
      productError("SellPhotos", e, { productId });
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setPublishing(false);
    }
  }

  if (status === "loading" || !productId || loadingPhotos) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[640px] px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-text">
            {isEditMode ? "사진 수정" : "판매하기"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            부품 사진을 등록해 주세요.
          </p>
        </div>

        {isEditMode ? null : (
          <Stepper steps={SELL_STEPS} current={2} className="mb-8" />
        )}

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-1 text-base font-bold text-text">
            사진 등록{" "}
            <span className="font-normal text-text-secondary">
              (최대 {MAX_PHOTOS}장)
            </span>
          </h2>
          <p className="mb-5 text-xs text-text-muted">
            정면, 측면, 부품번호 등 다양한 각도의 사진을 올려주세요. 파일 선택
            창에서 여러 장을 한 번에 고를 수 있습니다.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void onSelectFiles(e.target.files)}
          />

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo, i) => (
              <div
                key={`${photo.path}-${i}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getThumbImageUrl(photo) || photo.downloadURL}
                  alt={`업로드 사진 ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  onClick={() => void removePhoto(i)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="사진 삭제"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border-strong text-text-muted hover:border-primary hover:text-primary disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-6 animate-spin" />
                    <span className="text-[10px]">업로드 중</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-6" />
                    <span className="text-xs">사진 추가</span>
                    <span className="text-[10px] text-text-muted">여러 장 가능</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          <div className="mt-5 flex gap-2 rounded-lg bg-primary-light px-4 py-3 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-bold">TIP</span> 다양한 각도에서 촬영하시면
              구매자 신뢰도를 높여줍니다.
            </p>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={() => void onPublish()}
            disabled={publishing || uploading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEditMode ? "저장하기" : "다음"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SellPhotosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
          불러오는 중...
        </div>
      }
    >
      <SellPhotosInner />
    </Suspense>
  );
}
