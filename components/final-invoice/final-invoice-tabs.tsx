"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  "PPU",
  "Tubualão",
  "Timesheets",
  "Válvulas",
  "Água Doce",
  "Andaimes",
  "Armazenagem",
  "Caixa Distribuição",
  "Energia",
  "Guindaste",
  "Resíduo",
  "Sewage",
] as const;

export function FinalInvoiceTabs() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              activeTab === tab
                ? "bg-maua-navy text-white"
                : "bg-white text-maua-navy hover:bg-maua-gray-100 border border-border"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
        <p className="text-base font-semibold text-maua-navy">{activeTab}</p>
        <p className="mt-1 text-base text-maua-gray-500">
          Nenhum dado cadastrado ainda para esta aba.
        </p>
      </div>
    </div>
  );
}
