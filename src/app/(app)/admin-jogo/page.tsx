"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import { useAuth } from "@/components/AuthProvider"
import Protected from "@/components/Protected"
import { isAdminEmail } from "@/lib/admin"
import { listPlayersForAdmin, PlayerMini } from "@/lib/players_admin"
import { addMatchAndUpdateMonth } from "@/lib/carreira"

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function AdminJogoPage() {
  const { user } = useAuth()

  const [players, setPlayers] = useState<PlayerMini[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const [playerId, setPlayerId] = useState("")
  const [date, setDate] = useState(todayISO())
  const [gols, setGols] = useState<number>(0)
  const [assistencias, setAssistencias] = useState<number>(0)
  const [vitoria, setVitoria] = useState<boolean>(false)
  const [cs, setCs] = useState<number>(0)
  const [gs, setGs] = useState<number>(0)

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const adminOk = useMemo(() => isAdminEmail(user?.email), [user?.email])

  useEffect(() => {
    if (!adminOk) return
    const run = async () => {
      setLoadingPlayers(true)
      try {
        const list = await listPlayersForAdmin()
        setPlayers(list)
        if (list[0]?.id) setPlayerId(list[0].id)
      } finally {
        setLoadingPlayers(false)
      }
    }
    run()
  }, [adminOk])

  async function onSave() {
    if (!playerId) {
      setMsg("Selecione um jogador.")
      return
    }
    if (!date || date.length !== 10) {
      setMsg("Data inválida (use YYYY-MM-DD).")
      return
    }

    setSaving(true)
    setMsg(null)
    try {
      await addMatchAndUpdateMonth({
        playerId,
        date,
        gols: Number(gols) || 0,
        assistencias: Number(assistencias) || 0,
        vitoria,
        cs: Number(cs) || 0,
        gs: Number(gs) || 0,
      })
      setMsg("✅ Jogo lançado e mês atualizado!")
      // opcional: reset campos
      setGols(0)
      setAssistencias(0)
      setVitoria(false)
      setCs(0)
      setGs(0)
    } catch (e: any) {
      setMsg(`❌ Erro ao salvar: ${e?.message ?? "desconhecido"}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Protected>
      <TopBar title="Admin • Lançar jogo" />

      <main className="p-6 text-white">
        {!adminOk ? (
          <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
            Você não é admin. (email logado: <b>{user?.email ?? "-"}</b>)
          </div>
        ) : (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-4">Lançar jogo do dia</h1>

            {loadingPlayers ? (
              <div className="text-slate-300">Carregando jogadores...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm">Jogador</label>
                    <select
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                    >
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.posicao}) — {p.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm">Data</label>
                    <input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      type="date"
                      className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      Um jogo por dia (matchId = data).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                  <div className="bg-slate-800 rounded-xl p-3">
                    <label className="text-slate-400 text-xs">Gols</label>
                    <input
                      value={gols}
                      onChange={(e) => setGols(Number(e.target.value))}
                      type="number"
                      min={0}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3">
                    <label className="text-slate-400 text-xs">Assist</label>
                    <input
                      value={assistencias}
                      onChange={(e) => setAssistencias(Number(e.target.value))}
                      type="number"
                      min={0}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3">
                    <label className="text-slate-400 text-xs">CS (GK)</label>
                    <input
                      value={cs}
                      onChange={(e) => setCs(Number(e.target.value))}
                      type="number"
                      min={0}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3">
                    <label className="text-slate-400 text-xs">GS (GK)</label>
                    <input
                      value={gs}
                      onChange={(e) => setGs(Number(e.target.value))}
                      type="number"
                      min={0}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        checked={vitoria}
                        onChange={(e) => setVitoria(e.target.checked)}
                        type="checkbox"
                      />
                      Vitória
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar jogo"}
                  </button>

                  {msg && <div className="text-slate-200">{msg}</div>}
                </div>

                <div className="mt-6 text-slate-400 text-sm">
                  Vai salvar em:
                  <div className="mt-1">
                    <b>players/{playerId}/matches/{date}</b> e atualizar{" "}
                    <b>players/{playerId}/months/{date.slice(0, 7)}</b>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </Protected>
  )
}