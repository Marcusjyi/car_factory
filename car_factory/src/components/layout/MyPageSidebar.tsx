import Link from "next/link";
import {
  ChevronRight,
  Home,
  Store,
  History,
  Heart,
  Search,
  User,
  MapPin,
  Headset,
  type LucideIcon,
} from "lucide-react";
import { MYPAGE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  store: Store,
  history: History,
  heart: Heart,
  search: Search,
  user: User,
  "map-pin": MapPin,
  headset: Headset,
};

export function MyPageSidebar({ activeHref }: { activeHref: string }) {
  return (
    <aside className="w-full shrink-0 md:w-[220px]">
      <h2 className="mb-4 text-xl font-bold text-text">마이페이지</h2>
      <nav className="overflow-hidden rounded-[12px] border border-border bg-white">
        {MYPAGE_NAV.map((item) => {
          const Icon = ICONS[item.icon] ?? Home;
          const active = item.href === activeHref;
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
    </aside>
  );
}
