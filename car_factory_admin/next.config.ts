import type { NextConfig } from "next";

const FIREBASE_AUTH_HELPER_HOST = "car-factory-40a14.firebaseapp.com";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
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
