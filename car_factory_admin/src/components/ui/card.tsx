import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E0E0E0] bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#222]">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
