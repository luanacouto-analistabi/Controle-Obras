"use client";

import { Fragment, useState } from "react";
import { filterOsCompletedBy, formatCurrencyBRL } from "@/lib/utils";
import type { OsAcceptanceTerm, PaymentEvent } from "@/types/database.types";
import type { EapRecord } from "@/types/maua-scp.types";

function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T00:00:00`));
}

export function PaymentEventsTable({
  paymentEvents,
  eapRows,
  acceptanceTerms,
}: {
  paymentEvents: PaymentEvent[];
  eapRows: EapRecord[];
  acceptanceTerms: Record<string, OsAcceptanceTerm>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const total = paymentEvents.reduce((sum, e) => sum + e.amount, 0);

  if (paymentEvents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-maua-navy">
          Nenhum evento de pagamento cadastrado ainda
        </p>
        <p className="mt-1 text-sm text-maua-gray-500">
          Cadastre eventos de pagamento em Configuração.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr>
            {[
              "Eventos",
              "Descrição na Invoice",
              "Condição",
              "Data Prevista Pagamento",
              "Valor",
              "Emissão PO",
            ].map((label) => (
              <th
                key={label}
                className="border-b border-border bg-maua-navy px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paymentEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            const osRows = event.expected_payment_date
              ? filterOsCompletedBy(eapRows, event.expected_payment_date)
              : [];

            return (
              <Fragment key={event.id}>
                <tr
                  onClick={() =>
                    setExpandedId(isExpanded ? null : event.id)
                  }
                  className={`cursor-pointer hover:bg-maua-gray-50 ${isExpanded ? "bg-maua-gray-50" : ""}`}
                >
                  <td className="border-b border-border px-3 py-2 font-semibold text-maua-navy">
                    <span className="mr-1 inline-block w-3 text-maua-gray-400">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                    {event.payment_event}
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {event.invoice_description || "–"}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-center">
                    {event.payment_condition || "–"}
                  </td>
                  <td className="border-b border-border px-3 py-2 tabular-nums">
                    {formatDate(event.expected_payment_date)}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-right font-semibold tabular-nums">
                    {formatCurrencyBRL(event.amount)}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-center">
                    {event.po_issued ? "Sim" : "Não"}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="border-b border-border bg-surface p-4">
                      {!event.expected_payment_date ? (
                        <p className="text-sm text-maua-gray-500">
                          Este evento não tem Data Prevista de Pagamento —
                          não é possível determinar as OS concluídas até
                          essa data.
                        </p>
                      ) : osRows.length === 0 ? (
                        <p className="text-sm text-maua-gray-500">
                          Nenhuma OS da EAP concluída até{" "}
                          {formatDate(event.expected_payment_date)} para
                          este CC.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-border bg-white">
                          <table className="w-full min-w-[700px] border-collapse text-xs">
                            <thead>
                              <tr>
                                {[
                                  "Cod. OS",
                                  "Descrição",
                                  "Data Início",
                                  "Data Fim",
                                  "Termo de Aceite",
                                ].map((label) => (
                                  <th
                                    key={label}
                                    className="border-b border-border bg-maua-navy/10 px-2.5 py-1.5 text-left font-bold uppercase tracking-wider text-maua-navy/70"
                                  >
                                    {label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {osRows.map((os) => {
                                const term = acceptanceTerms[os.cod_os];
                                const hasTerm = Boolean(
                                  term && (term.signed_at || term.storage_path)
                                );
                                return (
                                  <tr key={os.cod_os}>
                                    <td className="border-b border-border px-2.5 py-1.5 font-mono">
                                      {os.cod_os}
                                    </td>
                                    <td className="border-b border-border px-2.5 py-1.5">
                                      {os.descr_os}
                                    </td>
                                    <td className="border-b border-border px-2.5 py-1.5 tabular-nums">
                                      {formatDate(os.data_inicio)}
                                    </td>
                                    <td className="border-b border-border px-2.5 py-1.5 tabular-nums">
                                      {formatDate(os.data_fim)}
                                    </td>
                                    <td className="border-b border-border px-2.5 py-1.5">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                          hasTerm
                                            ? "bg-[#9AD595]/40 text-[#1B5E37]"
                                            : "bg-[#DFA1AA]/40 text-[#7C2737]"
                                        }`}
                                      >
                                        {hasTerm ? "Sim" : "Não"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-maua-gray-100 font-bold">
            <td colSpan={4} className="px-3 py-2 text-maua-navy">
              Total
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatCurrencyBRL(total)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
