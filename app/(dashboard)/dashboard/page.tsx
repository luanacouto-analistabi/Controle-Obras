export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-maua-navy">Dashboard</h1>
        <p className="text-base text-maua-gray-500">
          Painel em construção.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center shadow-card">
        <p className="text-base font-semibold text-maua-navy">
          Nenhum conteúdo configurado ainda
        </p>
        <p className="mt-1 text-base text-maua-gray-500">
          Assim que os indicadores forem definidos, eles aparecem aqui.
        </p>
      </div>
    </div>
  );
}
