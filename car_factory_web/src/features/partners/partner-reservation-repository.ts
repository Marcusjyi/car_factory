"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import type { PartnerReservationCreateInput } from "@/types/partner-reservation";

const ALLOWED_TIMES = new Set([
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
]);

export async function createPartnerReservation(
  input: PartnerReservationCreateInput,
): Promise<string> {
  const name = input.customerName.trim();
  const phone = input.customerPhone.trim();
  const preferredDate = input.preferredDate.trim();
  const preferredTime = input.preferredTime.trim();

  if (!name) throw new Error("이름을 입력해 주세요.");
  if (phone.length < 9) throw new Error("연락처를 확인해 주세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    throw new Error("희망 날짜를 확인해 주세요.");
  }
  if (!ALLOWED_TIMES.has(preferredTime)) {
    throw new Error("희망 시간을 선택해 주세요.");
  }
  if (!input.partnerId.trim() || !input.partnerName.trim()) {
    throw new Error("장착점 정보가 없습니다.");
  }

  const uid = getClientAuth().currentUser?.uid;
  const payload: Record<string, unknown> = {
    customerName: name.slice(0, 80),
    customerPhone: phone.slice(0, 20),
    partnerId: input.partnerId.trim(),
    partnerName: input.partnerName.trim().slice(0, 120),
    partnerRegion: (input.partnerRegion ?? "").trim().slice(0, 80),
    partnerAddress: (input.partnerAddress ?? "").trim().slice(0, 300),
    partnerPhone: (input.partnerPhone ?? "").trim().slice(0, 40),
    preferredDate,
    preferredTime,
    partOrOrder: (input.partOrOrder ?? "").trim().slice(0, 200),
    memo: (input.memo ?? "").trim().slice(0, 2000),
    status: "pending",
    source: input.source,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (uid) payload.uid = uid;

  const ref = await addDoc(
    collection(getClientDb(), "partnerReservations"),
    payload,
  );
  return ref.id;
}
