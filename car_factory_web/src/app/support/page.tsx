import Link from "next/link";
import {
  Megaphone,
  CircleHelp,
  MessageSquare,
  Truck,
  RefreshCw,
  FileText,
  Clock,
  Phone,
  MessageCircle,
  Package,
  CreditCard,
  Search,
  ChevronRight,
} from "lucide-react";
import { SiteHeader, Breadcrumbs } from "@/components/layout/SiteHeader";
import { FeatureBar } from "@/components/layout/FeatureBar";
import { SUPPORT_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SUPPORT_ICONS = {
  megaphone: Megaphone,
  help: CircleHelp,
  message: MessageSquare,
  truck: Truck,
  refresh: RefreshCw,
  file: FileText,
};

const QUICK_LINKS = [
  {
    href: "/support#shipping",
    label: "배송/결제 안내",
    desc: "배송 방법 및 결제 수단",
    icon: Truck,
  },
  {
    href: "/support#refund",
    label: "환불/교환 안내",
    desc: "반품 및 교환 절차",
    icon: RefreshCw,
  },
  {
    href: "/support#faq",
    label: "부품 호환 문의",
    desc: "차종별 부품 호환 확인",
    icon: Search,
  },
  {
    href: "/support/inquiries/new",
    label: "1:1 문의",
    desc: "전문 상담원에게 문의",
    icon: MessageSquare,
  },
];

const FAQ_ITEMS = [
  {
    q: "주문한 부품은 언제 배송되나요?",
    a: "판매자가 발송 처리하면 택배사 배송 조회가 가능합니다. 일반 택배는 1~3일, 화물택배는 2~5일 정도 소요됩니다. 판매자별 발송 일정은 상품 상세 페이지에서 확인할 수 있습니다.",
  },
  {
    q: "부품 호환 여부는 어떻게 확인하나요?",
    a: "상품 상세 페이지의 차종, 연식, 부품번호 정보를 확인해 주세요. 호환 여부가 불확실한 경우 1:1 문의를 통해 판매자 또는 고객센터에 문의하실 수 있습니다.",
  },
  {
    q: "환불 및 교환은 어떻게 신청하나요?",
    a: "마이페이지 > 거래 내역에서 해당 주문을 선택한 후 환불/교환 신청 버튼을 눌러 주세요. 단순 변심, 부품 불량, 오배송 등 사유에 따라 처리 절차가 다를 수 있습니다.",
  },
  {
    q: "직거래도 가능한가요?",
    a: "일부 판매자는 직거래를 지원합니다. 상품 상세 페이지의 배송 방법 또는 판매자에게 1:1 문의를 통해 확인해 주세요.",
  },
  {
    q: "판매자 등록은 어떻게 하나요?",
    a: "로그인 후 마이페이지 > 내 상점 관리에서 판매자 등록을 진행할 수 있습니다. 사업자 또는 개인 판매자 모두 등록 가능합니다.",
  },
];

const ANNOUNCEMENTS = [
  {
    id: 12,
    pinned: true,
    title: "2026년 설 연휴 배송 및 고객센터 운영 안내",
    date: "2026.01.20",
  },
  {
    id: 11,
    pinned: true,
    title: "카팩토리 서비스 이용약관 개정 안내",
    date: "2026.01.05",
  },
  {
    id: 10,
    pinned: false,
    title: "부품 검색 기능 업데이트 안내",
    date: "2025.12.18",
  },
  {
    id: 9,
    pinned: false,
    title: "연말연시 고객센터 운영 시간 변경",
    date: "2025.12.10",
  },
  {
    id: 8,
    pinned: false,
    title: "신규 카테고리 '전자부품' 추가",
    date: "2025.11.28",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader showCategoryNav />
      <Breadcrumbs items={[{ label: "고객센터" }]} />

      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 pb-12">
        {/* Left sidebar */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <h2 className="mb-4 text-xl font-bold text-text">고객센터</h2>
          <nav className="overflow-hidden rounded-[12px] border border-border bg-white">
            {SUPPORT_NAV.map((item) => {
              const Icon = SUPPORT_ICONS[item.icon as keyof typeof SUPPORT_ICONS];
              const active = item.href === "/support";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 border-b border-border px-4 py-3.5 text-sm last:border-b-0",
                    active
                      ? "bg-primary-light font-semibold text-primary"
                      : "text-text hover:bg-bg",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="size-4 text-text-muted" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-[12px] border border-border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-text">
              <Clock className="size-4 text-primary" />
              운영 시간
            </div>
            <dl className="mt-3 space-y-1.5 text-xs text-text-secondary">
              <div className="flex justify-between">
                <dt>평일</dt>
                <dd className="font-medium text-text">09:00 – 18:00</dd>
              </div>
              <div className="flex justify-between">
                <dt>점심시간</dt>
                <dd className="font-medium text-text">12:00 – 13:00</dd>
              </div>
              <div className="flex justify-between">
                <dt>주말/공휴일</dt>
                <dd className="font-medium text-text">휴무</dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-[12px] border border-border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-text">
              <Phone className="size-4 text-primary" />
              연락처
            </div>
            <p className="mt-3 text-lg font-bold text-primary">02-1234-5678</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
              <MessageCircle className="size-3.5" />
              @카팩토리 고객센터
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <section className="rounded-[12px] border border-border bg-white p-6 md:p-8">
            <h1 className="text-2xl font-extrabold text-text md:text-3xl">
              무엇을 도와드릴까요?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              궁금한 점을 빠르게 찾아보거나 1:1 문의를 남겨 주세요.
            </p>
            <Link
              href="/support/inquiries/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <MessageSquare className="size-4" />
              1:1 문의하기
            </Link>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex flex-col gap-2 rounded-[12px] border border-border bg-white p-4 transition hover:border-primary/40 hover:bg-primary-light/40"
                >
                  <div className="flex size-10 items-center justify-center rounded-full border border-primary/30 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">{link.label}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{link.desc}</p>
                  </div>
                </Link>
              );
            })}
          </section>

          <section id="faq" className="mt-8 scroll-mt-24">
            <h2 className="mb-4 text-lg font-bold text-text">자주 묻는 질문</h2>
            <div className="overflow-hidden rounded-[12px] border border-border bg-white divide-y divide-border">
              {FAQ_ITEMS.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-text hover:bg-bg [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <ChevronRight className="size-4 shrink-0 text-text-muted transition group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-border bg-bg px-5 py-4 text-sm leading-relaxed text-text-secondary">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section id="shipping" className="mt-8 scroll-mt-24">
            <h2 className="mb-4 text-lg font-bold text-text">배송/결제 안내</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={<Package className="size-5" />}
                title="배송 안내"
                items={[
                  "일반 택배: 전국 1~3일 소요",
                  "화물택배: 대형 부품, 2~5일 소요",
                  "직거래: 판매자와 협의 후 진행",
                ]}
              />
              <InfoCard
                icon={<CreditCard className="size-5" />}
                title="결제 안내"
                items={[
                  "신용/체크카드, 계좌이체 지원",
                  "카카오페이, 네이버페이 지원",
                  "결제 완료 후 판매자 발송 처리",
                ]}
              />
            </div>
          </section>

          <section id="refund" className="mt-8 scroll-mt-24">
            <h2 className="mb-4 text-lg font-bold text-text">환불/교환 안내</h2>
            <div className="rounded-[12px] border border-border bg-white p-5 text-sm leading-relaxed text-text-secondary">
              <p>
                수령 후 7일 이내 미개봉·미사용 상태에서 환불/교환 신청이 가능합니다.
                부품 불량 또는 오배송의 경우 배송비는 카팩토리 또는 판매자가
                부담합니다. 단순 변심에 의한 반품 시 왕복 배송비는 구매자 부담입니다.
              </p>
            </div>
          </section>

          <section id="terms" className="mt-8 scroll-mt-24">
            <h2 className="mb-4 text-lg font-bold text-text">공지사항</h2>
            <div className="overflow-hidden rounded-[12px] border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left text-xs text-text-secondary">
                    <th className="hidden w-16 px-4 py-3 sm:table-cell">번호</th>
                    <th className="w-20 px-4 py-3">구분</th>
                    <th className="px-4 py-3">제목</th>
                    <th className="hidden w-28 px-4 py-3 md:table-cell">날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {ANNOUNCEMENTS.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-b-0 hover:bg-bg"
                    >
                      <td className="hidden px-4 py-3.5 text-text-muted sm:table-cell">
                        {row.id}
                      </td>
                      <td className="px-4 py-3.5">
                        {row.pinned ? (
                          <span className="inline-block whitespace-nowrap rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                            공지
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">일반</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          className="text-left font-medium text-text hover:text-primary"
                        >
                          {row.title}
                        </button>
                        <span className="mt-0.5 block text-xs text-text-muted md:hidden">
                          {row.date}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 text-text-secondary md:table-cell">
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <FeatureBar />
    </div>
  );
}

function InfoCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-5">
      <div className="flex items-center gap-2 font-bold text-text">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-text-secondary">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-primary">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
