import { formatCurrencyBRL } from "@/lib/utils";

type Totals = {
  projectCount: number;
  approved: number;
  inDiscussion: number;
  forecast: number;
  poNotIssued: number;
  poNoBalance: number;
  paid: number;
  upcoming: number;
  overdue: number;
};

const CARDS: Array<{
  key: keyof Omit<Totals, "projectCount" | "poNotIssued" | "poNoBalance">;
  label: string;
  tone: "neutral" | "ok" | "warn" | "risk";
}> = [
  { key: "approved", label: "Aprovado", tone: "ok" },
  { key: "inDiscussion", label: "Em discussão", tone: "neutral" },
  { key: "forecast", label: "Previsto", tone: "neutral" },
  { key: "paid", label: "Pago", tone: "ok" },
  { key: "upcoming", label: "A vencer", tone: "warn" },
  { key: "overdue", label: "Vencido", tone: "risk" },
];

const TONE_CLASS: Record<(typeof CARDS)[number]["tone"], string> = {
  neutral: "text-maua-navy",
  ok: "text-emerald-700",
  warn: "text-[#F18213]",
  risk: "text-red-600",
};

export function KpiCards({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-card"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
            {card.label}
          </p>
          <p
            className={`mt-1 truncate text-xl font-bold tabular-nums ${TONE_CLASS[card.tone]}`}
            title={formatCurrencyBRL(totals[card.key])}
          >
            {formatCurrencyBRL(totals[card.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
