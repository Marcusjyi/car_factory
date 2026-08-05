import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-[#464646] text-white hover:bg-[#333]",
  secondary: "bg-[#F4F4F4] text-[#464646] hover:bg-[#E8E8E8]",
  ghost: "bg-transparent text-[#464646] hover:bg-[#F4F4F4]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
