"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FINAL_INVOICE_CATEGORIES,
  type FinalInvoiceCategory,
} from "@/lib/constants/final-invoice";
import type { FinalInvoiceDataByCategory } from "@/lib/services/final-invoice";
import { FinalInvoiceCategoryPanel } from "@/components/final-invoice/final-invoice-category-panel";

type FinalInvoiceTabsProps =
  | { projectId: string; dataByCategory: FinalInvoiceDataByCategory }
  | { projectId?: undefined; dataByCategory?: undefined };

export function FinalInvoiceTabs({
  projectId,
  dataByCategory,
}: FinalInvoiceTabsProps) {
  const [activeTab, setActiveTab] = useState<FinalInvoiceCategory>(
    FINAL_INVOICE_CATEGORIES[0]
  );

  function goToNextTab() {
    const currentIndex = FINAL_INVOICE_CATEGORIES.indexOf(activeTab);
    const nextTab = FINAL_INVOICE_CATEGORIES[currentIndex + 1];
    if (nextTab) setActiveTab(nextTab);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {FINAL_INVOICE_CATEGORIES.map((tab) => (
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

      {activeTab === "PPU" ? (
        projectId ? (
          <FinalInvoiceCategoryPanel
            key={activeTab}
            projectId={projectId}
            category={activeTab}
            data={dataByCategory?.[activeTab] ?? null}
            onSaved={goToNextTab}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
            <p className="text-base font-semibold text-maua-navy">{activeTab}</p>
            <p className="mt-1 text-base text-maua-gray-500">
              Salve o projeto para poder enviar o PDF desta categoria.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
          <p className="text-base font-semibold text-maua-navy">{activeTab}</p>
          <p className="mt-1 text-base text-maua-gray-500">
            Nenhum dado cadastrado ainda para esta aba.
          </p>
        </div>
      )}
    </div>
  );
}
