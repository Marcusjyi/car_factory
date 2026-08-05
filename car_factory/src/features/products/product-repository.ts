import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { PRODUCTS } from "@/lib/mock-data";
import {
  deleteProductImage,
  productThumbnailFromImages,
} from "@/features/products/image-upload";
import {
  productError,
  productLog,
  productWarn,
} from "@/features/products/product-mappers";
import type {
  CreateProductDraftInput,
  ProductDocument,
  ProductImage,
  ProductPublicDto,
  ProductSearchFilter,
} from "@/types/product";

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildKeywords(input: CreateProductDraftInput) {
  const tokens = [
    input.manufacturer,
    input.vehicleModelName,
    input.partName,
    input.partNumber,
    input.modelYearFrom ? String(input.modelYearFrom) : "",
  ]
    .flatMap((t) => normalize(t).split(" "))
    .filter(Boolean);
  return Array.from(new Set(tokens));
}

function mockToDto(p: (typeof PRODUCTS)[number]): ProductPublicDto {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    thumbnailURL: p.image,
    images: (p.images ?? [p.image]).map((url, i) => ({
      path: "",
      downloadURL: url,
      width: 800,
      height: 600,
      sortOrder: i,
    })),
    location: p.location,
    condition: p.condition.includes("신품") ? "new" : "used",
    conditionGrade: p.condition.includes("A")
      ? "A"
      : p.condition.includes("B")
        ? "B"
        : p.condition.includes("C")
          ? "C"
          : "A",
    conditionDescription: p.condition,
    manufacturer: p.brand.toUpperCase(),
    vehicleMakeId: p.brand,
    vehicleModelId: p.brand,
    vehicleModelName: p.title,
    modelYearFrom: Number(p.yearRange.split("-")[0]) || null,
    modelYearTo: Number(p.yearRange.split("-")[1]) || null,
    partNumber: p.partNumber,
    partName: p.title,
    categoryId: p.categoryId,
    description: p.description,
    shippingFeeType: "separate",
    shippingFee: 3000,
    viewCount: p.views,
    sellerUid: "mock-seller",
    sellerDisplayName: p.seller.name,
    status: "selling",
    listingNumber: p.listingNumber,
    createdAt: p.registeredAt,
  };
}

function docToDto(id: string, data: DocumentData): ProductPublicDto {
  return {
    id,
    title: data.title,
    price: data.price,
    thumbnailURL:
      data.thumbnailURL ||
      productThumbnailFromImages(data.images as ProductImage[] | undefined) ||
      "",
    images: data.images ?? [],
    location: data.region ?? null,
    condition: data.condition,
    conditionGrade: data.conditionGrade ?? null,
    conditionDescription: data.conditionDescription ?? "",
    manufacturer: data.manufacturer,
    vehicleMakeId: data.vehicleMakeId ?? "",
    vehicleModelId: data.vehicleModelId ?? "",
    vehicleModelName: data.vehicleModelName,
    modelYearFrom: data.modelYearFrom ?? null,
    modelYearTo: data.modelYearTo ?? null,
    partNumber: data.partNumber ?? "",
    partName: data.partName ?? data.title ?? "",
    categoryId: data.categoryId,
    description: data.description ?? "",
    shippingFeeType: data.shippingFeeType ?? "separate",
    shippingFee: data.shippingFee ?? 0,
    viewCount: data.viewCount ?? 0,
    sellerUid: data.sellerUid,
    sellerDisplayName: data.sellerDisplayName ?? "",
    status: data.status,
    reservedBuyerUid:
      typeof data.reservedBuyerUid === "string" ? data.reservedBuyerUid : null,
    activeOrderId:
      typeof data.activeOrderId === "string" ? data.activeOrderId : null,
    soldAt:
      typeof data.soldAt === "string"
        ? data.soldAt
        : data.soldAt?.toDate?.()?.toISOString?.() ?? null,
    listingNumber:
      typeof data.listingNumber === "string" ? data.listingNumber : undefined,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : (data.createdAt?.toDate?.()?.toISOString?.() ?? ""),
  };
}

export interface ProductRepository {
  getPublicProduct(productId: string): Promise<ProductPublicDto | null>;
  getOwnedProduct(
    productId: string,
    sellerUid: string,
  ): Promise<ProductPublicDto | null>;
  listProducts(filter: ProductSearchFilter): Promise<ProductPublicDto[]>;
  listOwnedProducts(sellerUid: string): Promise<ProductPublicDto[]>;
  createDraft(
    sellerUid: string,
    input: CreateProductDraftInput,
  ): Promise<string>;
  updateOwnedProduct(
    productId: string,
    sellerUid: string,
    patch: Partial<ProductDocument>,
  ): Promise<void>;
  publishDraft(productId: string, sellerUid: string): Promise<void>;
  markOwnedProductSold(productId: string, sellerUid: string): Promise<void>;
  deleteOwnedProduct(productId: string, sellerUid: string): Promise<void>;
  /** 소유 상품에 닉네임 스냅샷 동기화 (공개 상세 표시용) */
  syncSellerDisplayName(
    sellerUid: string,
    displayName: string,
  ): Promise<void>;
  /** 공개 상세 조회수 +1 (세션 중복·본인 조회는 호출측에서 제어) */
  incrementViewCount(productId: string): Promise<void>;
}

class FirestoreProductRepository implements ProductRepository {
  async getPublicProduct(productId: string) {
    productLog("getPublicProduct", "fetch", { productId });
    const snap = await getDoc(doc(getClientDb(), "products", productId));
    if (!snap.exists()) {
      productWarn("getPublicProduct", "not found", { productId });
      return null;
    }
    const data = snap.data();
    if (
      data.status !== "selling" &&
      data.status !== "reserved" &&
      data.status !== "sold"
    ) {
      productWarn("getPublicProduct", "hidden by status", {
        productId,
        status: data.status,
      });
      return null;
    }
    return docToDto(snap.id, data);
  }

  async getOwnedProduct(productId: string, sellerUid: string) {
    productLog("getOwnedProduct", "fetch", { productId, sellerUid });
    const snap = await getDoc(doc(getClientDb(), "products", productId));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.sellerUid !== sellerUid) {
      throw new Error("본인 상품만 조회할 수 있습니다.");
    }
    return docToDto(snap.id, data);
  }

  async listProducts(filter: ProductSearchFilter) {
    const status = filter.status ?? "selling";
    const statuses = filter.statuses?.filter(Boolean) ?? [];
    productLog("listProducts", "query start", {
      status,
      statuses,
      categoryId: filter.categoryId ?? null,
      manufacturer: filter.manufacturer ?? null,
      vehicleMakeId: filter.vehicleMakeId ?? null,
      sellerUid: filter.sellerUid ?? null,
      includeAllStatuses: filter.includeAllStatuses ?? false,
      sort: filter.sort ?? "latest",
      limit: filter.limit ?? 24,
      q: filter.q ?? null,
    });

    try {
      const constraints = [];
      if (!filter.includeAllStatuses) {
        if (statuses.length > 1) {
          constraints.push(where("status", "in", statuses.slice(0, 10)));
        } else if (statuses.length === 1) {
          constraints.push(where("status", "==", statuses[0]));
        } else {
          constraints.push(where("status", "==", status));
        }
      }
      if (filter.sellerUid) {
        constraints.push(where("sellerUid", "==", filter.sellerUid));
      }
      if (filter.categoryId) {
        constraints.push(where("categoryId", "==", filter.categoryId));
      }
      if (filter.manufacturer) {
        constraints.push(where("manufacturer", "==", filter.manufacturer));
      }
      if (filter.vehicleMakeId) {
        constraints.push(where("vehicleMakeId", "==", filter.vehicleMakeId));
      }

      const sort = filter.sort ?? "latest";
      const sortField =
        sort === "priceAsc" || sort === "priceDesc" ? "price" : "createdAt";
      const sortDir = sort === "priceAsc" ? "asc" : "desc";

      let snap;
      try {
        const q = query(
          collection(getClientDb(), "products"),
          ...constraints,
          orderBy(sortField, sortDir),
          limit(filter.limit ?? 24),
        );
        snap = await getDocs(q);
      } catch (indexError) {
        productWarn("listProducts", "orderBy query failed, fallback without orderBy", {
          message:
            indexError instanceof Error ? indexError.message : String(indexError),
        });
        const q = query(
          collection(getClientDb(), "products"),
          ...constraints,
          limit(filter.limit ?? 48),
        );
        snap = await getDocs(q);
      }

      productLog("listProducts", "firestore snapshot", {
        empty: snap.empty,
        size: snap.size,
        ids: snap.docs.map((d) => d.id),
        statuses: snap.docs.map((d) => d.data().status),
      });

      let items = snap.docs.map((d) => docToDto(d.id, d.data()));

      items.sort((a, b) => {
        if (sort === "priceAsc") return a.price - b.price;
        if (sort === "priceDesc") return b.price - a.price;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
      if (filter.limit && items.length > filter.limit) {
        items = items.slice(0, filter.limit);
      }

      if (filter.q) {
        const qn = normalize(filter.q);
        const before = items.length;
        items = items.filter(
          (p) =>
            normalize(p.title).includes(qn) ||
            normalize(p.partNumber ?? "").includes(qn) ||
            normalize(p.vehicleModelName).includes(qn) ||
            normalize(p.partName ?? "").includes(qn),
        );
        productLog("listProducts", "client text filter", {
          q: filter.q,
          before,
          after: items.length,
        });
      }
      if (filter.minPrice != null) {
        items = items.filter((p) => p.price >= filter.minPrice!);
      }
      if (filter.maxPrice != null) {
        items = items.filter((p) => p.price <= filter.maxPrice!);
      }
      if (filter.region) {
        items = items.filter((p) => p.location === filter.region);
      }

      productLog("listProducts", "result", {
        count: items.length,
        ids: items.map((p) => p.id),
      });
      return items;
    } catch (error) {
      productError("listProducts", error, { filter });
      throw error;
    }
  }

  async listOwnedProducts(sellerUid: string) {
    productLog("listOwnedProducts", "query start", { sellerUid });
    const items = await this.listProducts({
      sellerUid,
      includeAllStatuses: true,
      sort: "latest",
      limit: 100,
    });
    // soft-deleted(hidden) · 관리자 제재(blocked)는 목록에서 제외
    const visible = items.filter(
      (p) => p.status !== "hidden" && p.status !== "blocked",
    );
    productLog("listOwnedProducts", "result", {
      sellerUid,
      count: visible.length,
      ids: visible.map((p) => p.id),
    });
    return visible;
  }

  async createDraft(sellerUid: string, input: CreateProductDraftInput) {
    const ref = doc(collection(getClientDb(), "products"));
    const title = `${input.manufacturer} ${input.vehicleModelName} ${input.partName}`.trim();
    const keywords = buildKeywords(input);

    const payload: Record<string, unknown> = {
      id: ref.id,
      sellerUid,
      sellerDisplayName: (input.sellerDisplayName ?? "").trim(),
      title,
      description: input.description ?? "",
      categoryId: input.categoryId ?? "misc",
      partName: input.partName.trim(),
      manufacturer: input.manufacturer,
      vehicleMakeId: input.vehicleMakeId,
      vehicleModelId: input.vehicleModelId,
      vehicleModelName: input.vehicleModelName,
      modelYearFrom: input.modelYearFrom,
      modelYearTo: input.modelYearFrom,
      partNumber: input.partNumber.trim(),
      oemNumber: input.partNumber.trim() || null,
      condition: input.condition,
      conditionGrade: input.conditionGrade,
      conditionDescription:
        input.conditionDescription ??
        (input.condition === "new"
          ? "미사용 신품"
          : input.conditionGrade
            ? `${input.conditionGrade}급`
            : ""),
      price: input.price ?? 0,
      negotiable: false,
      quantity: 1,
      deliveryMethods: ["parcel"],
      shippingFeeType: input.shippingFeeType ?? "separate",
      shippingFee: input.shippingFee ?? 0,
      region: input.region ?? null,
      // 바이너리는 Storage, 여기에는 URL만
      images: [] as Array<{
        path: string;
        downloadURL: string;
        width: number;
        height: number;
        sortOrder: number;
      }>,
      thumbnailURL: "",
      status: "draft",
      viewCount: 0,
      favoriteCount: 0,
      chatCount: 0,
      searchKeywords: keywords,
      normalizedTitle: normalize(title),
      soldAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    productLog("createDraft", "created", {
      productId: ref.id,
      sellerUid,
      status: "draft",
      partName: input.partName,
      partNumber: input.partNumber,
    });
    return ref.id;
  }

  async updateOwnedProduct(
    productId: string,
    sellerUid: string,
    patch: Partial<ProductDocument>,
  ) {
    const ref = doc(getClientDb(), "products", productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("상품을 찾을 수 없습니다.");
    if (snap.data().sellerUid !== sellerUid) {
      throw new Error("본인 상품만 수정할 수 있습니다.");
    }
    const status = String(snap.data().status ?? "");
    if (status === "reserved") {
      throw new Error("예약 중인 상품은 수정할 수 없습니다. 예약을 취소한 뒤 수정해 주세요.");
    }
    if (status === "sold") {
      throw new Error("판매완료된 상품은 수정할 수 없습니다.");
    }
    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  async publishDraft(productId: string, sellerUid: string) {
    const ref = doc(getClientDb(), "products", productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("상품을 찾을 수 없습니다.");
    const data = snap.data();
    productLog("publishDraft", "before", {
      productId,
      sellerUid,
      docSellerUid: data.sellerUid,
      status: data.status,
      imageCount: data.images?.length ?? 0,
      price: data.price,
      thumbnailURL: productThumbnailFromImages(
        data.images as ProductImage[] | undefined,
      ),
    });
    if (data.sellerUid !== sellerUid) {
      throw new Error("본인 상품만 등록할 수 있습니다.");
    }
    if (!data.images?.length) {
      throw new Error("사진을 1장 이상 등록해주세요.");
    }
    if (!data.price || data.price <= 0) {
      throw new Error("가격을 입력해주세요.");
    }

    let sellerDisplayName = "";
    try {
      const userSnap = await getDoc(doc(getClientDb(), "users", sellerUid));
      const userData = userSnap.data();
      sellerDisplayName =
        (userData?.displayName as string | undefined)?.trim() ?? "";
      if (sellerDisplayName) {
        const { syncPublicSellerProfile } = await import(
          "@/features/auth/public-seller"
        );
        await syncPublicSellerProfile(sellerUid, {
          displayName: sellerDisplayName,
          photoURL: (userData?.photoURL as string | null) ?? null,
          ratingAverage: userData?.tradeStats?.ratingAverage,
          ratingCount: userData?.tradeStats?.ratingCount,
          saleCount: userData?.tradeStats?.saleCount,
        });
      }
    } catch {
      sellerDisplayName =
        typeof data.sellerDisplayName === "string"
          ? data.sellerDisplayName.trim()
          : "";
    }

    const thumbnailURL = productThumbnailFromImages(
      data.images as ProductImage[],
    );
    await updateDoc(ref, {
      status: "selling",
      thumbnailURL,
      ...(sellerDisplayName ? { sellerDisplayName } : {}),
      updatedAt: serverTimestamp(),
    });
    productLog("publishDraft", "published as selling", {
      productId,
      sellerUid,
      thumbnailURL,
    });
  }

  async markOwnedProductSold(productId: string, sellerUid: string) {
    const ref = doc(getClientDb(), "products", productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("상품을 찾을 수 없습니다.");
    const data = snap.data();
    if (data.sellerUid !== sellerUid) {
      throw new Error("본인 상품만 판매완료 처리할 수 있습니다.");
    }
    if (data.status === "sold") {
      return;
    }
    if (data.status === "reserved") {
      throw new Error(
        "예약 중인 상품은 거래 상세에서 판매완료 해주세요. (주문과 함께 처리됩니다)",
      );
    }
    if (data.status !== "selling") {
      throw new Error("판매중 상품만 판매완료로 변경할 수 있습니다.");
    }

    const images = (data.images ?? []) as ProductImage[];
    const keep = images[0]
      ? [{ ...images[0], sortOrder: 0 }]
      : [];
    const toRemove = images.slice(1);

    // Storage에서 나머지 사진 삭제 (실패해도 판매완료는 진행)
    await Promise.all(
      toRemove.map(async (img) => {
        try {
          await deleteProductImage(img);
        } catch (error) {
          productWarn("markOwnedProductSold", "extra image delete failed", {
            path: img.path,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );

    // 메타데이터는 유지, 사진은 썸네일 1장만 남김
    await updateDoc(ref, {
      status: "sold",
      soldAt: serverTimestamp(),
      images: keep,
      thumbnailURL:
        productThumbnailFromImages(keep) || data.thumbnailURL || "",
      updatedAt: serverTimestamp(),
    });
    productLog("markOwnedProductSold", "marked sold (keep 1 image)", {
      productId,
      sellerUid,
      previousStatus: data.status,
      kept: keep.length,
      removed: toRemove.length,
    });
  }

  async deleteOwnedProduct(productId: string, sellerUid: string) {
    const ref = doc(getClientDb(), "products", productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("상품을 찾을 수 없습니다.");
    if (snap.data().sellerUid !== sellerUid) {
      throw new Error("본인 상품만 삭제할 수 있습니다.");
    }
    if (snap.data().status === "reserved") {
      throw new Error(
        "예약 중인 상품은 예약을 취소한 뒤 삭제할 수 있습니다.",
      );
    }
    // 규칙 배포 전에도 동작하도록 soft-delete 우선
    try {
      await updateDoc(ref, {
        status: "hidden",
        updatedAt: serverTimestamp(),
      });
      productLog("deleteOwnedProduct", "soft-deleted (hidden)", {
        productId,
        sellerUid,
      });
    } catch (error) {
      productWarn("deleteOwnedProduct", "soft-delete failed, trying hard delete", {
        message: error instanceof Error ? error.message : String(error),
      });
      await deleteDoc(ref);
      productLog("deleteOwnedProduct", "hard-deleted", { productId, sellerUid });
    }
  }

  async syncSellerDisplayName(sellerUid: string, displayName: string) {
    const name = displayName.trim().slice(0, 80);
    if (!name || !sellerUid) return;
    // 공개 목록에 나오는 상태만 갱신 (권한·쿼리 단순화)
    const statuses = ["selling", "reserved", "sold"] as const;
    const batches = await Promise.all(
      statuses.map((status) =>
        this.listProducts({ sellerUid, status, limit: 100 }),
      ),
    );
    const owned = batches.flat();
    const stale = owned.filter(
      (p) => (p.sellerDisplayName ?? "").trim() !== name,
    );
    if (stale.length === 0) return;
    await Promise.allSettled(
      stale.map((p) =>
        updateDoc(doc(getClientDb(), "products", p.id), {
          sellerDisplayName: name,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
    productLog("syncSellerDisplayName", "updated", {
      sellerUid,
      count: stale.length,
      displayName: name,
    });
  }

  async incrementViewCount(productId: string) {
    if (!productId.trim()) return;
    try {
      await updateDoc(doc(getClientDb(), "products", productId), {
        viewCount: increment(1),
      });
      productLog("incrementViewCount", "ok", { productId });
    } catch (error) {
      productWarn("incrementViewCount", "failed", { productId, error });
    }
  }
}

class MockProductRepository implements ProductRepository {
  private drafts = new Map<string, ProductPublicDto>();

  async getPublicProduct(productId: string) {
    const draft = this.drafts.get(productId);
    if (draft) return draft;
    const found = PRODUCTS.find((p) => p.id === productId);
    return found ? mockToDto(found) : mockToDto(PRODUCTS[0]);
  }

  async getOwnedProduct(productId: string, sellerUid: string) {
    const draft = this.drafts.get(productId);
    if (draft) {
      if (draft.sellerUid !== sellerUid) {
        throw new Error("본인 상품만 조회할 수 있습니다.");
      }
      return draft;
    }
    const found = PRODUCTS.find((p) => p.id === productId);
    if (!found) return null;
    return { ...mockToDto(found), sellerUid };
  }

  async listProducts(filter: ProductSearchFilter) {
    let items = [
      ...Array.from(this.drafts.values()),
      ...PRODUCTS.map(mockToDto),
    ];
    if (filter.sellerUid) {
      items = items.filter((p) => p.sellerUid === filter.sellerUid);
    }
    if (!filter.includeAllStatuses) {
      const statuses = filter.statuses?.filter(Boolean) ?? [];
      if (statuses.length > 0) {
        items = items.filter((p) => statuses.includes(p.status));
      } else {
        const status = filter.status ?? "selling";
        items = items.filter((p) => p.status === status);
      }
    }
    if (filter.categoryId) {
      items = items.filter((p) => p.categoryId === filter.categoryId);
    }
    if (filter.q) {
      const qn = normalize(filter.q);
      items = items.filter((p) => normalize(p.title).includes(qn));
    }
    return items.slice(0, filter.limit ?? 24);
  }

  async listOwnedProducts(sellerUid: string) {
    const items = await this.listProducts({
      sellerUid,
      includeAllStatuses: true,
      limit: 100,
    });
    return items.filter((p) => p.status !== "hidden" && p.status !== "blocked");
  }

  async createDraft(_sellerUid: string, input: CreateProductDraftInput) {
    const id = `draft_${Date.now()}`;
    const title = `${input.manufacturer} ${input.vehicleModelName} ${input.partName}`;
    this.drafts.set(id, {
      id,
      title,
      price: input.price ?? 0,
      thumbnailURL: "",
      images: [],
      location: input.region ?? null,
      condition: input.condition,
      conditionGrade: input.conditionGrade,
      conditionDescription:
        input.conditionDescription ??
        (input.condition === "new"
          ? "미사용 신품"
          : input.conditionGrade
            ? `${input.conditionGrade}급`
            : ""),
      manufacturer: input.manufacturer,
      vehicleMakeId: input.vehicleMakeId,
      vehicleModelId: input.vehicleModelId,
      vehicleModelName: input.vehicleModelName,
      modelYearFrom: input.modelYearFrom,
      modelYearTo: input.modelYearFrom,
      partNumber: input.partNumber,
      partName: input.partName,
      categoryId: input.categoryId ?? "misc",
      description: input.description ?? "",
      shippingFeeType: input.shippingFeeType ?? "separate",
      shippingFee: input.shippingFee ?? 0,
      viewCount: 0,
      sellerUid: _sellerUid,
      sellerDisplayName: (input.sellerDisplayName ?? "").trim(),
      status: "draft",
      listingNumber: `CF-${new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
        .replace(/-/g, "")
        .slice(2)}-${String(this.drafts.size + 1).padStart(5, "0")}`,
      createdAt: new Date().toISOString(),
    });
    productLog("createDraft:mock", "created", { productId: id });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cf_draft_product_id", id);
      sessionStorage.setItem(`cf_draft_${id}`, JSON.stringify(input));
    }
    return id;
  }

  async updateOwnedProduct(
    productId: string,
    _sellerUid: string,
    patch: Partial<ProductDocument>,
  ) {
    const current = this.drafts.get(productId);
    if (!current) return;
    if (current.status === "reserved") {
      throw new Error("예약 중인 상품은 수정할 수 없습니다. 예약을 취소한 뒤 수정해 주세요.");
    }
    if (current.status === "sold") {
      throw new Error("판매완료된 상품은 수정할 수 없습니다.");
    }
    this.drafts.set(productId, {
      ...current,
      ...patch,
      images: patch.images ?? current.images,
      thumbnailURL: patch.thumbnailURL ?? current.thumbnailURL,
      status: patch.status ?? current.status,
    } as ProductPublicDto);
  }

  async publishDraft(productId: string, _sellerUid: string) {
    const current = this.drafts.get(productId);
    if (current) {
      this.drafts.set(productId, { ...current, status: "selling" });
    }
  }

  async markOwnedProductSold(productId: string, sellerUid: string) {
    const current = this.drafts.get(productId);
    if (current) {
      if (current.sellerUid !== sellerUid) {
        throw new Error("본인 상품만 판매완료 처리할 수 있습니다.");
      }
      if (current.status === "reserved") {
        throw new Error(
          "예약 중인 상품은 거래 상세에서 판매완료 해주세요. (주문과 함께 처리됩니다)",
        );
      }
      if (current.status !== "selling") {
        throw new Error("판매중 상품만 판매완료로 변경할 수 있습니다.");
      }
      const keep = current.images[0]
        ? [{ ...current.images[0], sortOrder: 0 }]
        : [];
      this.drafts.set(productId, {
        ...current,
        status: "sold",
        images: keep,
        thumbnailURL:
          productThumbnailFromImages(keep) || current.thumbnailURL,
      });
      return;
    }
  }

  async deleteOwnedProduct(productId: string, sellerUid: string) {
    const current = this.drafts.get(productId);
    if (current) {
      if (current.sellerUid !== sellerUid) {
        throw new Error("본인 상품만 삭제할 수 있습니다.");
      }
      if (current.status === "reserved") {
        throw new Error(
          "예약 중인 상품은 예약을 취소한 뒤 삭제할 수 있습니다.",
        );
      }
      this.drafts.set(productId, { ...current, status: "hidden" });
      return;
    }
  }

  async syncSellerDisplayName(sellerUid: string, displayName: string) {
    const name = displayName.trim();
    if (!name) return;
    for (const [id, draft] of this.drafts) {
      if (draft.sellerUid === sellerUid && draft.sellerDisplayName !== name) {
        this.drafts.set(id, { ...draft, sellerDisplayName: name });
      }
    }
  }

  async incrementViewCount(productId: string) {
    const draft = this.drafts.get(productId);
    if (draft) {
      this.drafts.set(productId, {
        ...draft,
        viewCount: (draft.viewCount ?? 0) + 1,
      });
      return;
    }
    const found = PRODUCTS.find((p) => p.id === productId);
    if (found) found.views += 1;
  }
}

let repo: ProductRepository | null = null;

export function getProductRepository(): ProductRepository {
  if (!repo) {
    const configured = isFirebaseConfigured();
    repo = configured
      ? new FirestoreProductRepository()
      : new MockProductRepository();
    productLog("getProductRepository", configured ? "firestore" : "mock", {
      configured,
      hasNextPublicKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
      databaseId: process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ?? "default",
    });
    if (!configured) {
      productWarn(
        "getProductRepository",
        "Firebase 미설정 → mock PRODUCTS만 표시됩니다. 방금 등록한 실데이터가 안 보입니다.",
      );
    }
  }
  return repo;
}
