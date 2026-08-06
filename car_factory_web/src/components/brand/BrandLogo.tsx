import { cn } from "@/lib/utils";

/** 앱 CfLogo 와 동일 — "CAR " + 파란 "F" + "ACTORY" (italic, extrabold) */
type BrandLogoProps = {
  className?: string;
  /** 기본: 밝은 배경용. footer 등 어두운 배경은 light */
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "text-base",
  md: "text-lg md:text-[22px]",
  lg: "text-[22px] md:text-2xl",
} as const;

export function BrandLogo({
  className,
  variant = "dark",
  size = "md",
}: BrandLogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-text";

  return (
    <span
      className={cn(
        "inline-block font-black italic tracking-tight leading-none",
        sizeClass[size],
        textColor,
        className,
      )}
      aria-label="CAR FACTORY"
    >
      CAR{" "}
      <span className="text-[#2979FF]">F</span>
      ACTORY
    </span>
  );
}
