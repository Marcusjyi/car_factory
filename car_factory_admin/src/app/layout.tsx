import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "CARFACTORY 관리자",
  description: "CARFACTORY 플랫폼 관리자 대시보드",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-full bg-white text-[#222] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
