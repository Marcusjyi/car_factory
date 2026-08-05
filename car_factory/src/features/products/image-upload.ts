import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getClientStorage, isFirebaseConfigured } from "@/lib/firebase/client";
import type { ProductImage } from "@/types/product";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 10;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const CACHE_CONTROL = "public,max-age=31536000,immutable";
const ENCODE_QUALITY = 0.82;

const VARIANT_EDGES = {
  thumb: 400,
  list: 800,
  detail: 1600,
} as const;

type VariantKind = keyof typeof VARIANT_EDGES;

type EncodedVariant = {
  kind: VariantKind;
  blob: Blob;
  contentType: string;
  ext: "webp" | "jpg";
  width: number;
  height: number;
};

export function validateProductImageFile(file: File) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("JPG, PNG, WEBP만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지당 최대 10MB까지 업로드할 수 있습니다.");
  }
}

/** 목록·카드용 URL (list → download 폴백) */
export function getListImageUrl(
  img: Pick<ProductImage, "listURL" | "downloadURL" | "thumbURL"> | null | undefined,
): string {
  if (!img) return "";
  return img.listURL || img.downloadURL || img.thumbURL || "";
}

/** 상세 갤러리용 URL */
export function getDetailImageUrl(
  img: Pick<ProductImage, "downloadURL" | "listURL"> | null | undefined,
): string {
  if (!img) return "";
  return img.downloadURL || img.listURL || "";
}

/** 장바구니 모달 등 소형 */
export function getThumbImageUrl(
  img: Pick<ProductImage, "thumbURL" | "listURL" | "downloadURL"> | null | undefined,
): string {
  if (!img) return "";
  return img.thumbURL || img.listURL || img.downloadURL || "";
}

/** 상품 문서 thumbnailURL 필드용 */
export function productThumbnailFromImages(
  images: ProductImage[] | null | undefined,
): string {
  const first = images?.[0];
  return first ? getListImageUrl(first) : "";
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeAtEdge(
  source: ImageBitmap,
  maxEdge: number,
): Promise<{
  blob: Blob;
  contentType: string;
  ext: "webp" | "jpg";
  width: number;
  height: number;
}> {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
  ctx.drawImage(source, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, "image/webp", ENCODE_QUALITY);
  let contentType = "image/webp";
  let ext: "webp" | "jpg" = "webp";
  if (!blob) {
    blob = await canvasToBlob(canvas, "image/jpeg", ENCODE_QUALITY);
    contentType = "image/jpeg";
    ext = "jpg";
  }
  if (!blob) throw new Error("이미지 변환에 실패했습니다.");

  return { blob, contentType, ext, width, height };
}

/** bitmap 1회 디코드 후 thumb / list / detail 생성 */
export async function encodeProductImageVariants(
  file: File,
): Promise<EncodedVariant[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const kinds = Object.keys(VARIANT_EDGES) as VariantKind[];
    const out: EncodedVariant[] = [];
    for (const kind of kinds) {
      const encoded = await encodeAtEdge(bitmap, VARIANT_EDGES[kind]);
      out.push({ kind, ...encoded });
    }
    return out;
  } finally {
    bitmap.close();
  }
}

/** @deprecated 단일 리사이즈 — 신규 업로드는 encodeProductImageVariants 사용 */
export async function resizeImageFile(
  file: File,
  maxEdge = 1600,
): Promise<Blob> {
  const variants = await encodeProductImageVariants(file);
  const detail = variants.find((v) => v.kind === "detail") ?? variants[0];
  if (!detail) throw new Error("이미지 변환에 실패했습니다.");
  void maxEdge;
  return detail.blob;
}

export async function uploadProductImage(input: {
  sellerUid: string;
  productId: string;
  file: File;
  sortOrder: number;
}): Promise<ProductImage> {
  validateProductImageFile(input.file);

  if (!isFirebaseConfigured()) {
    const url = URL.createObjectURL(input.file);
    return {
      path: `mock/${input.productId}/${input.sortOrder}_detail`,
      downloadURL: url,
      thumbURL: url,
      listURL: url,
      thumbPath: `mock/${input.productId}/${input.sortOrder}_thumb`,
      listPath: `mock/${input.productId}/${input.sortOrder}_list`,
      width: 0,
      height: 0,
      sortOrder: input.sortOrder,
    };
  }

  const variants = await encodeProductImageVariants(input.file);
  const imageId = `${Date.now()}_${input.sortOrder}`;
  const storage = getClientStorage();

  const uploaded: Partial<Record<VariantKind, { path: string; url: string; width: number; height: number }>> =
    {};

  for (const variant of variants) {
    const path = `product-images/${input.sellerUid}/${input.productId}/${imageId}_${variant.kind}.${variant.ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, variant.blob, {
      contentType: variant.contentType,
      cacheControl: CACHE_CONTROL,
    });
    const url = await getDownloadURL(storageRef);
    uploaded[variant.kind] = {
      path,
      url,
      width: variant.width,
      height: variant.height,
    };
  }

  const detail = uploaded.detail;
  const thumb = uploaded.thumb;
  const list = uploaded.list;
  if (!detail) throw new Error("상세 이미지 업로드에 실패했습니다.");

  return {
    path: detail.path,
    downloadURL: detail.url,
    thumbURL: thumb?.url,
    thumbPath: thumb?.path,
    listURL: list?.url,
    listPath: list?.path,
    width: detail.width,
    height: detail.height,
    sortOrder: input.sortOrder,
  };
}

async function deleteStoragePath(path: string) {
  if (!path || path.startsWith("mock/") || !isFirebaseConfigured()) return;
  try {
    await deleteObject(ref(getClientStorage(), path));
  } catch {
    // 이미 없거나 권한 없음 — 무시
  }
}

/** ProductImage 전체 variant 또는 path 문자열 삭제 */
export async function deleteProductImage(
  target: ProductImage | string | null | undefined,
) {
  if (!target) return;
  if (typeof target === "string") {
    await deleteStoragePath(target);
    return;
  }
  const paths = [target.thumbPath, target.listPath, target.path].filter(
    (p): p is string => Boolean(p),
  );
  // 구 데이터: path만 있고 thumb/list path 없음
  const unique = [...new Set(paths)];
  await Promise.all(unique.map((p) => deleteStoragePath(p)));
}

export { MAX_PHOTOS };
