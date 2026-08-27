"use client";

import { useActionState } from "react";
import {
  saveAcceptanceTermAction,
  type AcceptanceTermState,
} from "@/lib/actions/acceptance-terms";
import type { EapRecord } from "@/types/maua-scp.types";
import type { OsAcceptanceTerm } from "@/types/database.types";

function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${iso}T00:00:00`));
}

export function OsAcceptanceRow({
  projectId,
  os,
  existing,
  attachmentUrl,
}: {
  projectId: string;
  os: EapRecord;
  existing: OsAcceptanceTerm | null;
  attachmentUrl: string | null;
}) {
  const action = saveAcceptanceTermAction.bind(null, projectId, os.cod_os);
  const [state, formAction, pending] = useActionState<
    AcceptanceTermState,
    FormData
  >(action, undefined);

  return (
    <form
      action={formAction}
      className="grid grid-cols-[110px_1fr_100px_100px_150px_1fr] items-center gap-3 px-3 py-2 text-sm"
    >
      <span className="font-mono text-xs">{os.cod_os}</span>
      <span className="text-maua-navy">{os.descr_os}</span>
      <span className="tabular-nums text-xs">{formatDate(os.data_inicio)}</span>
      <span className="tabular-nums text-xs">{formatDate(os.data_fim)}</span>
      <input
        type="date"
        name="signed_at"
        defaultValue={existing?.signed_at ?? ""}
        className="h-8 rounded-lg border border-border bg-white px-2 text-xs outline-none focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:border-accent"
      />
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="document"
          accept="application/pdf"
          className="w-full text-xs"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-8 flex-shrink-0 rounded-lg bg-maua-navy px-3 text-xs font-bold text-white hover:bg-[#2D3F4A] disabled:opacity-60"
        >
          {pending ? "..." : "Salvar"}
        </button>
        {attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 text-xs font-semibold text-maua-navy hover:underline"
          >
            Ver anexo
          </a>
        )}
      </div>
      {state?.error && (
        <p className="col-span-6 text-xs font-semibold text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="col-span-6 text-xs font-semibold text-emerald-700">
          Salvo.
        </p>
      )}
    </form>
  );
}
