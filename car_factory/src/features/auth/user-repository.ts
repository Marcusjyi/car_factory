import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { getClientDb } from "@/lib/firebase/client";
import type {
  AuthProviderId,
  UserAddress,
  UserDocument,
  UserShippingAddress,
  UserTransferAccount,
} from "@/types/user";

function usersRef(uid: string) {
  return doc(getClientDb(), "users", uid);
}

export async function resolveAuthProvider(
  firebaseUser: FirebaseUser,
  fallback: AuthProviderId = "google",
): Promise<AuthProviderId> {
  const uid = firebaseUser.uid;
  if (uid.startsWith("kakao_")) return "kakao";
  if (uid.startsWith("naver_")) return "naver";

  const providerId = firebaseUser.providerData[0]?.providerId;
  if (providerId === "google.com") return "google";
  if (providerId === "apple.com") return "apple";
  return fallback;
}

/** Auth 세션이 있으면 users/{uid} 문서를 반드시 보장 */
export async function ensureUserDocument(
  firebaseUser: FirebaseUser,
  provider?: AuthProviderId,
) {
  const resolved = provider ?? (await resolveAuthProvider(firebaseUser));
  return upsertUserFromAuth(firebaseUser, resolved);
}

export function isProfileComplete(user: UserDocument | null) {
  if (!user) return false;
  if (user.profileCompleted) return true;
  return Boolean(
    user.name &&
      user.displayName &&
      user.phoneNumber &&
      user.defaultRegion &&
      user.address?.address1,
  );
}

export async function upsertUserFromAuth(
  firebaseUser: FirebaseUser,
  provider: AuthProviderId,
) {
  const ref = usersRef(firebaseUser.uid);
  const existing = await getDoc(ref);
  const now = new Date().toISOString();

  if (!existing.exists()) {
    const docData: UserDocument = {
      uid: firebaseUser.uid,
      name: "",
      displayName: firebaseUser.displayName ?? "",
      photoURL: firebaseUser.photoURL,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      providers: [provider],
      providerAccounts: [
        {
          provider,
          providerUserId:
            firebaseUser.providerData[0]?.uid ?? firebaseUser.uid,
        },
      ],
      defaultRegion: null,
      address: null,
      shippingAddress: null,
      defaultTransferAccount: null,
      role: "user",
      status: "active",
      tradeStats: {
        purchaseCount: 0,
        saleCount: 0,
        ratingAverage: 0,
        ratingCount: 0,
      },
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      profileCompleted: Boolean(
        firebaseUser.displayName && firebaseUser.phoneNumber,
      ),
    };
    await setDoc(ref, {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      termsAcceptedAt: serverTimestamp(),
      privacyAcceptedAt: serverTimestamp(),
    });
    return docData;
  }

  const data = existing.data() as UserDocument;
  const providers = Array.from(new Set([...(data.providers ?? []), provider]));
  await updateDoc(ref, {
    providers,
    email: firebaseUser.email ?? data.email,
    photoURL: firebaseUser.photoURL ?? data.photoURL,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    ...data,
    name: data.name ?? "",
    providers,
    address: data.address ?? null,
    shippingAddress: data.shippingAddress ?? null,
    defaultTransferAccount: data.defaultTransferAccount ?? null,
  };
}

export async function completeUserProfile(
  uid: string,
  input: {
    name: string;
    displayName: string;
    phoneNumber: string;
    defaultRegion: string;
    address: UserAddress;
  },
) {
  const address: UserAddress = {
    address1: input.address.address1.trim(),
    address2: (input.address.address2 ?? "").trim(),
  };
  await updateDoc(usersRef(uid), {
    name: input.name.trim(),
    displayName: input.displayName.trim(),
    phoneNumber: input.phoneNumber,
    defaultRegion: input.defaultRegion,
    address,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  });
  const { syncPublicSellerProfile } = await import(
    "@/features/auth/public-seller"
  );
  await syncPublicSellerProfile(uid, {
    displayName: input.displayName,
  });
}

export async function updateUserProfileBasics(
  uid: string,
  input: {
    name: string;
    displayName: string;
    phoneNumber: string;
    defaultRegion: string;
  },
) {
  await updateDoc(usersRef(uid), {
    name: input.name.trim(),
    displayName: input.displayName.trim(),
    phoneNumber: input.phoneNumber.replace(/-/g, "").trim(),
    defaultRegion: input.defaultRegion,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  });
  const { syncPublicSellerProfile } = await import(
    "@/features/auth/public-seller"
  );
  await syncPublicSellerProfile(uid, {
    displayName: input.displayName,
  });
}

export async function updateUserAddress(uid: string, address: UserAddress) {
  await updateDoc(usersRef(uid), {
    address: {
      address1: address.address1.trim(),
      address2: (address.address2 ?? "").trim(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserShippingAddress(
  uid: string,
  shippingAddress: UserShippingAddress,
) {
  await updateDoc(usersRef(uid), {
    shippingAddress: {
      label: shippingAddress.label.trim() || "기본",
      recipient: shippingAddress.recipient.trim(),
      phone: shippingAddress.phone.replace(/-/g, "").trim(),
      address1: shippingAddress.address1.trim(),
      address2: (shippingAddress.address2 ?? "").trim(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserDefaultTransferAccount(
  uid: string,
  account: UserTransferAccount | null,
) {
  if (!account) {
    await updateDoc(usersRef(uid), {
      defaultTransferAccount: null,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const bankName = account.bankName.trim();
  const accountNumber = account.accountNumber.replace(/\s+/g, "").trim();
  const accountHolder = account.accountHolder.trim();
  if (!bankName || !accountNumber || !accountHolder) {
    throw new Error("은행명, 계좌번호, 예금주를 모두 입력해주세요.");
  }
  await updateDoc(usersRef(uid), {
    defaultTransferAccount: {
      bankName,
      accountNumber,
      accountHolder,
    },
    updatedAt: serverTimestamp(),
  });
}
