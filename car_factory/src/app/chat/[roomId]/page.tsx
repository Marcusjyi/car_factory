"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChatProductStatusSelect } from "@/components/chat/ChatProductStatusSelect";
import { useAuth } from "@/features/auth/AuthProvider";
import { markChatRoomRead } from "@/features/chat/chat-api";
import {
  formatChatListTime,
  formatChatTime,
  getChatRoom,
  isChatOpen,
  peerDisplayName,
  sendTextMessage,
  subscribeChatMessages,
  subscribeChatRooms,
} from "@/features/chat/chat-repository";
import type { ChatMessageDocument, ChatRoomDocument } from "@/types/chat";
import { formatPrice, cn } from "@/lib/utils";

export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = typeof params?.roomId === "string" ? params.roomId : "";
  const router = useRouter();
  const { status, firebaseUser } = useAuth();

  const [rooms, setRooms] = useState<ChatRoomDocument[]>([]);
  const [room, setRoom] = useState<ChatRoomDocument | null>(null);
  const [messages, setMessages] = useState<ChatMessageDocument[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !firebaseUser) {
      router.replace(`/login?next=/chat/${roomId}`);
      return;
    }

    const unsubRooms = subscribeChatRooms(
      firebaseUser.uid,
      setRooms,
      (err) => setError(err.message),
    );

    return () => unsubRooms();
  }, [firebaseUser, roomId, router, status]);

  useEffect(() => {
    if (!roomId || status !== "authenticated" || !firebaseUser) return;

    let cancelled = false;
    setLoading(true);

    void getChatRoom(roomId).then((doc) => {
      if (cancelled) return;
      if (!doc) {
        setError("채팅방을 찾을 수 없습니다.");
        setRoom(null);
        setLoading(false);
        return;
      }
      if (!doc.participantUids.includes(firebaseUser.uid)) {
        setError("참여할 수 없는 채팅방입니다.");
        setRoom(null);
        setLoading(false);
        return;
      }
      setRoom(doc);
      setLoading(false);
      void markChatRoomRead(roomId).catch(() => undefined);
    });

    const unsubMsgs = subscribeChatMessages(
      roomId,
      (list) => {
        setMessages(list);
        void markChatRoomRead(roomId).catch(() => undefined);
      },
      (err) => setError(err.message),
    );

    return () => {
      cancelled = true;
      unsubMsgs();
    };
  }, [firebaseUser, roomId, status]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === roomId) ?? room;
  }, [room, roomId, rooms]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!firebaseUser || !roomId || !text.trim() || sending) return;
    setSending(true);
    setError(null);
    const payload = text;
    setText("");
    try {
      await sendTextMessage(roomId, firebaseUser.uid, payload);
    } catch (err) {
      setText(payload);
      setError(err instanceof Error ? err.message : "전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  const uid = firebaseUser?.uid ?? "";
  const chatOpen = isChatOpen(activeRoom);

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="mb-3 flex items-center gap-2 md:hidden">
          <Link
            href="/chat"
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
          >
            <ChevronLeft className="size-4" />
            채팅 목록
          </Link>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex h-[calc(100vh-220px)] min-h-[560px] overflow-hidden rounded-[12px] border border-border bg-white">
          <aside className="hidden w-[320px] shrink-0 flex-col border-r border-border md:flex">
            <div className="border-b border-border px-4 py-3">
              <Link href="/chat" className="text-base font-bold text-text hover:text-primary">
                채팅
              </Link>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {rooms.map((item) => {
                const active = item.id === roomId;
                const unread = item.unreadCountByUid[uid] ?? 0;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/chat/${item.id}`}
                      className={cn(
                        "flex gap-3 border-b border-border px-4 py-3 transition",
                        active ? "bg-primary-light" : "hover:bg-bg",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productThumbnailURL || "/images/hero-chat.png"}
                        alt=""
                        className="size-11 shrink-0 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-text">
                            {peerDisplayName(item, uid)}
                          </span>
                          <span className="shrink-0 text-[11px] text-text-muted">
                            {formatChatListTime(item.lastMessageAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-text-muted">
                            {item.lastMessage || item.productTitle}
                          </p>
                          {unread > 0 ? (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                              {unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            {loading || status === "loading" ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중…
              </div>
            ) : !activeRoom ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
                채팅방을 찾을 수 없습니다.
              </div>
            ) : (
              <>
                <header className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        activeRoom.productThumbnailURL || "/images/hero-chat.png"
                      }
                      alt={activeRoom.productTitle}
                      className="size-14 shrink-0 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text">
                        {peerDisplayName(activeRoom, uid)}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">
                        {activeRoom.productTitle}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-primary">
                        {formatPrice(activeRoom.productPrice)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/parts/${activeRoom.productId}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d2d2d7] bg-white px-3 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]"
                      >
                        상품보기
                      </Link>
                      <ChatProductStatusSelect
                        room={activeRoom}
                        uid={uid}
                        onError={(msg) => setError(msg || null)}
                      />
                    </div>
                  </div>
                </header>

                <div
                  ref={messagesRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4"
                >
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-text-muted">
                      첫 메시지를 보내 보세요.
                    </p>
                  ) : null}
                  {messages.map((msg) => {
                    if (msg.type === "system") {
                      return (
                        <div key={msg.id} className="flex justify-center py-1">
                          <p className="max-w-[90%] rounded-full bg-white/80 px-3 py-1.5 text-center text-[11px] text-text-muted">
                            {msg.text}
                          </p>
                        </div>
                      );
                    }
                    const mine = msg.senderUid === uid;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          mine ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            mine
                              ? "rounded-br-md bg-primary text-white"
                              : "rounded-bl-md border border-border bg-white text-text",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              mine ? "text-white/70" : "text-text-muted",
                            )}
                          >
                            {formatChatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  className="flex flex-col gap-2 border-t border-border px-4 py-3"
                  onSubmit={(e) => void onSend(e)}
                >
                  {!chatOpen ? (
                    <p className="text-center text-xs text-text-muted">
                      {activeRoom?.status === "blocked"
                        ? "다른 구매자와 예약되어 메시지를 보낼 수 없습니다."
                        : activeRoom?.status === "closed"
                          ? "종료된 채팅방입니다."
                          : "판매완료 후 문의 기간이 종료되어 메시지를 보낼 수 없습니다."}
                    </p>
                  ) : activeRoom.chatOpenUntil ? (
                    <p className="text-center text-xs text-text-muted">
                      판매완료 후 문의 가능 ·{" "}
                      {new Date(activeRoom.chatOpenUntil).toLocaleDateString(
                        "ko-KR",
                      )}
                      까지
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={
                        chatOpen
                          ? "메시지를 입력하세요"
                          : "문의 기간이 종료되었습니다"
                      }
                      disabled={!chatOpen}
                      className="h-11 flex-1 rounded-full border border-border bg-bg px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatOpen || !text.trim() || sending}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-40"
                      aria-label="전송"
                    >
                      {sending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
