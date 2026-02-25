"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import BottomNav from "@/components/BottomNav"
import { useAuth } from "@/components/AuthProvider"
import {
  createPlayer,
  deletePlayer,
  getPlayerByEmail,
  listPlayersByName,
  Player,
  PlayerInput,
  updatePlayer,
} from "@/lib/players"
import { listMonths, MonthStats, upsertMonthStats, deleteMonthStats } from "@/lib/career"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase()
}

function isAdminEmail(email?: string | null) {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").trim()
  if (!raw) return false
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
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

function monthLabel(ym: string) {
  const [y, m] = (ym || "").split("-")
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const idx = Math.max(0, Math.min(11, Number(m) - 1))
  if (!y || !m) return ym
  return `${names[idx]}/${y}`
}

function todayMonthId() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function toNum(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim()
  const uploadPreset = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "").trim()

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary não configurado. Falta CLOUD_NAME ou UPLOAD_PRESET no .env.")
  }

  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Cloudinary error:", data)
    throw new Error(data?.error?.message || "Falha ao enviar imagem.")
  }

  return data.secure_url as string
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const admin = useMemo(() => isAdminEmail(user?.email), [user?.email])

  // Home Jogador
  const [player, setPlayer] = useState<Player | null>(null)
  const [loadingPlayer, setLoadingPlayer] = useState(true)

  // upload foto (jogador)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  // Painel ADM
  const [players, setPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const [selectedId, setSelectedId] = useState<string>("")
  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedId) || null,
    [players, selectedId]
  )

  const [edit, setEdit] = useState<any>({
    nome: "",
    email: "",
    posicao: "",
    caracteristica: "",
    overall: 0,
    jogos: 0,
    vitorias: 0, // ✅ NOVO
    gols: 0,
    assistencias: 0,
  })

  // Lançamento mensal (subcollection months)
  const [monthId, setMonthId] = useState<string>(todayMonthId())
  const [monthOverall, setMonthOverall] = useState<number>(0)
  const [monthJogos, setMonthJogos] = useState<number>(0)
  const [monthGols, setMonthGols] = useState<number>(0)
  const [monthAssist, setMonthAssist] = useState<number>(0)

  const [months, setMonths] = useState<MonthStats[]>([])
  const [loadingMonths, setLoadingMonths] = useState(false)

  async function reloadPlayers() {
    setLoadingPlayers(true)
    try {
      const list = await listPlayersByName()
      setPlayers(list)
      if (selectedId && !list.some((p) => p.id === selectedId)) {
        setSelectedId("")
      }
    } finally {
      setLoadingPlayers(false)
    }
  }

  async function reloadMonths(playerId: string) {
    setLoadingMonths(true)
    try {
      const ms = await listMonths(playerId)
      setMonths(ms)
    } finally {
      setLoadingMonths(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      if (authLoading) return
      if (!user?.email) {
        setPlayer(null)
        setLoadingPlayer(false)
        return
      }

      if (admin) {
        setPlayer(null)
        setLoadingPlayer(false)
        await reloadPlayers()
        return
      }

      setLoadingPlayer(true)
      try {
        const p = await getPlayerByEmail(normalizeEmail(user.email))
        setPlayer(p)
      } finally {
        setLoadingPlayer(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email, admin])

  useEffect(() => {
    if (!admin) return
    if (!selectedPlayer) {
      setEdit({
        nome: "",
        email: "",
        posicao: "",
        caracteristica: "",
        overall: 0,
        jogos: 0,
        vitorias: 0, // ✅ NOVO
        gols: 0,
        assistencias: 0,
      })
      setMonths([])
      return
    }

    setEdit({
      nome: selectedPlayer.nome || "",
      email: selectedPlayer.email || "",
      posicao: selectedPlayer.posicao || "",
      caracteristica: (selectedPlayer as any).caracteristica || "",
      overall: toNum(selectedPlayer.overall),
      jogos: toNum(selectedPlayer.jogos),
      vitorias: toNum((selectedPlayer as any).vitorias), // ✅ NOVO
      gols: toNum(selectedPlayer.gols),
      assistencias: toNum(selectedPlayer.assistencias),
    })

    reloadMonths(selectedPlayer.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, selectedId])

  async function handleCreatePlayer() {
    try {
      if (!admin) return

      const payload: any = {
        ...edit,
        email: normalizeEmail(edit.email),
        overall: toNum(edit.overall),
        jogos: toNum(edit.jogos),
        vitorias: toNum(edit.vitorias), // ✅ NOVO
        gols: toNum(edit.gols),
        assistencias: toNum(edit.assistencias),
      }

      if (!payload.nome.trim()) return alert("Digite o nome do jogador.")
      if (!payload.email.trim()) return alert("Digite o email do jogador.")

      const id = await createPlayer(payload as PlayerInput)
      alert("✅ Jogador criado!")
      await reloadPlayers()
      setSelectedId(id)
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "❌ Erro ao criar jogador. Veja o console.")
    }
  }

  async function handleUpdatePlayer() {
    try {
      if (!admin) return
      if (!selectedPlayer) return alert("Selecione um jogador primeiro.")

      const payload: any = {
        ...edit,
        email: normalizeEmail(edit.email),
        overall: toNum(edit.overall),
        jogos: toNum(edit.jogos),
        vitorias: toNum(edit.vitorias), // ✅ NOVO
        gols: toNum(edit.gols),
        assistencias: toNum(edit.assistencias),
      }

      if (!payload.nome.trim()) return alert("Digite o nome do jogador.")
      if (!payload.email.trim()) return alert("Digite o email do jogador.")

      await updatePlayer(selectedPlayer.id, payload as PlayerInput)
      alert("✅ Jogador atualizado!")
      await reloadPlayers()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "❌ Erro ao atualizar jogador. Veja o console.")
    }
  }

  async function handleDeletePlayer() {
    try {
      if (!admin) return
      if (!selectedPlayer) return alert("Selecione um jogador primeiro.")
      const ok = confirm(`Excluir jogador "${selectedPlayer.nome}"? Isso não tem volta.`)
      if (!ok) return

      await deletePlayer(selectedPlayer.id)
      alert("✅ Jogador excluído!")
      setSelectedId("")
      await reloadPlayers()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "❌ Erro ao excluir jogador. Veja o console.")
    }
  }

  async function handleSaveMonth() {
    try {
      if (!admin) return
      if (!selectedPlayer) return alert("Selecione um jogador para lançar o mês.")
      const mid = (monthId || "").trim()
      if (!/^\d{4}-\d{2}$/.test(mid)) {
        return alert('Mês inválido. Use formato "YYYY-MM" (ex: 2026-02).')
      }

      await upsertMonthStats(selectedPlayer.id, {
        monthId: mid,
        overall: toNum(monthOverall),
        jogos: toNum(monthJogos),
        gols: toNum(monthGols),
        assistencias: toNum(monthAssist),
      })

      alert("✅ Mês salvo!")
      await reloadMonths(selectedPlayer.id)
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "❌ Erro ao salvar mês. Veja o console.")
    }
  }

  async function handleDeleteMonth(mid: string) {
    try {
      if (!admin) return
      if (!selectedPlayer) return
      const ok = confirm(`Excluir mês ${mid} do jogador ${selectedPlayer.nome}?`)
      if (!ok) return
      await deleteMonthStats(selectedPlayer.id, mid)
      await reloadMonths(selectedPlayer.id)
    } catch (e: any) {
      console.error(e)
      alert("❌ Erro ao excluir mês. Veja o console.")
    }
  }

  async function handleChangeFoto(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      if (!player?.id) return alert("Seu player não foi carregado ainda.")

      setUploadingFoto(true)

      const url = await uploadImageToCloudinary(file)

      await updateDoc(doc(db, "players", player.id), {
        fotoUrl: url,
      })

      setPlayer((prev: any) => (prev ? { ...prev, fotoUrl: url } : prev))
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "❌ Não consegui trocar a foto. Veja o console.")
    } finally {
      setUploadingFoto(false)
      e.target.value = ""
    }
  }

  if (authLoading) {
    return (
      <>
        <TopBar title="Home" />
        <main className="p-6 text-white">
          <div className="text-slate-300">Carregando sessão...</div>
        </main>
      </>
    )
  }

  if (admin) {
    return (
      <>
        <TopBar title="Painel do ADM" />

        <main className="p-6 text-white pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-emerald-300/70 tracking-[0.35em] font-bold text-xs">BABA ELITE</div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">PAINEL ADM</h1>
              <div className="text-white/55 mt-2">
                Aqui você cadastra jogadores, edita e lança estatísticas por mês.
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
              <section className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs tracking-[0.28em] text-white/55">JOGADORES</div>
                    <div className="text-2xl font-extrabold mt-1">Lista</div>
                  </div>

                  <button
                    onClick={reloadPlayers}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-black/20 text-white/80 hover:text-white"
                  >
                    Atualizar
                  </button>
                </div>

                {loadingPlayers ? (
                  <div className="mt-4 text-slate-300">Carregando jogadores...</div>
                ) : players.length === 0 ? (
                  <div className="mt-4 text-slate-300">Nenhum jogador cadastrado ainda.</div>
                ) : (
                  <div className="mt-4 space-y-2 max-h-[520px] overflow-auto pr-1">
                    {players.map((p: any) => {
                      const active = p.id === selectedId
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={[
                            "w-full text-left rounded-2xl border p-4",
                            active
                              ? "border-emerald-400/30 bg-emerald-500/10"
                              : "border-white/10 bg-black/15 hover:bg-black/25",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-extrabold">{p.nome}</div>
                            <div className="text-emerald-300 font-extrabold">OVR {p.overall ?? 0}</div>
                          </div>
                          <div className="text-white/55 text-sm mt-1">
                            {p.posicao || "—"} • {p.email || "—"}
                          </div>
                          <div className="text-white/45 text-xs mt-1">
                            {p.jogos} jogos • {p.vitorias ?? 0} vitórias • {p.gols} gols • {p.assistencias} assist
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur p-6">
                <div className="text-xs tracking-[0.28em] text-white/55">EDITOR</div>
                <div className="text-2xl font-extrabold mt-1">
                  {selectedPlayer ? `Editando: ${selectedPlayer.nome}` : "Cadastrar novo jogador"}
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  <Field label="Nome" value={edit.nome} onChange={(v) => setEdit((s: any) => ({ ...s, nome: v }))} />
                  <Field
                    label="Email"
                    value={edit.email}
                    onChange={(v) => setEdit((s: any) => ({ ...s, email: v }))}
                    placeholder="ex: jogador@gmail.com"
                  />
                  <Field
                    label="Posição (GOL/ZAG/MEI/ATA)"
                    value={edit.posicao}
                    onChange={(v) => setEdit((s: any) => ({ ...s, posicao: v }))}
                    placeholder="MEI"
                  />
                  <Field
                    label="Característica"
                    value={edit.caracteristica}
                    onChange={(v) => setEdit((s: any) => ({ ...s, caracteristica: v }))}
                    placeholder="Armador / Xerife / Fazedor de gols..."
                  />

                  <NumField label="Overall" value={edit.overall} onChange={(n) => setEdit((s: any) => ({ ...s, overall: n }))} />
                  <NumField label="Jogos" value={edit.jogos} onChange={(n) => setEdit((s: any) => ({ ...s, jogos: n }))} />
                  <NumField label="Vitórias" value={edit.vitorias ?? 0} onChange={(n) => setEdit((s: any) => ({ ...s, vitorias: n }))} />
                  <NumField label="Gols" value={edit.gols} onChange={(n) => setEdit((s: any) => ({ ...s, gols: n }))} />
                  <NumField
                    label="Assistências"
                    value={edit.assistencias}
                    onChange={(n) => setEdit((s: any) => ({ ...s, assistencias: n }))}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={handleCreatePlayer}
                    className="px-5 py-3 rounded-2xl font-extrabold border border-emerald-400/30 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25"
                  >
                    ➕ Criar jogador
                  </button>

                  <button
                    onClick={handleUpdatePlayer}
                    disabled={!selectedPlayer}
                    className={[
                      "px-5 py-3 rounded-2xl font-extrabold border",
                      selectedPlayer
                        ? "border-white/10 bg-black/20 text-white/85 hover:bg-black/30"
                        : "border-white/10 bg-black/10 text-white/35 cursor-not-allowed",
                    ].join(" ")}
                  >
                    💾 Salvar alterações
                  </button>

                  <button
                    onClick={handleDeletePlayer}
                    disabled={!selectedPlayer}
                    className={[
                      "px-5 py-3 rounded-2xl font-extrabold border",
                      selectedPlayer
                        ? "border-red-400/30 bg-red-500/15 text-red-200 hover:bg-red-500/20"
                        : "border-white/10 bg-black/10 text-white/35 cursor-not-allowed",
                    ].join(" ")}
                  >
                    🗑️ Excluir
                  </button>
                </div>

                {/* Lançar mês */}
                <div className="mt-8 rounded-3xl border border-white/10 bg-black/15 p-5">
                  <div className="text-xs tracking-[0.28em] text-white/55">LANÇAR MÊS (CARREIRA)</div>
                  <div className="text-xl font-extrabold mt-1">Estatísticas do mês</div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <Field
                      label='Mês (YYYY-MM)'
                      value={monthId}
                      onChange={(v) => setMonthId(v)}
                      placeholder="2026-02"
                    />
                    <NumField label="Overall do mês" value={monthOverall} onChange={setMonthOverall} />
                    <NumField label="Jogos" value={monthJogos} onChange={setMonthJogos} />
                    <NumField label="Gols" value={monthGols} onChange={setMonthGols} />
                    <NumField label="Assistências" value={monthAssist} onChange={setMonthAssist} />
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={handleSaveMonth}
                      disabled={!selectedPlayer}
                      className={[
                        "px-5 py-3 rounded-2xl font-extrabold border",
                        selectedPlayer
                          ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25"
                          : "border-white/10 bg-black/10 text-white/35 cursor-not-allowed",
                      ].join(" ")}
                    >
                      ✅ Salvar mês
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="text-white/70 font-bold">Meses lançados</div>

                    {loadingMonths ? (
                      <div className="text-slate-300 mt-2">Carregando meses...</div>
                    ) : months.length === 0 ? (
                      <div className="text-slate-300 mt-2">Nenhum mês lançado ainda.</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {months.map((m) => (
                          <div
                            key={m.monthId}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-extrabold">{monthLabel(m.monthId)}</div>
                              <div className="text-white/55 text-sm mt-1">
                                OVR {m.overall} • {m.jogos} jogos • {m.gols} gols • {m.assistencias} assist
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteMonth(m.monthId)}
                              className="px-3 py-2 rounded-xl border border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                            >
                              Excluir
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 text-white/45 text-xs">
                  Dica: “Mês” precisa ser <span className="font-mono">YYYY-MM</span> (ex: 2026-02).
                </div>
              </section>
            </div>
          </div>
        </main>

        <BottomNav />
      </>
    )
  }

  const fotoUrl = (player as any)?.fotoUrl as string | undefined

  return (
    <>
      <TopBar title={player?.nome ? `Home • ${player.nome}` : "Home"} />

      <main className="p-6 text-white pb-24">
        {loadingPlayer ? (
          <div className="text-slate-300">Carregando...</div>
        ) : !player ? (
          <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-xl font-extrabold">Cadastro não encontrado</div>
            <div className="text-white/55 mt-2">
              Não achei seu cadastro na coleção <b>players</b>.
            </div>
            <div className="text-white/45 text-sm mt-3">
              Logado como: <span className="font-mono">{user?.email}</span>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0b1220]/75 backdrop-blur p-6 shadow-[0_20px_90px_rgba(0,0,0,0.55)]">
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.16),transparent_60%)]" />
              <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent_60%)]" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-emerald-400/60 bg-black/25 overflow-hidden shadow-[0_10px_40px_rgba(16,185,129,0.35)] flex items-center justify-center">
                        {fotoUrl ? (
                          <img src={fotoUrl} alt={player.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-4xl font-extrabold text-emerald-200">
                            {initials(player.nome)}
                          </div>
                        )}
                      </div>

                      <label
                        className={[
                          "absolute -bottom-3 left-1/2 -translate-x-1/2",
                          "px-3 py-1 rounded-full text-xs font-extrabold",
                          "border border-emerald-400/30",
                          "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25",
                          "cursor-pointer select-none",
                          uploadingFoto ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        {uploadingFoto ? "Enviando..." : "Trocar foto"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingFoto}
                          onChange={handleChangeFoto}
                        />
                      </label>
                    </div>

                    <div>
                      <div className="text-white font-extrabold text-2xl">{player.nome}</div>
                      <div className="text-white/55 text-sm mt-1">
                        {player.posicao || "—"} • {(player as any).caracteristica || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white/55 text-xs tracking-[0.25em] font-bold">OVR</div>
                    <div className="text-6xl sm:text-7xl font-extrabold text-emerald-300 leading-none">
                      {player.overall ?? 0}
                    </div>
                  </div>
                </div>

                {/* ✅ agora com vitórias */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Jogos" value={player.jogos ?? 0} />
                  <StatCard label="Vitórias" value={(player as any).vitorias ?? 0} />
                  <StatCard label="Gols" value={player.gols ?? 0} />
                  <StatCard label="Assist" value={player.assistencias ?? 0} />
                </div>

                <div className="mt-5 text-center text-white/40 text-xs">
                  Dica: ao trocar a foto aqui, ela atualiza no Rankings também.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  )
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="text-white/55 text-xs tracking-[0.25em] font-bold">{label}</div>
      <div className="text-white font-extrabold text-2xl mt-1">{String(value)}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <div className="text-white/60 text-xs tracking-[0.25em] font-bold">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-400/30"
      />
    </label>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="block">
      <div className="text-white/60 text-xs tracking-[0.25em] font-bold">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-400/30"
      />
    </label>
  )
}