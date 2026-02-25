"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { collection, getDocs, query, where } from "firebase/firestore"
import { listMonths, monthLabel, MonthStats } from "@/lib/career"

type PlayerDoc = {
  id: string
  nome: string
  posicao: string
  fotoUrl?: string
  overall?: number
  email?: string
}

function norm(s: string) {
  return (s || "").trim().toLowerCase()
}

function isGoalkeeperPos(pos?: string) {
  const p = norm(pos || "")
  return p.includes("gol") || p === "gk"
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

export default function CarreiraPage() {
  const [user, setUser] = useState<User | null>(null)

  const [player, setPlayer] = useState<PlayerDoc | null>(null)
  const [months, setMonths] = useState<MonthStats[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const run = async () => {
      setErr("")
      setLoading(true)

      try {
        const email = user?.email || ""
        if (!email) {
          setPlayer(null)
          setMonths([])
          setLoading(false)
          return
        }

        // procura o player pelo email
        const q = query(collection(db, "players"), where("email", "==", email))
        const snap = await getDocs(q)

        if (snap.empty) {
          setPlayer(null)
          setMonths([])
          setErr("Seu perfil não foi encontrado em players. Verifique o cadastro.")
          setLoading(false)
          return
        }

        const docu = snap.docs[0]
        const data = docu.data() as any

        const p: PlayerDoc = {
          id: docu.id,
          nome: data.nome || "Jogador",
          posicao: data.posicao || "",
          fotoUrl: data.fotoUrl || "",
          overall: Number(data.overall ?? 0),
          email: data.email || "",
        }
        setPlayer(p)

        const list = await listMonths(docu.id)
        setMonths(list)
      } catch (e: any) {
        console.error(e)
        setErr("Erro ao carregar carreira. Veja o console.")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [user?.email])

  const isGK = useMemo(() => isGoalkeeperPos(player?.posicao), [player?.posicao])

  const totals = useMemo(() => {
    const t = {
      meses: months.length,
      jogos: 0,
      gols: 0,
      assist: 0,
      gs: 0,
      cs: 0,
      avgOverall: 0,
      bestMonth: null as MonthStats | null,
    }

    if (!months.length) return t

    let sumOverall = 0
    for (const m of months) {
      t.jogos += m.jogos
      t.gols += m.gols
      t.assist += m.assistencias
      t.gs += m.gs
      t.cs += m.cs
      sumOverall += m.overall

      if (!t.bestMonth || m.overall > t.bestMonth.overall) t.bestMonth = m
    }
    t.avgOverall = Math.round((sumOverall / months.length) * 10) / 10
    return t
  }, [months])

  const maxOverall = useMemo(() => {
    return months.reduce((mx, m) => Math.max(mx, m.overall), 1)
  }, [months])

  if (loading) {
    return (
      <>
        <TopBar title="Carreira" />
        <main className="p-6 text-white">
          <div className="max-w-5xl mx-auto text-center text-white/70">Carregando carreira...</div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Carreira" />

      <main className="p-6 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-emerald-300/70 tracking-[0.35em] font-bold text-xs">PERFIL DO JOGADOR</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">CARREIRA</h1>
            <div className="text-white/55 mt-2">Resumo por mês + evolução</div>
          </div>

          {err && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
              {err}
            </div>
          )}

          {/* Header card */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
            <div className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center font-extrabold text-emerald-200">
                {player?.fotoUrl ? (
                  <img src={player.fotoUrl} alt={player.nome} className="w-full h-full object-cover" />
                ) : (
                  initials(player?.nome)
                )}
              </div>

              <div className="flex-1">
                <div className="text-white font-extrabold text-2xl">{player?.nome || "—"}</div>
                <div className="text-white/55">
                  {player?.posicao || "—"} {isGK ? "• (Goleiro)" : ""}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs tracking-[0.25em] text-white/50 font-bold">OVR (ATUAL)</div>
                <div className="text-4xl font-extrabold text-emerald-200">{player?.overall ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Totais */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Meses" value={totals.meses} />
            <StatCard label="Jogos" value={totals.jogos} />
            <StatCard label="Gols" value={totals.gols} />
            <StatCard label="Assistências" value={totals.assist} />

            {isGK && (
              <>
                <StatCard label="Gols sofridos" value={totals.gs} />
                <StatCard label="Clean sheets" value={totals.cs} />
              </>
            )}

            <StatCard label="OVR médio" value={totals.avgOverall} />
            <StatCard
              label="Melhor mês (OVR)"
              value={totals.bestMonth ? `${totals.bestMonth.overall} • ${monthLabel(totals.bestMonth.monthId)}` : "—"}
            />
          </div>

          {/* Evolução OVR */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
            <div className="p-6">
              <div className="text-xs tracking-[0.28em] text-white/55">EVOLUÇÃO</div>
              <div className="text-white font-extrabold text-2xl mt-1">OVR por mês</div>

              {months.length === 0 ? (
                <div className="mt-4 text-white/60">Ainda não há meses cadastrados para sua carreira.</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {months
                    .slice()
                    .reverse()
                    .map((m) => {
                      const pct = Math.max(6, Math.round((m.overall / maxOverall) * 100))
                      return (
                        <div key={m.monthId} className="flex items-center gap-3">
                          <div className="w-20 text-white/70 text-sm font-bold">{monthLabel(m.monthId)}</div>
                          <div className="flex-1">
                            <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
                              <div className="h-full bg-emerald-400/70" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="w-12 text-right font-extrabold text-emerald-200">{m.overall}</div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Lista detalhada por mês */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
            <div className="p-6">
              <div className="text-xs tracking-[0.28em] text-white/55">DETALHES</div>
              <div className="text-white font-extrabold text-2xl mt-1">Carreira mês a mês</div>

              {months.length === 0 ? (
                <div className="mt-4 text-white/60">Sem dados ainda.</div>
              ) : (
                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  {months.map((m) => (
                    <div key={m.monthId} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-extrabold text-lg">{monthLabel(m.monthId)}</div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                          OVR {m.overall}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniStat label="Jogos" value={m.jogos} />
                        <MiniStat label="Gols" value={m.gols} />
                        <MiniStat label="Assist" value={m.assistencias} />

                        {isGK ? (
                          <>
                            <MiniStat label="GS" value={m.gs} />
                            <MiniStat label="CS" value={m.cs} />
                          </>
                        ) : (
                          <MiniStat label="Participações" value={m.gols + m.assistencias} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-white/45 text-sm">
            Dica: mantenha os docs de mês como <span className="font-mono">YYYY-MM</span> (ex:{" "}
            <span className="font-mono">2026-02</span>) que a ordenação fica perfeita.
          </div>
        </div>
      </main>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs tracking-[0.28em] text-white/50 font-bold">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-emerald-200">{String(value)}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] tracking-[0.25em] text-white/50 font-bold">{label}</div>
      <div className="text-white font-extrabold text-lg">{String(value)}</div>
    </div>
  )
}