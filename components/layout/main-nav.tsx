"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  FileCheck2,
  CalendarRange,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Menu Macro",
    items: [
      { href: "/", label: "Consolidado", icon: LayoutDashboard },
      {
        href: "/configuracao",
        label: "Configurações / Atualizações",
        icon: Settings,
      },
      {
        href: "/termo-aceite",
        label: "Atualização Termo de Aceite",
        icon: FileCheck2,
      },
      {
        href: "/cronograma-faturamento",
        label: "Cronograma de Faturamento",
        icon: CalendarRange,
      },
      { href: "/final-invoice", label: "Final Invoice", icon: Receipt },
    ],
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#C8D5DC]/50">
            {group.label}
          </p>
          {group.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-[#F18213] text-white"
                    : "text-[#C8D5DC] hover:bg-[#2D3F4A] hover:text-white"
                )}
              >
                <Icon
                  className="h-5 w-5 flex-shrink-0"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
