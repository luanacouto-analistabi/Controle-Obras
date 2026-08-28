"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ClientFilter({ clients }: { clients: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("cliente") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("cliente", e.target.value);
    } else {
      params.delete("cliente");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-maua-navy">Cliente</span>
      <select
        value={selected}
        onChange={handleChange}
        className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:border-accent"
      >
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client} value={client}>
            {client}
          </option>
        ))}
      </select>
    </label>
  );
}
