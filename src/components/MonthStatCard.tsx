export type MonthStat = {
  yearMonth: string // "2026-01"
  gols?: number
  assist?: number
  jogos?: number
  vitorias?: number
  golsSofridos?: number // goleiro
  cleanSheets?: number // goleiro
  posRanking?: number // tipo "4º"
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

export default function MonthStatCard({
  item,
  isGoalkeeper,
}: {
  item: MonthStat
  isGoalkeeper?: boolean
}) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-extrabold">{formatYM(item.yearMonth)}</p>
          <p className="text-slate-400 text-sm">Resumo do mês</p>
        </div>

        <div className="flex items-center gap-3">
          {typeof item.posRanking === "number" && (
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <p className="text-xs text-slate-400">Posição</p>
              <p className="text-emerald-400 font-extrabold">{item.posRanking}º</p>
            </div>
          )}
          <div className="text-slate-500 text-xl">▾</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {!isGoalkeeper ? (
          <>
            <MiniStat title="Gols" value={item.gols ?? 0} />
            <MiniStat title="Assist." value={item.assist ?? 0} />
            <MiniStat title="Vitórias" value={item.vitorias ?? 0} />
          </>
        ) : (
          <>
            <MiniStat title="Sofridos" value={item.golsSofridos ?? 0} />
            <MiniStat title="CS" value={item.cleanSheets ?? 0} />
            <MiniStat title="Vitórias" value={item.vitorias ?? 0} />
          </>
        )}
      </div>
    </div>
  )
}

function MiniStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-950/35 border border-slate-800/60 p-3">
      <p className="text-slate-400 text-xs font-bold tracking-wide uppercase">{title}</p>
      <p className="text-white text-2xl font-extrabold mt-1">{value}</p>
    </div>
  )
}