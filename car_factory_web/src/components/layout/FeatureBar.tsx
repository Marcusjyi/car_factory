import { Search, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { FEATURES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ICONS = {
  search: Search,
  chat: MessageCircle,
  shield: ShieldCheck,
  truck: Truck,
};

export function FeatureBar({ className }: { className?: string }) {
  return (
    <section className={cn("border-t border-border bg-white", className)}>
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4 md:gap-0">
        {FEATURES.map((f, i) => {
          const Icon = ICONS[f.icon];
          return (
            <div
              key={f.icon}
              className={cn(
                "flex items-center gap-3 px-2 md:justify-center md:px-6",
                i > 0 && "md:border-l md:border-border",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-text">
                  {f.title}
                </p>
                <p className="mt-0.5 text-xs font-normal leading-snug text-text-secondary">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
