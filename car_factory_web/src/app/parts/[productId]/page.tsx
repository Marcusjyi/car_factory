import { notFound } from "next/navigation";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { ProductDetailActions } from "@/components/product/ProductDetailActions";
import { ProductDetailMetaRow } from "@/components/product/ProductDetailMetaRow";
import { ProductSellerName } from "@/components/product/ProductSellerCard";
import { ProductViewCount } from "@/components/product/ProductViewCount";
import {
  productError,
  productLog,
  toCardProduct,
} from "@/features/products/product-mappers";
import { getProductRepository } from "@/features/products/product-repository";
import {
  getGroupBySubCategory,
  getSubCategory,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "./ProductGallery";

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;
  let product;
  let productStatus: string | null = null;
  let sellerUid = "";
  let sellerDisplayName = "";
  let shippingFee = 0;
  let reservedBuyerUid: string | null = null;
  let activeOrderId: string | null = null;
  try {
    const dto = await getProductRepository().getPublicProduct(productId);
    productLog("ProductDetailPage", "loaded", {
      productId,
      found: Boolean(dto),
      status: dto?.status ?? null,
    });
    if (!dto) notFound();
    product = toCardProduct(dto);
    productStatus = dto.status;
    sellerUid = dto.sellerUid;
    sellerDisplayName = dto.sellerDisplayName?.trim() || "";
    shippingFee = Number(dto.shippingFee) || 0;
    reservedBuyerUid = dto.reservedBuyerUid ?? null;
    activeOrderId = dto.activeOrderId ?? null;
  } catch (error) {
    productError("ProductDetailPage", error, { productId });
    notFound();
  }

  const sellerName =
    sellerDisplayName || product.seller.name?.trim() || "판매자";
  const shippingLabel =
    shippingFee <= 0
      ? "배송비 무료"
      : `배송비 ${formatPrice(shippingFee)}`;

  const isSold = productStatus === "sold";
  const isReserved = productStatus === "reserved";
  const group = getGroupBySubCategory(product.categoryId);
  const sub = getSubCategory(product.categoryId);
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav />

      <Breadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "부품 검색", href: "/parts" },
          ...(group
            ? [
                {
                  label: group.label,
                  href: `/parts?category=${group.id}`,
                },
              ]
            : []),
          ...(sub && group
            ? [
                {
                  label: sub.label,
                  href: `/parts?category=${group.id}&sub=${sub.id}`,
                },
              ]
            : sub
              ? [{ label: sub.label }]
              : []),
          { label: product.title },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-10">
        <div className="grid gap-8 rounded-2xl border border-border bg-white p-6 lg:grid-cols-2">
          <ProductGallery
            images={images}
            title={product.title}
            productId={product.id}
          />

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {isSold ? (
                <span className="rounded-md bg-[#016ff9] px-2.5 py-1 text-xs font-semibold text-white">
                  판매완료
                </span>
              ) : null}
              {isReserved ? (
                <span className="rounded-md bg-[#016ff9] px-2.5 py-1 text-xs font-semibold text-white">
                  예약중
                </span>
              ) : !isSold ? (
                <span className="rounded-md bg-[#016ff9] px-2.5 py-1 text-xs font-semibold text-white">
                  판매중
                </span>
              ) : null}
              <ProductViewCount
                productId={product.id}
                sellerUid={sellerUid}
                initialCount={product.views}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold leading-snug text-text md:text-2xl">
                {product.title}
              </h1>
            </div>

            <p className="text-2xl font-extrabold text-text">
              {formatPrice(product.price)}
            </p>

            <ProductDetailMetaRow
              productId={product.id}
              sellerUid={sellerUid}
              shippingLabel={shippingLabel}
              initialStatus={
                (productStatus as
                  | "draft"
                  | "selling"
                  | "reserved"
                  | "sold"
                  | "hidden"
                  | "blocked") || "selling"
              }
              initialActiveOrderId={activeOrderId}
              initialReservedBuyerUid={reservedBuyerUid}
            />

            <table className="w-full border-collapse text-sm">
              <tbody>
                <SpecRow label="상품 상태" value={product.condition} emphasis />
                <SpecRow
                  label="상품 고유번호"
                  value={product.listingNumber || "발급 중…"}
                />
                <SpecRow label="적용 연식" value={product.yearRange} />
                <SpecRow
                  label="부품번호"
                  value={product.partNumber || "-"}
                />
                <SpecRow label="등록일" value={product.registeredAt} />
                <SpecRow label="판매 지역" value={product.location} />
                <tr className="border-b border-border last:border-0">
                  <th className="w-[100px] py-2.5 text-left font-medium text-text-secondary">
                    판매자
                  </th>
                  <td className="py-2.5 text-text">
                    <ProductSellerName
                      productId={product.id}
                      sellerUid={sellerUid}
                      initialName={sellerName}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <ProductDetailActions
              productId={product.id}
              sellerUid={sellerUid}
              sellerDisplayName={sellerName}
              productTitle={product.title}
              thumbnailURL={
                product.thumbImage || product.image || images[0] || ""
              }
              conditionDescription={product.condition}
              yearRange={product.yearRange}
              price={product.price}
              shippingFee={shippingFee}
              productStatus={
                (productStatus as
                  | "draft"
                  | "selling"
                  | "reserved"
                  | "sold"
                  | "hidden"
                  | "blocked") || "selling"
              }
              reservedBuyerUid={reservedBuyerUid}
              activeOrderId={activeOrderId}
            />

          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-text">상품 설명</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {product.description}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-text">
              배송 및 환불 안내
            </h2>
            <div className="space-y-4 text-sm text-text-secondary">
              <div>
                <h3 className="mb-1 font-semibold text-text">배송 안내</h3>
                <p>
                  결제 확인 후 1~2영업일 내 발송됩니다. 택배 및 화물택배 배송이
                  가능하며, 부피/무게에 따라 배송비가 달라질 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-text">환불/교환 안내</h3>
                <p>
                  단순 변심에 의한 환불은 상품 수령 후 7일 이내 가능합니다.
                  부품 특성상 설치/사용 흔적이 있는 경우 환불이 제한될 수
                  있습니다. 하자/오배송 시 전액 환불 또는 교환 처리됩니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <FeatureBar />
    </div>
  );
}

function SpecRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <th className="w-[100px] py-2.5 text-left font-medium text-text-secondary">
        {label}
      </th>
      <td
        className={
          emphasis
            ? "py-2.5 text-base font-bold text-text"
            : "py-2.5 text-text"
        }
      >
        {value}
      </td>
    </tr>
  );
}
