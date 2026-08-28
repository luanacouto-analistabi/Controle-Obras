"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Consolidado" },
  { href: "/configuracao", label: "Configuração" },
  { href: "/termo-aceite", label: "Atualização Termo de Aceite" },
  { href: "/cronograma-faturamento", label: "Cronograma de Faturamento" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-[#F18213] text-white"
                : "text-[#C8D5DC] hover:bg-[#2D3F4A] hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
