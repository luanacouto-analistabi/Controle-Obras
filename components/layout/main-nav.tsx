"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  FileCheck2,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Consolidado", icon: LayoutDashboard },
  { href: "/configuracao", label: "Configurações / Atualizações", icon: Settings },
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
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
            <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
