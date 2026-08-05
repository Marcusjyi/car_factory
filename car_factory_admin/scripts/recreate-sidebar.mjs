import fs from "node:fs";
import path from "node:path";

const out = path.resolve(
  "d:/codewave_project/client_project/car_factory/car_factory_admin/src/components/dashboard/sidebar.tsx",
);

const content =
  '"use client";\n\n' +
  'import Link from "next/link";\n' +
  'import { usePathname } from "next/navigation";\n' +
  "import {\n" +
  "  LayoutDashboard,\n" +
  "  Package,\n" +
  "  ShoppingBag,\n" +
  "  UserCircle,\n" +
  "  Users,\n" +
  '} from "lucide-react";\n' +
  'import { cn } from "@/lib/utils/cn";\n' +
  'import { useAuth } from "@/lib/auth/auth-context";\n' +
  'import { Button } from "@/components/ui/button";\n\n' +
  "const navItems = [\n" +
  '  { href: "/dashboard", label: "\uB300\uC2DC\uBCF4\uB4DC", icon: LayoutDashboard },\n' +
  '  { href: "/dashboard/users", label: "\uD68C\uC6D0", icon: Users },\n' +
  '  { href: "/dashboard/products", label: "\uC0C1\uD488", icon: Package },\n' +
  '  { href: "/dashboard/orders", label: "\uC8FC\uBB38", icon: ShoppingBag },\n' +
  "];\n\n" +
  "export function DashboardSidebar() {\n" +
  "  const pathname = usePathname();\n" +
  "  const { adminUser, logout } = useAuth();\n\n" +
  "  return (\n" +
  '    <aside className="flex h-full w-64 flex-col border-r border-[#E0E0E0] bg-[#F4F4F4]">\n' +
  '      <div className="border-b border-[#E0E0E0] px-5 py-6">\n' +
  '        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">\n' +
  "          CARFACTORY\n" +
  "        </p>\n" +
  '        <h2 className="mt-1 text-xl font-bold text-[#464646]">\uAD00\uB9AC\uC790</h2>\n' +
  "      </div>\n" +
  '      <nav className="flex-1 space-y-1 overflow-y-auto p-3">\n' +
  "        {navItems.map((item) => {\n" +
  "          const active =\n" +
  "            pathname === item.href ||\n" +
  '            (item.href !== "/dashboard" && pathname.startsWith(item.href));\n' +
  "          const Icon = item.icon;\n" +
  "          return (\n" +
  "            <Link\n" +
  "              key={item.href}\n" +
  "              href={item.href}\n" +
  "              className={cn(\n" +
  '                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",\n' +
  "                active\n" +
  '                  ? "bg-white text-[#464646] shadow-sm"\n' +
  '                  : "text-[#6B7280] hover:bg-white/70",\n' +
  "              )}\n" +
  "            >\n" +
  '              <Icon className="h-4 w-4 shrink-0" />\n' +
  "              <span>{item.label}</span>\n" +
  "            </Link>\n" +
  "          );\n" +
  "        })}\n" +
  "      </nav>\n" +
  '      <div className="border-t border-[#E0E0E0] p-4">\n' +
  '        <div className="flex items-center gap-2">\n' +
  '          <UserCircle className="h-5 w-5 text-[#9CA3AF]" />\n' +
  '          <div className="min-w-0 flex-1">\n' +
  '            <p className="truncate text-sm font-medium text-[#464646]">\n' +
  "              {adminUser?.displayName ?? \"\uAD00\uB9AC\uC790\"}\n" +
  "            </p>\n" +
  '            <p className="truncate text-xs text-[#9CA3AF]">{adminUser?.email}</p>\n' +
  "          </div>\n" +
  "        </div>\n" +
  '        <Button variant="ghost" className="mt-2 w-full" onClick={() => logout()}>\n' +
  "          \uB85C\uADF8\uC544\uC6C3\n" +
  "        </Button>\n" +
  "      </div>\n" +
  "    </aside>\n" +
  "  );\n" +
  "}\n\n" +
  "export function DashboardShell({ children }: { children: React.ReactNode }) {\n" +
  "  return (\n" +
  '    <div className="flex min-h-screen bg-white">\n' +
  '      <div className="hidden lg:block">\n' +
  "        <DashboardSidebar />\n" +
  "      </div>\n" +
  '      <main className="flex-1 overflow-auto">\n' +
  '        <div className="border-b border-[#E0E0E0] px-4 py-4 lg:hidden">\n' +
  '          <p className="text-sm font-semibold text-[#464646]">\n' +
  "            CARFACTORY \uAD00\uB9AC\uC790\n" +
  "          </p>\n" +
  "        </div>\n" +
  '        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>\n' +
  "      </main>\n" +
  "    </div>\n" +
  "  );\n" +
  "}\n";

const tmp = out + ".new";
fs.writeFileSync(tmp, content, "utf8");
fs.rmSync(out, { force: true });
fs.renameSync(tmp, out);
console.log("recreated sidebar without admins nav");
