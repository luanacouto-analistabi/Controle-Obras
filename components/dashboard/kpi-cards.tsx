import { formatCurrencyBRL } from "@/lib/utils";

type Totals = {
  projectCount: number;
  approved: number;
  forecast: number;
  paid: number;
  upcoming: number;
  overdue: number;
  inDiscussion: number;
};

const CARDS: Array<{
  key: keyof Omit<Totals, "projectCount">;
  label: string;
  tone: "neutral" | "ok" | "warn" | "risk";
}> = [
  { key: "approved", label: "Aprovado", tone: "ok" },
  { key: "forecast", label: "Previsto", tone: "neutral" },
  { key: "paid", label: "Pago", tone: "ok" },
  { key: "upcoming", label: "A vencer", tone: "warn" },
  { key: "overdue", label: "Vencido", tone: "risk" },
  { key: "inDiscussion", label: "Em discussão", tone: "neutral" },
];

const TONE_CLASS: Record<(typeof CARDS)[number]["tone"], string> = {
  neutral: "text-maua-navy",
  ok: "text-emerald-700",
  warn: "text-[#F18213]",
  risk: "text-red-600",
};

export function KpiCards({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <div className="rounded-xl border border-border bg-white p-4 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
          Projetos
        </p>
        <p className="mt-1 text-xl font-bold tabular-nums text-maua-navy">
          {totals.projectCount}
        </p>
      </div>
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-border bg-white p-4 shadow-card"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-maua-navy/70">
            {card.label}
          </p>
          <p
            className={`mt-1 text-xl font-bold tabular-nums ${TONE_CLASS[card.tone]}`}
          >
            {formatCurrencyBRL(totals[card.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
