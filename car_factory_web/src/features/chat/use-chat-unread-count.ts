"use client";

import { useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { AuthContext } from "@/features/auth/AuthProvider";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * 헤더 알림 배지용 — users/{uid}/counters/chatUnread 문서 1개만 구독.
 * 합계는 Cloud Functions(onMessageCreated / markChatRoomRead)가 유지한다.
 */
export function useChatUnreadCount() {
  const auth = useContext(AuthContext);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (
      !isFirebaseConfigured() ||
      auth?.status !== "authenticated" ||
      !auth.firebaseUser
    ) {
      setCount(0);
      return;
    }

    const uid = auth.firebaseUser.uid;
    const ref = doc(getClientDb(), "users", uid, "counters", "chatUnread");
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCount(0);
          return;
        }
        const total = Number(snap.data()?.total) || 0;
        setCount(Math.max(0, total));
      },
      () => setCount(0),
    );
  }, [auth?.firebaseUser, auth?.status]);

  return count;
}
