"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteProjectAction,
  type DeleteProjectState,
} from "@/lib/actions/projects";

export function DeleteProjectButton({
  projectId,
  projectLabel,
}: {
  projectId: string;
  projectLabel: string;
}) {
  const action = deleteProjectAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<
    DeleteProjectState,
    FormData
  >(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Excluir o projeto "${projectLabel}"? Isso apaga também pagamentos, faturamento, documentos e o histórico dele. Essa ação não pode ser desfeita.`
          )
        ) {
          e.preventDefault();
        }
      }}
      className="inline-flex"
    >
      <button
        type="submit"
        disabled={pending}
        title="Excluir projeto"
        aria-label={`Excluir projeto ${projectLabel}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </button>
      {state?.error && (
        <p className="ml-2 self-center text-xs font-semibold text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
