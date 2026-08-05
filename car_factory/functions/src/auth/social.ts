import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-northeast3";
const kakaoClientSecret = defineSecret("KAKAO_CLIENT_SECRET");
const naverClientSecret = defineSecret("NAVER_CLIENT_SECRET");

type Provider = "kakao" | "naver";

function cors(res: { set: (k: string, v: string) => void }) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

async function upsertSocialUser(input: {
  provider: Provider;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  const auth = getAuth();
  // 서울 named DB `default` ((default)/nam5 아님)
  const db = getFirestore(getApp(), "default");
  const uid = `${input.provider}_${input.providerUserId}`;

  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({
      uid,
      email: input.email ?? undefined,
      displayName: input.displayName ?? undefined,
      photoURL: input.photoURL ?? undefined,
    });
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      uid,
      name: "",
      displayName: input.displayName ?? "",
      photoURL: input.photoURL,
      email: input.email,
      phoneNumber: null,
      providers: [input.provider],
      providerAccounts: [
        { provider: input.provider, providerUserId: input.providerUserId },
      ],
      defaultRegion: null,
      address: null,
      shippingAddress: null,
      role: "user",
      status: "active",
      tradeStats: {
        purchaseCount: 0,
        saleCount: 0,
        ratingAverage: 0,
        ratingCount: 0,
      },
      profileCompleted: false,
      termsAcceptedAt: FieldValue.serverTimestamp(),
      privacyAcceptedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  } else {
    await userRef.update({
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      email: input.email ?? snap.data()?.email ?? null,
      photoURL: input.photoURL ?? snap.data()?.photoURL ?? null,
    });
  }

  const token = await auth.createCustomToken(uid, {
    provider: input.provider,
  });
  return token;
}

export const kakaoAuthCallback = onRequest(
  { region: REGION, secrets: [kakaoClientSecret] },
  async (req, res) => {
    cors(res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const code = String(req.query.code ?? req.body?.code ?? "");
      const redirectUri = String(
        req.query.redirect_uri ??
          req.body?.redirect_uri ??
          process.env.KAKAO_REDIRECT_URI ??
          "",
      );
      if (!code || !redirectUri) {
        res.status(400).json({ error: "code와 redirect_uri가 필요합니다." });
        return;
      }

      const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_REST_API_KEY ?? "",
          client_secret: kakaoClientSecret.value(),
          redirect_uri: redirectUri,
          code,
        }),
      });
      const tokenJson = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
      };
      if (!tokenJson.access_token) {
        res.status(401).json({ error: "카카오 토큰 교환 실패", detail: tokenJson });
        return;
      }

      const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const me = (await meRes.json()) as {
        id: number;
        kakao_account?: {
          email?: string;
          profile?: { nickname?: string; profile_image_url?: string };
        };
      };

      const customToken = await upsertSocialUser({
        provider: "kakao",
        providerUserId: String(me.id),
        email: me.kakao_account?.email ?? null,
        displayName: me.kakao_account?.profile?.nickname ?? null,
        photoURL: me.kakao_account?.profile?.profile_image_url ?? null,
      });

      res.json({ customToken, provider: "kakao" });
    } catch (error) {
      console.error("kakaoAuthCallback", error);
      res.status(500).json({ error: "카카오 로그인 처리 중 오류" });
    }
  },
);

export const naverAuthCallback = onRequest(
  { region: REGION, secrets: [naverClientSecret] },
  async (req, res) => {
    cors(res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const code = String(req.query.code ?? req.body?.code ?? "");
      const state = String(req.query.state ?? req.body?.state ?? "");
      const redirectUri = String(
        req.query.redirect_uri ??
          req.body?.redirect_uri ??
          process.env.NAVER_REDIRECT_URI ??
          "",
      );
      if (!code || !redirectUri) {
        res.status(400).json({ error: "code와 redirect_uri가 필요합니다." });
        return;
      }

      const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      tokenUrl.searchParams.set(
        "client_id",
        process.env.NAVER_CLIENT_ID ?? "",
      );
      tokenUrl.searchParams.set("client_secret", naverClientSecret.value());
      tokenUrl.searchParams.set("code", code);
      tokenUrl.searchParams.set("state", state);

      const naverTokenRes = await fetch(tokenUrl.toString());
      const tokenJson = (await naverTokenRes.json()) as {
        access_token?: string;
        error?: string;
      };
      if (!tokenJson.access_token) {
        res.status(401).json({ error: "네이버 토큰 교환 실패", detail: tokenJson });
        return;
      }

      const meRes = await fetch("https://openapi.naver.com/v1/nid/me", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const me = (await meRes.json()) as {
        response?: {
          id: string;
          email?: string;
          nickname?: string;
          name?: string;
          profile_image?: string;
        };
      };
      const profile = me.response;
      if (!profile?.id) {
        res.status(401).json({ error: "네이버 프로필 조회 실패" });
        return;
      }

      const customToken = await upsertSocialUser({
        provider: "naver",
        providerUserId: profile.id,
        email: profile.email ?? null,
        displayName: profile.nickname ?? profile.name ?? null,
        photoURL: profile.profile_image ?? null,
      });

      res.json({ customToken, provider: "naver" });
    } catch (error) {
      console.error("naverAuthCallback", error);
      res.status(500).json({ error: "네이버 로그인 처리 중 오류" });
    }
  },
);
