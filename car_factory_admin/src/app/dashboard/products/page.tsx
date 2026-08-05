"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/lib/firestore/client";
import type { Product } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/utils/format";

function statusBadge(status: string) {
  switch (status) {
    case "selling":
      return <Badge variant="success">{"\uD310\uB9E4\uC911"}</Badge>;
    case "reserved":
      return <Badge variant="warning">{"\uC608\uC57D\uC911"}</Badge>;
    case "sold":
      return <Badge>{"\uD310\uB9E4\uC644\uB8CC"}</Badge>;
    case "hidden":
      return <Badge>{"\uC228\uAE40"}</Badge>;
    case "draft":
      return <Badge>{"\uC784\uC2DC\uC800\uC7A5"}</Badge>;
    case "blocked":
      return <Badge variant="danger">{"\uCC28\uB2E8"}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function productName(p: Product) {
  return p.partName?.trim() || p.title?.trim() || "-";
}

function ProductThumb({ url, alt }: { url?: string; alt: string }) {
  if (!url) {
    return (
      <div className="h-12 w-12 shrink-0 rounded-lg bg-[#F0F0F0]" aria-hidden />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="h-12 w-12 shrink-0 rounded-lg object-cover bg-[#F0F0F0]"
    />
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listProducts();
        if (!cancelled) setProducts(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "\uC0C1\uD488 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [
        p.partName,
        p.title,
        p.sellerName,
        p.sellerUid,
        p.status,
        p.id,
        p.listingNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  return (
    <div>
      <PageHeader
        title={"\uC0C1\uD488"}
        description={
          loading
            ? "\uB4F1\uB85D \uC0C1\uD488 \uBAA9\uB85D"
            : `\uCD1D ${filtered.length}\uAC74`
        }
        action={
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder={"\uD488\uBA85, \uACE0\uC720\uBC88\uD638, \uD310\uB9E4\uC790"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        }
      />
      <Card className="overflow-x-auto p-0">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            {"\uBD88\uB7EC\uC624\uB294 \uC911..."}
          </p>
        ) : null}
        {error ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : null}
        {!loading && !error && filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            {"\uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
          </p>
        ) : null}
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E0E0E0] bg-[#F9F9F9] text-left">
                <th className="px-4 py-3 font-medium">{"\uC0AC\uC9C4"}</th>
                <th className="px-4 py-3 font-medium">{"\uACE0\uC720\uBC88\uD638"}</th>
                <th className="px-4 py-3 font-medium">{"\uD488\uBA85"}</th>
                <th className="px-4 py-3 font-medium">{"\uAC00\uACA9"}</th>
                <th className="px-4 py-3 font-medium">{"\uC0C1\uD0DC"}</th>
                <th className="px-4 py-3 font-medium">{"\uD310\uB9E4\uC790"}</th>
                <th className="px-4 py-3 font-medium">{"\uB4F1\uB85D\uC77C"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const name = productName(p);
                return (
                  <tr key={p.id} className="border-b border-[#F0F0F0]">
                    <td className="px-4 py-3">
                      <ProductThumb url={p.thumbnailURL} alt={name} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {p.listingNumber || "-"}
                    </td>
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3">
                      {formatPrice(p.price)}
                      {"\uC6D0"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/users/${p.sellerUid}`}
                        className="text-[#464646] underline"
                      >
                        {p.sellerName ?? p.sellerUid}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(p.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </Card>
    </div>
  );
}
