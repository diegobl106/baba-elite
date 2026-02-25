export type RankingRow = {
  id: string
  nome: string
  valor: number
  posicao?: string
}

export default function RankingCard({
  title,
  subtitle,
  icon,
  leader,
  topList,
}: {
  title: string
  subtitle?: string
  icon?: string
  leader: RankingRow
  topList: RankingRow[]
}) {
  return (
    <div className="rounded-3xl bg-slate-900/45 border border-slate-800/60 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wide">
            {subtitle ?? "Ranking"}
          </p>
          <h2 className="text-xl font-extrabold text-white mt-1">{title}</h2>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center text-xl">
          {icon ?? "🏆"}
        </div>
      </div>

      {/* Campeão */}
      <div className="mt-5 rounded-3xl bg-slate-950/35 border border-slate-800/60 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar />
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">
              👑 Campeão
            </p>
            <p className="text-white font-extrabold text-lg">{leader.nome}</p>
            {leader.posicao ? (
              <p className="text-slate-400 text-sm">{leader.posicao}</p>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Total</p>
          <p className="text-3xl font-extrabold text-emerald-400">{leader.valor}</p>
        </div>
      </div>

      {/* Top 2-5 */}
      <div className="mt-4 space-y-3">
        {topList.map((r, idx) => (
          <div
            key={r.id}
            className="rounded-2xl bg-slate-950/25 border border-slate-800/50 px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 text-slate-400 font-extrabold">{idx + 2}º</div>
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div>
                <p className="text-white font-bold">{r.nome}</p>
                {r.posicao ? <p className="text-slate-500 text-xs">{r.posicao}</p> : null}
              </div>
            </div>
            <p className="text-white font-extrabold">{r.valor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
      <span className="text-xl">👑</span>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" />
    </div>
  )
}