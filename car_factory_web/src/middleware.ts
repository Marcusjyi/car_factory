import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/sell",
  "/cart",
  "/checkout",
  "/orders",
  "/chat",
  "/favorites",
  "/mypage",
  "/support/inquiries",
  "/profile/complete",
];

const AUTH_PAGES = ["/login", "/social-callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get("cf_auth")?.value === "1";

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession && pathname === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sell/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/chat/:path*",
    "/favorites/:path*",
    "/mypage/:path*",
    "/support/inquiries/:path*",
    "/profile/complete",
    "/login",
    "/social-callback",
  ],
};
