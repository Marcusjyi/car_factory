import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-sm font-medium text-[#464646]">
          {label}
        </label>
      ) : null}
      <input
        className={cn(
          "w-full rounded-xl border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-[#464646]",
          className,
        )}
        {...props}
      />
    </div>
  );
}
