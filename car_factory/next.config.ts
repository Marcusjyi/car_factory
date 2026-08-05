import type { NextConfig } from "next";

/** Auth helper 프록시 대상(프로젝트 기본 도메인). authDomain 과 혼동하지 말 것. */
const FIREBASE_AUTH_HELPER_HOST =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
    : "car-factory-40a14.firebaseapp.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  /**
   * iOS Safari 등 서드파티 스토리지 차단 대응:
   * signInWithRedirect 가 앱 도메인 ↔ *.firebaseapp.com 간 상태를 못 넘기는 문제를
   * 같은 출처(/__/auth)로 프록시해 해결한다.
   * @see https://firebase.google.com/docs/auth/web/redirect-best-practices
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/__/auth/:path*",
          destination: `https://${FIREBASE_AUTH_HELPER_HOST}/__/auth/:path*`,
        },
        {
          source: "/__/firebase/:path*",
          destination: `https://${FIREBASE_AUTH_HELPER_HOST}/__/firebase/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
