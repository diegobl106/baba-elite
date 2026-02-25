"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import { listPlayersByOverall, Player } from "@/lib/players"
import { computeHallRecords, HallRecord } from "@/lib/hall"
import { listMonthRows, MonthPlayerRow } from "@/lib/monthRankings"

type Scope = "mes" | "geral" | "hall"
type Category = "mvp" | "artilheiro" | "garcom" | "goleiro" | "defensor" | "mais_jogos"

const SCOPE_TABS: { key: Scope; label: string; icon: string }[] = [
  { key: "mes", label: "MÊS", icon: "🗓️" },
  { key: "geral", label: "GERAL", icon: "🌐" },
  { key: "hall", label: "HALL", icon: "🏆" },
]

const CAT_TABS: { key: Category; label: string }[] = [
  { key: "mvp", label: "MVP" },
  { key: "artilheiro", label: "Artilheiro" },
  { key: "garcom", label: "Garçom" },
  { key: "goleiro", label: "Goleiro" },
  { key: "defensor", label: "Defensor" },
  { key: "mais_jogos", label: "Mais Jogos" },
]

function norm(s: string) {
  return (s || "").trim().toLowerCase()
}

function isGoalkeeperPos(posicao: string) {
  const pos = norm(posicao)
  return pos.includes("gol") || pos === "gk"
}

function isDefenderPos(posicao: string) {
  const pos = norm(posicao)
  return (
    pos.includes("zag") ||
    pos.includes("def") ||
    pos === "z" ||
    pos.includes("ld") ||
    pos.includes("le") ||
    pos.includes("cb") ||
    pos.includes("rb") ||
    pos.includes("lb")
  )
}

function CategorySubtitle(cat: Category) {
  switch (cat) {
    case "mvp":
      return "Ordenado por Overall"
    case "artilheiro":
      return "Ordenado por Gols"
    case "garcom":
      return "Ordenado por Assistências"
    case "mais_jogos":
      return "Ordenado por Jogos"
    case "goleiro":
      return "Apenas goleiros (por posição)"
    case "defensor":
      return "Apenas defensores (por posição)"
  }
}

function StatLabel(cat: Category) {
  switch (cat) {
    case "mvp":
      return "OVR"
    case "artilheiro":
      return "GOLS"
    case "garcom":
      return "ASSIST"
    case "mais_jogos":
      return "JOGOS"
    case "goleiro":
      return "OVR"
    case "defensor":
      return "OVR"
  }
}

function StatValuePlayer(cat: Category, p: Player) {
  switch (cat) {
    case "mvp":
    case "goleiro":
    case "defensor":
      return p.overall
    case "artilheiro":
      return p.gols
    case "garcom":
      return p.assistencias
    case "mais_jogos":
      return p.jogos
  }
}

function StatValueMonth(cat: Category, r: MonthPlayerRow) {
  switch (cat) {
    case "mvp":
    case "goleiro":
    case "defensor":
      return r.overall
    case "artilheiro":
      return r.gols
    case "garcom":
      return r.assistencias
    case "mais_jogos":
      return r.jogos
  }
}

function medal(rank: number) {
  if (rank === 1) return { emoji: "🥇", text: "TOP 1 • INSANO", tone: "gold" as const }
  if (rank === 2) return { emoji: "🥈", text: "TOP 2 • ELITE", tone: "silver" as const }
  if (rank === 3) return { emoji: "🥉", text: "TOP 3 • ELITE", tone: "bronze" as const }
  return { emoji: "⭐", text: `TOP ${rank}`, tone: "dark" as const }
}

function toneBorder(tone: "gold" | "silver" | "bronze" | "dark") {
  switch (tone) {
    case "gold":
      return "border-yellow-400/35"
    case "silver":
      return "border-slate-200/20"
    case "bronze":
      return "border-amber-500/20"
    default:
      return "border-emerald-400/15"
  }
}

function initials(nome?: string) {
  return (
    (nome || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  )
}

function MonthLabel(ym: string) {
  const [y, m] = ym.split("-")
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const idx = Math.max(0, Math.min(11, Number(m) - 1))
  return `${names[idx]}/${y}`
}

function getMonthOptions(count = 12) {
  const now = new Date()
  const res: string[] = []

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    res.push(`${y}-${m}`)
  }

  return res
}

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs tracking-[0.28em] text-white/55">{label}</div>
      <div className="text-white font-bold text-lg mt-1">{String(value)}</div>
    </div>
  )
}

function PlayerCard({
  player,
  rank,
  category,
  statValue,
}: {
  player: Player
  rank: number
  category: Category
  statValue: number
}) {
  const m = medal(rank)

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border bg-[#0b1220]/70 backdrop-blur-md",
        "shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
        toneBorder(m.tone),
      ].join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.12),transparent_60%)]" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{m.emoji}</div>

            <div className="text-4xl sm:text-5xl font-extrabold text-white/90 leading-none">
              {statValue}
            </div>

            <div className="flex flex-col">
              <div className="text-xs tracking-[0.28em] text-white/55">{StatLabel(category)}</div>
              <div className="text-white font-bold text-lg sm:text-xl">
                #{rank} {player.nome}
              </div>
              <div className="text-white/55 text-sm">
                {player.posicao || "—"} • {player.jogos} jogos
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/10 bg-black/25 text-white/85">
            {m.text}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-4 items-stretch">
          <div className="rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(240px_240px_at_50%_30%,rgba(255,255,255,0.10),transparent_60%)]" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-emerald-400/60 bg-[#0a1020] flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-emerald-300 overflow-hidden">
              {player.fotoUrl ? (
                <img src={player.fotoUrl} alt={player.nome} className="w-full h-full object-cover" />
              ) : (
                initials(player.nome)
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {category === "mvp" && (
              <>
                <StatBox label="GOLS" value={player.gols} />
                <StatBox label="ASSIST" value={player.assistencias} />
                <StatBox label="JOGOS" value={player.jogos} />
                <StatBox label="CARAC" value={player.caracteristica || "—"} />
              </>
            )}

            {category === "artilheiro" && (
              <>
                <StatBox label="GOLS" value={player.gols} />
                <StatBox label="JOGOS" value={player.jogos} />
                <StatBox label="MÉDIA G/J" value={player.jogos ? (player.gols / player.jogos).toFixed(2) : "0.00"} />
                <StatBox label="POS" value={player.posicao || "—"} />
              </>
            )}

            {category === "garcom" && (
              <>
                <StatBox label="ASSIST" value={player.assistencias} />
                <StatBox label="JOGOS" value={player.jogos} />
                <StatBox label="MÉDIA A/J" value={player.jogos ? (player.assistencias / player.jogos).toFixed(2) : "0.00"} />
                <StatBox label="POS" value={player.posicao || "—"} />
              </>
            )}

            {category === "mais_jogos" && (
              <>
                <StatBox label="JOGOS" value={player.jogos} />
                <StatBox label="OVR" value={player.overall} />
                <StatBox label="GOLS" value={player.gols} />
                <StatBox label="ASSIST" value={player.assistencias} />
              </>
            )}

            {(category === "goleiro" || category === "defensor") && (
              <>
                <StatBox label="OVR" value={player.overall} />
                <StatBox label="JOGOS" value={player.jogos} />
                <StatBox label="GOLS" value={player.gols} />
                <StatBox label="ASSIST" value={player.assistencias} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HallCard({ rec }: { rec: HallRecord }) {
  const p = rec.player
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/25 bg-[#0b1220]/70 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(250,204,21,0.18),transparent_60%)]" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.28em] text-white/55">HALL DA FAMA</div>
            <div className="text-white font-extrabold text-xl mt-1">{rec.label}</div>
            <div className="text-white/55 text-sm mt-1">{rec.monthId}</div>
          </div>

          <div className="text-right">
            <div className="text-xs tracking-[0.28em] text-white/55">{rec.statLabel}</div>
            <div className="text-5xl font-extrabold text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.35)]">
              {rec.value}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border border-white/10 bg-black/25 overflow-hidden flex items-center justify-center">
            {p.fotoUrl ? (
              <img src={p.fotoUrl} alt={p.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl font-extrabold text-yellow-200">{initials(p.nome)}</div>
            )}
          </div>

          <div>
            <div className="text-white font-extrabold text-lg">{p.nome}</div>
            <div className="text-white/55 text-sm">{p.caracteristica || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const [scope, setScope] = useState<Scope>("geral")
  const [category, setCategory] = useState<Category>("mvp")

  // MÊS real
  const monthOptions = useMemo(() => getMonthOptions(12), [])
  const [monthId, setMonthId] = useState<string>(monthOptions[0])
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthRows, setMonthRows] = useState<MonthPlayerRow[]>([])

  // HALL
  const [hallLoading, setHallLoading] = useState(false)
  const [hall, setHall] = useState<HallRecord[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const list = await listPlayersByOverall()
      setPlayers(list)
      setLoading(false)
    }
    run()
  }, [])

  // carrega mês quando scope=mes OU quando monthId muda
  useEffect(() => {
    const run = async () => {
      if (scope !== "mes") return
      setMonthLoading(true)
      try {
        const rows = await listMonthRows(monthId)
        setMonthRows(rows)
      } finally {
        setMonthLoading(false)
      }
    }
    run()
  }, [scope, monthId])

  // carrega hall só quando entrar nele
  useEffect(() => {
    const run = async () => {
      if (scope !== "hall") return
      setHallLoading(true)
      try {
        const recs = await computeHallRecords()
        setHall(recs)
      } finally {
        setHallLoading(false)
      }
    }
    run()
  }, [scope])

  const generalSorted = useMemo(() => {
    let base = [...players]

    if (category === "goleiro") base = base.filter((p) => isGoalkeeperPos(p.posicao))
    if (category === "defensor") base = base.filter((p) => isDefenderPos(p.posicao))

    base.sort((a, b) => {
      const va = StatValuePlayer(category, a)
      const vb = StatValuePlayer(category, b)
      if (Number(vb) !== Number(va)) return Number(vb) - Number(va)
      return (b.overall ?? 0) - (a.overall ?? 0)
    })

    return base
  }, [players, category])

  const monthSorted = useMemo(() => {
    let base = [...monthRows]

    if (category === "goleiro") base = base.filter((r) => isGoalkeeperPos(r.player.posicao))
    if (category === "defensor") base = base.filter((r) => isDefenderPos(r.player.posicao))

    base.sort((a, b) => {
      const va = StatValueMonth(category, a)
      const vb = StatValueMonth(category, b)
      if (Number(vb) !== Number(va)) return Number(vb) - Number(va)
      // desempate: overall do mês
      return (b.overall ?? 0) - (a.overall ?? 0)
    })

    return base
  }, [monthRows, category])

  return (
    <>
      <TopBar title="Rankings" />

      <main className="p-6 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-emerald-300/70 tracking-[0.35em] font-bold text-xs">COMPETIÇÃO ATIVA</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">RANKINGS</h1>

            <div className="text-white/55 mt-2">
              {scope === "hall"
                ? "Recordes históricos (automático)"
                : scope === "mes"
                ? `Ranking do mês • ${MonthLabel(monthId)}`
                : CategorySubtitle(category)}
            </div>
          </div>

          {/* Tabs: MÊS / GERAL / HALL */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-2 flex gap-2 justify-center">
            {SCOPE_TABS.map((t) => {
              const active = scope === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setScope(t.key)}
                  className={[
                    "px-5 py-3 rounded-xl font-bold flex items-center gap-2",
                    active
                      ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-200"
                      : "text-white/70 hover:text-white border border-transparent hover:border-white/10",
                  ].join(" ")}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              )
            })}
          </div>

          {/* seletor de mês (aparece só no MÊS) */}
          {scope === "mes" && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="text-white/55 text-sm">Escolher mês:</div>
              <select
                value={monthId}
                onChange={(e) => setMonthId(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-bold"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {MonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs: categorias (esconde no HALL pq o hall já mostra tudo) */}
          {scope !== "hall" && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {CAT_TABS.map((t) => {
                const active = category === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setCategory(t.key)}
                    className={[
                      "px-4 py-2 rounded-full font-bold text-sm border",
                      active
                        ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                        : "bg-black/15 border-white/10 text-white/70 hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-8 space-y-4">
            {scope === "hall" ? (
              hallLoading ? (
                <div className="text-slate-300 text-center">Carregando Hall...</div>
              ) : hall.length === 0 ? (
                <div className="text-slate-300 text-center">
                  Ainda não tem meses cadastrados (players/{`{id}`}/months/{`{YYYY-MM}`}).
                </div>
              ) : (
                hall.map((rec) => <HallCard key={`${rec.category}-${rec.player.id}-${rec.monthId}`} rec={rec} />)
              )
            ) : scope === "mes" ? (
              monthLoading ? (
                <div className="text-slate-300 text-center">Carregando mês...</div>
              ) : monthSorted.length === 0 ? (
                <div className="text-slate-300 text-center">
                  Sem dados para {MonthLabel(monthId)}. O admin precisa criar docs em:
                  <br />
                  <span className="font-mono text-white/70">
                    players/{`{playerId}`}/months/{monthId}
                  </span>
                </div>
              ) : (
                monthSorted.map((r, idx) => (
                  <PlayerCard
                    key={`${r.player.id}-${monthId}-${idx}`}
                    player={r.player}
                    rank={idx + 1}
                    category={category}
                    statValue={Number(StatValueMonth(category, r))}
                  />
                ))
              )
            ) : loading ? (
              <div className="text-slate-300 text-center">Carregando...</div>
            ) : generalSorted.length === 0 ? (
              <div className="text-slate-300 text-center">Sem jogadores.</div>
            ) : (
              generalSorted.map((p, idx) => (
                <PlayerCard
                  key={`${p.id}-geral-${idx}`}
                  player={p}
                  rank={idx + 1}
                  category={category}
                  statValue={Number(StatValuePlayer(category, p))}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}