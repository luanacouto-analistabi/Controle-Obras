import "server-only";

import { createClient } from "@/lib/supabase/server";

export type WeekBucket = { start: string; end: string; label: string };

const MONTH_ABBR = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Semanas (segunda a domingo) dentro de um mês — a primeira e a última
 * absorvem os dias parciais pra nunca vazar pro mês anterior/seguinte.
 * Ex.: agosto/2026 (começa num sábado) → 01-09, 10-16, 17-23, 24-31.
 */
export function getMonthlyWeekBuckets(year: number, month: number): WeekBucket[] {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const buckets: { start: Date; end: Date }[] = [];

  let cursor = monthStart;
  let isFirst = true;

  while (cursor <= monthEnd) {
    const remainingDays =
      Math.round((monthEnd.getTime() - cursor.getTime()) / 86_400_000) + 1;

    if (!isFirst && remainingDays < 7) {
      buckets[buckets.length - 1].end = new Date(monthEnd);
      break;
    }

    const dow = cursor.getUTCDay(); // 0=dom..6=sáb
    const daysToAdd = isFirst ? ((8 - dow) % 7) + 6 : 6;
    let weekEnd = new Date(cursor);
    weekEnd.setUTCDate(cursor.getUTCDate() + daysToAdd);
    if (weekEnd > monthEnd) weekEnd = new Date(monthEnd);

    buckets.push({ start: new Date(cursor), end: weekEnd });

    cursor = new Date(weekEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    isFirst = false;
  }

  return buckets.map((b) => ({
    start: toISODate(b.start),
    end: toISODate(b.end),
    label: `${pad(b.start.getUTCDate())} a ${pad(b.end.getUTCDate())}/${pad(
      b.end.getUTCMonth() + 1
    )}`,
  }));
}

export function formatMonthLabel(year: number, month: number) {
  return `${MONTH_ABBR[month - 1]}.${String(year).slice(2)}`;
}

export type BillingCellStatus = "pago" | "previsto" | "vencido" | null;

export type BillingScheduleRow = {
  key: string;
  cc: string;
  category: "ESCOPO" | "VOR";
  vesselName: string;
  weekAmounts: number[];
  weekStatuses: BillingCellStatus[];
  total: number;
  totalStatus: BillingCellStatus;
};

/**
 * Prioridade quando uma célula soma eventos em estados diferentes: um
 * vencido chama mais atenção que um previsto, que por sua vez chama mais
 * atenção que um já pago — só fica totalmente "pago" (verde) se todos os
 * eventos daquela célula estiverem pagos.
 */
const STATUS_PRIORITY: Record<Exclude<BillingCellStatus, null>, number> = {
  vencido: 3,
  previsto: 2,
  pago: 1,
};

function combineStatus(
  current: BillingCellStatus,
  next: BillingCellStatus
): BillingCellStatus {
  if (!current) return next;
  if (!next) return current;
  return STATUS_PRIORITY[next] > STATUS_PRIORITY[current] ? next : current;
}

function classifyEvent(
  paidDate: string | null,
  expectedPaymentDate: string
): Exclude<BillingCellStatus, null> {
  if (paidDate) return "pago";
  const todayIso = toISODate(new Date());
  return expectedPaymentDate < todayIso ? "vencido" : "previsto";
}

/**
 * Previsão de faturamento semanal: soma o `amount` dos payment_events por
 * Data Prevista de Pagamento, agrupado por projeto e por categoria
 * (ESCOPO/VOR — VOR quando o nome do evento contém "vor", senão ESCOPO).
 * Só entram linhas com total > 0 no mês.
 *
 * Cada célula também carrega um status (pago/previsto/vencido) usado para
 * colorir o fundo — pago quando paid_date está preenchido, vencido quando
 * a Data Prevista de Pagamento já passou e ainda não foi pago, previsto
 * caso contrário.
 */
export async function getBillingSchedule(
  year: number,
  month: number
): Promise<{ buckets: WeekBucket[]; rows: BillingScheduleRow[] }> {
  const buckets = getMonthlyWeekBuckets(year, month);
  const monthStart = buckets[0].start;
  const monthEnd = buckets[buckets.length - 1].end;

  const supabase = await createClient();
  const [{ data: projects, error: projectsError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase.from("projects").select("id, cc, vessel_name"),
      supabase
        .from("payment_events")
        .select("project_id, payment_event, amount, expected_payment_date, paid_date")
        .gte("expected_payment_date", monthStart)
        .lte("expected_payment_date", monthEnd),
    ]);
  if (projectsError) throw projectsError;
  if (eventsError) throw eventsError;

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
  const groups = new Map<string, BillingScheduleRow>();

  for (const event of events ?? []) {
    const project = projectById.get(event.project_id);
    if (!project || !event.expected_payment_date) continue;

    const category: "ESCOPO" | "VOR" = event.payment_event
      .toLowerCase()
      .includes("vor")
      ? "VOR"
      : "ESCOPO";
    const key = `${project.id}-${category}`;

    let row = groups.get(key);
    if (!row) {
      row = {
        key,
        cc: project.cc,
        category,
        vesselName: project.vessel_name,
        weekAmounts: buckets.map(() => 0),
        weekStatuses: buckets.map(() => null),
        total: 0,
        totalStatus: null,
      };
      groups.set(key, row);
    }

    const bucketIndex = buckets.findIndex(
      (b) => event.expected_payment_date! >= b.start && event.expected_payment_date! <= b.end
    );
    if (bucketIndex === -1) continue;

    const status = classifyEvent(event.paid_date, event.expected_payment_date);
    row.weekAmounts[bucketIndex] += event.amount;
    row.weekStatuses[bucketIndex] = combineStatus(
      row.weekStatuses[bucketIndex],
      status
    );
    row.total += event.amount;
    row.totalStatus = combineStatus(row.totalStatus, status);
  }

  const rows = [...groups.values()]
    .filter((row) => row.total > 0)
    .sort((a, b) => a.cc.localeCompare(b.cc) || a.category.localeCompare(b.category));

  return { buckets, rows };
}
