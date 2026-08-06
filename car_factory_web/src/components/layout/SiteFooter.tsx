import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { COMPANY_INFO } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/support#terms", label: "이용약관" },
  { href: "/support#privacy", label: "개인정보처리방침" },
  { href: "/support", label: "고객센터" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#1a1d24] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandLogo variant="light" />
            <p className="mt-3 max-w-md text-xs leading-relaxed text-white/55">
              중고·신품 자동차 부품을 안전하고 간편하게 거래하는 C2C 마켓플레이스입니다.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.label === "개인정보처리방침"
                    ? "font-semibold text-white hover:text-primary-soft"
                    : "hover:text-white"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs leading-6 text-white/55">
          <p>
            <span className="text-white/75">상호</span> {COMPANY_INFO.name}
            <span className="mx-2 text-white/25">|</span>
            <span className="text-white/75">대표</span> {COMPANY_INFO.ceo}
            <span className="mx-2 text-white/25">|</span>
            <span className="text-white/75">사업자등록번호</span>{" "}
            {COMPANY_INFO.businessNumber}
          </p>
          <p>
            <span className="text-white/75">사업장 소재지</span>{" "}
            {COMPANY_INFO.address}
          </p>
          <p>
            <span className="text-white/75">업태</span> {COMPANY_INFO.businessType}
            <span className="mx-2 text-white/25">|</span>
            <span className="text-white/75">종목</span> {COMPANY_INFO.businessItem}
            <span className="mx-2 text-white/25">|</span>
            <span className="text-white/75">이메일</span>{" "}
            <a
              href={`mailto:${COMPANY_INFO.email}`}
              className="hover:text-white"
            >
              {COMPANY_INFO.email}
            </a>
          </p>
          <p>
            <span className="text-white/75">개인정보보호책임자</span>{" "}
            {COMPANY_INFO.privacyOfficer}
          </p>
        </div>

        <p className="mt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
