import type { Metadata } from "next";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CARFACTORY 카팩토리 | 중고 자동차 부품 C2C 마켓",
    template: "%s | CARFACTORY",
  },
  description:
    "필요한 부품, 카팩토리에서 찾으세요. 중고부품도 새부품도 간편하게 검색하고 거래하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-bg text-text">
        <AuthProvider>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
