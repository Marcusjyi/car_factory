"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { AuthContext } from "@/features/auth/AuthProvider";
import {
  isProductFavorited,
  toggleFavorite,
} from "@/features/favorites/favorites-repository";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  iconClassName?: string;
  initialFavorited?: boolean;
  onChange?: (favorited: boolean) => void;
};

export function FavoriteButton({
  productId,
  className,
  activeClassName = "bg-white/90 text-red-500 hover:text-red-600",
  inactiveClassName = "bg-white/90 text-text-secondary hover:text-primary",
  iconClassName = "size-4",
  initialFavorited = false,
  onChange,
}: FavoriteButtonProps) {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const status = auth?.status ?? "unauthenticated";
  const firebaseUser = auth?.firebaseUser ?? null;
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  useEffect(() => {
    if (status !== "authenticated" || !firebaseUser) {
      setFavorited(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const next = await isProductFavorited(firebaseUser.uid, productId);
      if (!cancelled) setFavorited(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, productId, status]);

  const onToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "loading" || loading) return;
      if (status !== "authenticated" || !firebaseUser) {
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }
      setLoading(true);
      const prev = favorited;
      setFavorited(!prev);
      try {
        const next = await toggleFavorite(firebaseUser.uid, productId);
        setFavorited(next);
        onChange?.(next);
      } catch {
        setFavorited(prev);
      } finally {
        setLoading(false);
      }
    },
    [favorited, firebaseUser, loading, onChange, productId, router, status],
  );

  return (
    <button
      type="button"
      onClick={(e) => void onToggle(e)}
      disabled={loading}
      className={cn(
        className,
        favorited ? activeClassName : inactiveClassName,
      )}
      aria-label={favorited ? "찜 해제" : "찜하기"}
      title={favorited ? "찜 해제" : "찜하기"}
    >
      {loading ? (
        <Loader2 className={cn("animate-spin", iconClassName)} />
      ) : (
        <Heart className={cn(iconClassName, favorited && "fill-current")} />
      )}
    </button>
  );
}
