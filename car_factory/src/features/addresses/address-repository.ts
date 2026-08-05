import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type {
  ShippingAddressDocument,
  UpsertShippingAddressInput,
} from "@/types/address";

function addressesCol(uid: string) {
  return collection(getClientDb(), "users", uid, "addresses");
}

function addressRef(uid: string, addressId: string) {
  return doc(getClientDb(), "users", uid, "addresses", addressId);
}

function docToAddress(id: string, data: DocumentData): ShippingAddressDocument {
  return {
    id,
    label: data.label ?? "기본",
    recipient: data.recipient ?? "",
    phone: data.phone ?? "",
    address1: data.address1 ?? "",
    address2: data.address2 ?? "",
    isDefault: Boolean(data.isDefault),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : (data.createdAt?.toDate?.()?.toISOString?.() ?? ""),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : (data.updatedAt?.toDate?.()?.toISOString?.() ?? ""),
  };
}

export async function listShippingAddresses(
  uid: string,
): Promise<ShippingAddressDocument[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(addressesCol(uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToAddress(d.id, d.data()));
  } catch {
    const snap = await getDocs(addressesCol(uid));
    return snap.docs.map((d) => docToAddress(d.id, d.data()));
  }
}

export async function getDefaultShippingAddress(uid: string) {
  const list = await listShippingAddresses(uid);
  return list.find((a) => a.isDefault) ?? list[0] ?? null;
}

async function clearOtherDefaults(uid: string, keepId: string) {
  const list = await listShippingAddresses(uid);
  const others = list.filter((a) => a.id !== keepId && a.isDefault);
  if (others.length === 0) return;
  const batch = writeBatch(getClientDb());
  for (const addr of others) {
    batch.update(addressRef(uid, addr.id), {
      isDefault: false,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function createShippingAddress(
  uid: string,
  input: UpsertShippingAddressInput,
) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const ref = doc(addressesCol(uid));
  const makeDefault = input.isDefault !== false;
  await setDoc(ref, {
    id: ref.id,
    label: input.label?.trim() || "기본",
    recipient: input.recipient.trim(),
    phone: input.phone.replace(/-/g, "").trim(),
    address1: input.address1.trim(),
    address2: (input.address2 ?? "").trim(),
    isDefault: makeDefault,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (makeDefault) {
    await clearOtherDefaults(uid, ref.id);
  }
  return ref.id;
}

export async function updateShippingAddress(
  uid: string,
  addressId: string,
  input: UpsertShippingAddressInput,
) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }
  const makeDefault = Boolean(input.isDefault);
  await updateDoc(addressRef(uid, addressId), {
    label: input.label?.trim() || "기본",
    recipient: input.recipient.trim(),
    phone: input.phone.replace(/-/g, "").trim(),
    address1: input.address1.trim(),
    address2: (input.address2 ?? "").trim(),
    isDefault: makeDefault,
    updatedAt: serverTimestamp(),
  });
  if (makeDefault) {
    await clearOtherDefaults(uid, addressId);
  }
}
