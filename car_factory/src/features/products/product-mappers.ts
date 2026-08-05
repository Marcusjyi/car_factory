import type { Product } from "@/lib/mock-data";
import type { ProductPublicDto } from "@/types/product";
import {
  getDetailImageUrl,
  getListImageUrl,
  getThumbImageUrl,
} from "@/features/products/image-upload";

const LOG_PREFIX = "[products]";

export function productLog(
  scope: string,
  message: string,
  data?: Record<string, unknown>,
) {
  if (data) {
    console.log(`${LOG_PREFIX} ${scope}: ${message}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${scope}: ${message}`);
  }
}

export function productWarn(
  scope: string,
  message: string,
  data?: Record<string, unknown>,
) {
  if (data) {
    console.warn(`${LOG_PREFIX} ${scope}: ${message}`, data);
  } else {
    console.warn(`${LOG_PREFIX} ${scope}: ${message}`);
  }
}

export function productError(scope: string, error: unknown, data?: Record<string, unknown>) {
  console.error(`${LOG_PREFIX} ${scope}:`, error, data ?? "");
}

function formatTimeAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function gradeLabel(dto: ProductPublicDto): string {
  if (dto.conditionDescription) return dto.conditionDescription;
  const grade = dto.conditionGrade ? ` (${dto.conditionGrade}급)` : "";
  if (dto.condition === "new") return `미사용 신품${grade}`;
  if (dto.condition === "refurbished") return `재생${grade}`;
  return `중고${grade}`;
}

/** 목록/카드 UI용 mock Product 형태로 변환 */
export function toCardProduct(
  dto: ProductPublicDto & { vehicleMakeId?: string },
): Product {
  const yearFrom = dto.modelYearFrom;
  const yearTo = dto.modelYearTo;
  const yearRange =
    yearFrom && yearTo && yearFrom !== yearTo
      ? `${yearFrom}-${yearTo}`
      : yearFrom
        ? String(yearFrom)
        : "";

  const first = dto.images[0];
  return {
    id: dto.id,
    title: dto.title,
    price: dto.price,
    image:
      dto.thumbnailURL ||
      (first ? getListImageUrl(first) : "") ||
      "",
    thumbImage: first ? getThumbImageUrl(first) : dto.thumbnailURL || "",
    images: dto.images
      .map((img) => getDetailImageUrl(img))
      .filter(Boolean),
    location: dto.location || "전국",
    timeAgo: formatTimeAgo(dto.createdAt),
    condition: gradeLabel(dto),
    yearRange,
    partNumber: dto.partNumber || "",
    listingNumber: dto.listingNumber,
    views: dto.viewCount,
    registeredAt: dto.createdAt
      ? new Date(dto.createdAt).toLocaleDateString("ko-KR")
      : "",
    listingStatus: dto.status,
    seller: {
      name: dto.sellerDisplayName?.trim() || "판매자",
      rating: 0,
      reviewCount: 0,
    },
    description: dto.description,
    categoryId: dto.categoryId,
    brand: dto.vehicleMakeId || "",
  };
}
