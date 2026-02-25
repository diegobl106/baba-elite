export type Selection = {
  yearMonth: string // "2026-01"
  goleiro: string
  defensores: string[] // 2
  meias: string[] // 2
  atacante: string // 1
  destaque?: string // opcional
}

function formatYM(ym: string) {
  const [y, m] = ym.split("-")
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]
  const idx = Math.max(0, Math.min(11, Number(m) - 1))
  return `${monthNames[idx]} ${y}`
}

export default function SelectionCard({
  title,
  selection,
}: {
  title?: string
  selection: Selection
}) {
  return (
    <div className="rounded-3xl bg-slate-900/45 border border-slate-800/60 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wide">
            {title ?? "Seleção do mês"}
          </p>
          <h2 className="text-xl font-extrabold text-white mt-1">{formatYM(selection.yearMonth)}</h2>
          {selection.destaque ? (
            <p className="text-slate-300 mt-2">{selection.destaque}</p>
          ) : (
            <p className="text-slate-400 mt-2">Formação padrão: 1-2-2-1</p>
          )}
        </div>

        <div className="h-12 w-12 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center text-xl">
          🧠
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Line label="Goleiro" value={selection.goleiro} />
        <Line label="Defensores" value={selection.defensores.join(" • ")} />
        <Line label="Meias" value={selection.meias.join(" • ")} />
        <Line label="Atacante" value={selection.atacante} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950/25 border border-slate-800/50 px-4 py-3 flex items-center justify-between">
        <p className="text-slate-400 text-sm">Editar (admin)</p>
        <p className="text-slate-500 text-sm">Em breve</p>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/25 border border-slate-800/50 px-4 py-3">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="text-white font-extrabold mt-1">{value || "-"}</p>
    </div>
  )
}