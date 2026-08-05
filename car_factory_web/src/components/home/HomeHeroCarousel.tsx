"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroSlide = {
  id: string;
  image: string;
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
};

const SLIDES: HeroSlide[] = [
  {
    id: "search",
    image: "/images/hero-search.png",
    title: "필요한 부품, 카팩토리에서 찾으세요.",
    description: "중고부품도 새부품도 간편하게 검색하고 거래",
    primary: { href: "/parts", label: "부품 검색하기" },
    secondary: { href: "/sell", label: "판매하기" },
  },
  {
    id: "chat",
    image: "/images/hero-chat.png",
    title: "판매자와 1:1로 바로 대화하세요.",
    description: "상태·호환 여부를 채팅으로 확인하고 거래",
    primary: { href: "/parts", label: "부품 찾기" },
    secondary: { href: "/chat", label: "채팅 보기" },
  },
  {
    id: "pay",
    image: "/images/hero-pay.png",
    title: "누구나 사고, 누구나 판매하는 자동차 부품 마켓",
    description: "개인과 업체의 다양한 자동차 부품을 한곳에서 만나보세요.",
    primary: { href: "/parts", label: "부품 둘러보기" },
  },
  {
    id: "install",
    image: "/images/hero-install.png",
    title: "카팩토리에서 산 부품, 장착까지",
    description:
      "구매한 부품을 가까운 장착 대행 게라지에서 설치하세요",
    primary: {
      href: "/installers",
      label: "장착 대행점 보기",
    },
    secondary: { href: "/parts", label: "부품 먼저 찾기" },
  },
];

const AUTO_MS = 5000;

export function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;
  const slide = SLIDES[index] ?? SLIDES[0];

  function goTo(next: number) {
    setIndex(((next % count) + count) % count);
  }

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, index]);

  return (
    <section
      className="relative overflow-hidden bg-[#0b1220]"
      aria-roledescription="carousel"
      aria-label={"\ud648 \ud504\ub85c\ubaa8\uc158"}
    >
      {SLIDES.map((item, i) => (
        <div
          key={item.id}
          className={cn(
            "absolute inset-0 bg-cover bg-[position:70%_center] transition-opacity duration-700 ease-out md:bg-center",
            i === index ? "opacity-100" : "opacity-0",
          )}
          style={{ backgroundImage: `url(${item.image})` }}
          aria-hidden={i !== index}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/10 md:bg-none" />

      <div className="relative mx-auto flex min-h-[300px] max-w-[1200px] items-end px-4 pb-14 pt-10 sm:items-center sm:py-12 md:min-h-[470px] md:py-16 lg:min-h-[510px]">
        <div
          key={slide.id}
          className="w-fit max-w-full rounded-2xl bg-black/20 px-4 py-4 backdrop-blur-[2px] sm:max-w-xl sm:bg-black/12 sm:px-6 sm:py-6 md:max-w-2xl md:px-7 md:py-6"
        >
          <h1 className="text-xl font-extrabold leading-snug text-white sm:text-3xl md:whitespace-nowrap md:text-4xl lg:text-[2.5rem]">
            {slide.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/95 sm:mt-3 md:text-base lg:text-lg">
            {slide.description}
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href={slide.primary.href}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-bold leading-none text-text shadow-sm hover:bg-white/90"
            >
              {slide.primary.label}
            </Link>
            {slide.secondary ? (
              <Link
                href={slide.secondary.href}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/90 bg-white/15 px-6 text-sm font-bold leading-none text-white hover:bg-white/25"
              >
                {slide.secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-3 z-10 flex justify-center sm:bottom-5 md:bottom-6"
        role="tablist"
        aria-label={"\uc2ac\ub77c\uc774\ub4dc"}
      >
        <div className="flex gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}\ubc88 \uc2ac\ub77c\uc774\ub4dc`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index
                  ? "w-6 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="absolute left-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-text shadow-sm backdrop-blur-sm transition hover:bg-white sm:flex md:left-6"
        aria-label={"\uc774\uc804 \uc2ac\ub77c\uc774\ub4dc"}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="absolute right-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-text shadow-sm backdrop-blur-sm transition hover:bg-white sm:flex md:right-6"
        aria-label={"\ub2e4\uc74c \uc2ac\ub77c\uc774\ub4dc"}
      >
        <ChevronRight className="size-5" />
      </button>
    </section>
  );
}
