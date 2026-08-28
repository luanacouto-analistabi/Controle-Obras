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
  key: keyof Omit<Totals, "projectCount">;
  label: string;
  tone: "neutral" | "ok" | "warn" | "risk";
}> = [
  { key: "approved", label: "Aprovado", tone: "ok" },
  { key: "inDiscussion", label: "Em discussão", tone: "neutral" },
  { key: "forecast", label: "Previsto", tone: "neutral" },
  { key: "poNotIssued", label: "PO não emitida", tone: "warn" },
  { key: "poNoBalance", label: "PO sem saldo", tone: "warn" },
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
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
