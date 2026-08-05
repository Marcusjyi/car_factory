"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  formatChatListTime,
  peerDisplayName,
  subscribeChatRooms,
} from "@/features/chat/chat-repository";
import type { ChatRoomDocument, ChatRoomStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

type TabFilter = "all" | ChatRoomStatus;

const TABS: Array<{ id: TabFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "active", label: "진행중" },
  { id: "closed", label: "완료" },
];

export default function ChatListPage() {
  const router = useRouter();
  const { status, firebaseUser } = useAuth();
  const [tab, setTab] = useState<TabFilter>("all");
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<ChatRoomDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !firebaseUser) {
      router.replace("/login?next=/chat");
      return;
    }

    setLoading(true);
    const unsub = subscribeChatRooms(
      firebaseUser.uid,
      (list) => {
        setRooms(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || "채팅 목록을 불러오지 못했습니다.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [firebaseUser, router, status]);

  const filtered = useMemo(() => {
    const uid = firebaseUser?.uid ?? "";
    return rooms.filter((room) => {
      const matchesTab =
        tab === "all" ||
        room.status === tab ||
        (tab === "active" && room.status === "blocked");
      const peer = peerDisplayName(room, uid);
      const matchesQuery =
        query.trim() === "" ||
        peer.includes(query) ||
        room.productTitle.includes(query);
      return matchesTab && matchesQuery;
    });
  }, [firebaseUser?.uid, query, rooms, tab]);

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <h1 className="mb-4 text-xl font-extrabold text-text">채팅</h1>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-[12px] border border-border bg-white">
          <div className="flex w-full flex-col border-r border-border md:w-[360px] md:shrink-0">
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="상대방, 상품명 검색"
                  className="h-10 w-full rounded-lg border border-border bg-bg pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="mt-3 flex gap-2">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      tab === item.id
                        ? "bg-primary text-white"
                        : "bg-bg text-text-secondary hover:text-primary",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loading || status === "loading" ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중…
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {filtered.map((room) => {
                  const uid = firebaseUser?.uid ?? "";
                  const unread = room.unreadCountByUid[uid] ?? 0;
                  return (
                    <li key={room.id}>
                      <Link
                        href={`/chat/${room.id}`}
                        className="flex gap-3 border-b border-border px-4 py-3 transition hover:bg-bg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            room.productThumbnailURL ||
                            "/images/hero-chat.png"
                          }
                          alt=""
                          className="size-12 shrink-0 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold text-text">
                              {peerDisplayName(room, uid)}
                            </span>
                            <span className="shrink-0 text-[11px] text-text-muted">
                              {formatChatListTime(room.lastMessageAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-text-secondary">
                            {room.productTitle}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-text-muted">
                              {room.status === "blocked"
                                ? "다른 구매자 예약중 · 채팅 중지"
                                : room.lastMessage || "대화를 시작해 보세요"}
                            </p>
                            {unread > 0 ? (
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {filtered.length === 0 ? (
                  <li className="px-4 py-16 text-center text-sm text-text-secondary">
                    채팅 내역이 없습니다.
                    <div className="mt-3">
                      <Link
                        href="/parts"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        부품 둘러보기
                      </Link>
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
            <MessageSquare className="size-12 text-text-muted" />
            <p className="text-sm font-medium text-text">대화를 선택해 주세요</p>
            <p className="text-xs text-text-secondary">
              왼쪽 목록에서 채팅방을 선택하거나
              <br />
              상품 상세에서 채팅을 시작해 주세요.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
