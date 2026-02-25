"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import { useAuth } from "@/components/AuthProvider"
import { isAdminEmail } from "@/lib/admin"
import { db } from "@/lib/firebase"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore"
import { listMonths, upsertMonthStats, deleteMonthStats, MonthStats } from "@/lib/career"

type PlayerRow = {
  id: string
  nome: string
  email: string
  posicao: string
  caracteristica: string
  overall: number
  jogos: number
  gols: number
  assistencias: number
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

async function fetchPlayers(): Promise<PlayerRow[]> {
  const q = query(collection(db, "players"), orderBy("overall", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const x = d.data() as any
    return {
      id: d.id,
      nome: x.nome ?? "",
      email: (x.email ?? "").trim(),
      posicao: x.posicao ?? "",
      caracteristica: x.caracteristica ?? "",
      overall: toNumber(x.overall),
      jogos: toNumber(x.jogos),
      gols: toNumber(x.gols),
      assistencias: toNumber(x.assistencias),
    }
  })
}

export default function AdminPage() {
  const { user } = useAuth()

  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // form jogador
  const [form, setForm] = useState<Omit<PlayerRow, "id">>({
    nome: "",
    email: "",
    posicao: "",
    caracteristica: "",
    overall: 0,
    jogos: 0,
    gols: 0,
    assistencias: 0,
  })

  // carreira por mês (admin manual)
  const [monthId, setMonthId] = useState("") // YYYY-MM
  const [monthOverall, setMonthOverall] = useState(0)
  const [monthJogos, setMonthJogos] = useState(0)
  const [monthGols, setMonthGols] = useState(0)
  const [monthAssists, setMonthAssists] = useState(0)
  const [months, setMonths] = useState<MonthStats[]>([])
  const [monthsLoading, setMonthsLoading] = useState(false)

  const isAdmin = useMemo(() => isAdminEmail(user?.email ?? ""), [user?.email])

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedId) ?? null,
    [players, selectedId]
  )

  async function reload() {
    setLoading(true)
    const list = await fetchPlayers()
    setPlayers(list)
    setLoading(false)
  }

  async function reloadMonths(playerId: string) {
    setMonthsLoading(true)
    const ms = await listMonths(playerId)
    setMonths(ms)
    setMonthsLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedPlayer) return
    // carrega dados do jogador no form
    setForm({
      nome: selectedPlayer.nome,
      email: selectedPlayer.email,
      posicao: selectedPlayer.posicao,
      caracteristica: selectedPlayer.caracteristica,
      overall: selectedPlayer.overall,
      jogos: selectedPlayer.jogos,
      gols: selectedPlayer.gols,
      assistencias: selectedPlayer.assistencias,
    })
    // carrega meses
    reloadMonths(selectedPlayer.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return players
    return players.filter((p) => {
      return (
        p.nome.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.posicao.toLowerCase().includes(s)
      )
    })
  }, [players, search])

  function resetForm() {
    setSelectedId(null)
    setForm({
      nome: "",
      email: "",
      posicao: "",
      caracteristica: "",
      overall: 0,
      jogos: 0,
      gols: 0,
      assistencias: 0,
    })
    setMonths([])
    setMonthId("")
    setMonthOverall(0)
    setMonthJogos(0)
    setMonthGols(0)
    setMonthAssists(0)
  }

  async function handleSavePlayer() {
    const payload = {
      ...form,
      email: form.email.trim(),
      overall: toNumber(form.overall),
      jogos: toNumber(form.jogos),
      gols: toNumber(form.gols),
      assistencias: toNumber(form.assistencias),
    }

    if (!payload.nome || !payload.email) {
      alert("Preencha nome e email.")
      return
    }

    try {
      if (selectedId) {
        await setDoc(doc(db, "players", selectedId), payload, { merge: true })
      } else {
        const ref = await addDoc(collection(db, "players"), payload)
        setSelectedId(ref.id)
      }
      await reload()
      alert("Salvo!")
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar. Veja o console.")
    }
  }

  async function handleDeletePlayer() {
    if (!selectedId) return
    const ok = confirm("Apagar esse jogador? (isso apaga o doc do player)")
    if (!ok) return
    try {
      await deleteDoc(doc(db, "players", selectedId))
      await reload()
      resetForm()
      alert("Apagado!")
    } catch (e) {
      console.error(e)
      alert("Erro ao apagar. Veja o console.")
    }
  }

  async function handleSaveMonth() {
    if (!selectedPlayer) return
    const m = monthId.trim()

    // valida YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(m)) {
      alert("Mês inválido. Use YYYY-MM (ex: 2026-02).")
      return
    }

    try {
      await upsertMonthStats(selectedPlayer.id, m, {
        overall: monthOverall,
        jogos: monthJogos,
        gols: monthGols,
        assistencias: monthAssists,
      })
      await reloadMonths(selectedPlayer.id)
      alert("Mês salvo!")
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar mês. Veja o console.")
    }
  }

  async function handleDeleteMonth(m: string) {
    if (!selectedPlayer) return
    const ok = confirm(`Apagar o mês ${m}?`)
    if (!ok) return
    try {
      await deleteMonthStats(selectedPlayer.id, m)
      await reloadMonths(selectedPlayer.id)
      alert("Mês apagado!")
    } catch (e) {
      console.error(e)
      alert("Erro ao apagar mês. Veja o console.")
    }
  }

  function loadMonthToForm(m: MonthStats) {
    setMonthId(m.monthId)
    setMonthOverall(m.overall)
    setMonthJogos(m.jogos)
    setMonthGols(m.gols)
    setMonthAssists(m.assistencias)
  }

  if (!user) {
    return (
      <>
        <TopBar title="Admin" />
        <main className="p-6 text-white">
          <div className="text-slate-300">Faça login para acessar.</div>
        </main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <TopBar title="Admin" />
        <main className="p-6 text-white">
          <div className="text-slate-300">
            Acesso negado. Seu email não é admin.
            <div className="mt-2 text-slate-400 text-sm">
              Logado como: <b>{user.email}</b>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Admin" />
      <main className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-6">Painel Admin</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
          {/* LEFT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex gap-2">
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="Buscar por nome, email, posição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3"
                onClick={reload}
                title="Recarregar"
              >
                ↻
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 font-semibold"
                onClick={resetForm}
              >
                + Novo
              </button>

              <a
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 font-semibold inline-flex items-center"
                href="/rankings"
              >
                Ver Rankings
              </a>
            </div>

            <div className="mt-4 grid gap-2">
              {loading ? (
                <div className="text-slate-300">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="text-slate-300">Nenhum jogador.</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={[
                      "text-left w-full rounded-2xl border p-4",
                      selectedId === p.id
                        ? "border-emerald-500 bg-slate-950"
                        : "border-slate-800 bg-slate-900 hover:bg-slate-950",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-lg">{p.nome}</div>
                        <div className="text-slate-400 text-sm">{p.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-300 text-sm">{p.posicao}</div>
                        <div className="text-emerald-400 font-bold text-xl">{p.overall}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedId ? "Editar Jogador" : "Cadastrar Jogador"}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Dica: o email do jogador precisa bater com o email do login dele
                  (pra Home puxar o perfil).
                </p>
              </div>

              {selectedId && (
                <button
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 font-semibold"
                  onClick={handleDeletePlayer}
                >
                  Apagar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-slate-300 text-sm">Nome</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.nome}
                  onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Email</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Posição (ex: MEI, ATA)</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.posicao}
                  onChange={(e) => setForm((s) => ({ ...s, posicao: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Característica</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.caracteristica}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, caracteristica: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Overall</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.overall}
                  onChange={(e) => setForm((s) => ({ ...s, overall: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Jogos</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.jogos}
                  onChange={(e) => setForm((s) => ({ ...s, jogos: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Gols</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.gols}
                  onChange={(e) => setForm((s) => ({ ...s, gols: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm">Assistências</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                  value={form.assistencias}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, assistencias: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 py-2 font-bold"
                onClick={handleSavePlayer}
              >
                Salvar
              </button>

              <button
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-5 py-2 font-bold"
                onClick={() => {
                  if (selectedPlayer) {
                    setForm({
                      nome: selectedPlayer.nome,
                      email: selectedPlayer.email,
                      posicao: selectedPlayer.posicao,
                      caracteristica: selectedPlayer.caracteristica,
                      overall: selectedPlayer.overall,
                      jogos: selectedPlayer.jogos,
                      gols: selectedPlayer.gols,
                      assistencias: selectedPlayer.assistencias,
                    })
                  } else {
                    resetForm()
                  }
                }}
              >
                Limpar
              </button>
            </div>

            {/* ====== CARREIRA POR MÊS (MANUAL) ====== */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-xl font-bold">Carreira por mês (manual)</h3>
              {!selectedPlayer ? (
                <p className="text-slate-400 mt-2">Selecione um jogador para editar meses.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 mt-4">
                  {/* lista de meses */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-200">Meses cadastrados</div>
                      <button
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1 text-sm"
                        onClick={() => reloadMonths(selectedPlayer.id)}
                      >
                        Recarregar
                      </button>
                    </div>

                    {monthsLoading ? (
                      <div className="text-slate-300 mt-3">Carregando meses...</div>
                    ) : months.length === 0 ? (
                      <div className="text-slate-400 mt-3">
                        Nenhum mês ainda. Crie um em <b>YYYY-MM</b> (ex: 2026-02).
                      </div>
                    ) : (
                      <div className="grid gap-2 mt-3">
                        {months.map((m) => (
                          <div
                            key={m.monthId}
                            className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3"
                          >
                            <button
                              className="text-left flex-1"
                              onClick={() => loadMonthToForm(m)}
                              title="Carregar no formulário"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-bold">{m.monthId}</div>
                                <div className="text-emerald-400 font-bold">
                                  {m.overall}
                                </div>
                              </div>
                              <div className="text-slate-400 text-sm">
                                {m.jogos} jogos • {m.gols} gols • {m.assistencias} assist
                              </div>
                            </button>

                            <button
                              className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-3 py-2 text-sm font-semibold"
                              onClick={() => handleDeleteMonth(m.monthId)}
                              title="Apagar mês"
                            >
                              Apagar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* form mês */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div className="font-semibold text-slate-200 mb-3">
                      Criar/Atualizar mês
                    </div>

                    <label className="text-slate-300 text-sm">Mês (YYYY-MM)</label>
                    <input
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                      placeholder="2026-02"
                      value={monthId}
                      onChange={(e) => setMonthId(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-slate-300 text-sm">Overall</label>
                        <input
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                          value={monthOverall}
                          onChange={(e) => setMonthOverall(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm">Jogos</label>
                        <input
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                          value={monthJogos}
                          onChange={(e) => setMonthJogos(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm">Gols</label>
                        <input
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                          value={monthGols}
                          onChange={(e) => setMonthGols(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm">Assistências</label>
                        <input
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mt-1 outline-none"
                          value={monthAssists}
                          onChange={(e) => setMonthAssists(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 font-bold"
                        onClick={handleSaveMonth}
                      >
                        Salvar mês
                      </button>

                      <button
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 font-bold"
                        onClick={() => {
                          setMonthId("")
                          setMonthOverall(0)
                          setMonthJogos(0)
                          setMonthGols(0)
                          setMonthAssists(0)
                        }}
                      >
                        Limpar
                      </button>
                    </div>

                    <p className="text-slate-400 text-xs mt-3">
                      Isso cria docs em:{" "}
                      <span className="font-mono">
                        players/{selectedPlayer.id}/months/{`{YYYY-MM}`}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* ====== /CARREIRA ====== */}
          </div>
        </div>
      </main>
    </>
  )
}