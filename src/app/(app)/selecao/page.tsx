"use client"

import { useEffect, useMemo, useState } from "react"
import TopBar from "@/components/TopBar"
import { listPlayersByOverall, Player } from "@/lib/players"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import {
  getSelection,
  saveSelection,
  SelectionDoc,
  SelectionSlotId,
  SelectionType,
  defaultSlots,
} from "@/lib/selections"

type Mode = "mes" | "temporada"

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

function getSeasonId() {
  return String(new Date().getFullYear())
}

function norm(s: string) {
  return (s || "").trim().toLowerCase()
}

function isGoalkeeper(p: Player) {
  const pos = norm(p.posicao)
  return pos.includes("gol") || pos === "gk"
}

function isDefender(p: Player) {
  const pos = norm(p.posicao)
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

function isMidfielder(p: Player) {
  const pos = norm(p.posicao)
  return pos.includes("mei") || pos.includes("mid") || pos.includes("mc") || pos.includes("cm")
}

function isAttacker(p: Player) {
  const pos = norm(p.posicao)
  return pos.includes("ata") || pos.includes("att") || pos.includes("st") || pos.includes("cf")
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

// ADM via .env: NEXT_PUBLIC_ADMIN_EMAILS="email1@gmail.com,email2@gmail.com"
function isAdminEmail(email?: string | null) {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").trim()
  if (!raw) return false
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

function slotToGridPos(slotId: SelectionSlotId) {
  // grid: 5 colunas, 4 linhas
  // ATA (linha 1), MEI (linha 2), ZAG (linha 3), GOL (linha 4)
  switch (slotId) {
    case "ATA":
      return "col-start-3 row-start-1"

    case "MEI1":
      return "col-start-2 row-start-2"
    case "MEI2":
      return "col-start-4 row-start-2"

    case "ZAG1":
      return "col-start-2 row-start-3"
    case "ZAG2":
      return "col-start-4 row-start-3"

    case "GOL":
      return "col-start-3 row-start-4"
  }
}

export default function SelecaoPage() {
  const monthOptions = useMemo(() => getMonthOptions(12), [])
  const [mode, setMode] = useState<Mode>("mes")
  const [monthId, setMonthId] = useState<string>(monthOptions[0])
  const [seasonId] = useState<string>(getSeasonId())

  const [user, setUser] = useState<User | null>(null)
  const admin = isAdminEmail(user?.email)

  const [players, setPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const [loadingSel, setLoadingSel] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sel, setSel] = useState<SelectionDoc | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoadingPlayers(true)
      const list = await listPlayersByOverall()
      setPlayers(list)
      setLoadingPlayers(false)
    }
    run()
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoadingSel(true)
      const type: SelectionType = mode === "mes" ? "month" : "season"
      const id = mode === "mes" ? monthId : seasonId
      const data = await getSelection(type, id)

      if (!data.slots || data.slots.length === 0) data.slots = defaultSlots()
      setSel(data)
      setLoadingSel(false)
    }
    run()
  }, [mode, monthId, seasonId])

  const playersById = useMemo(() => {
    const map = new Map<string, Player>()
    players.forEach((p) => map.set(p.id, p))
    return map
  }, [players])

  const optionsForGroup = (group: "GOL" | "ZAG" | "MEI" | "ATA") => {
    const base = [...players]
    let filtered = base

    if (group === "GOL") filtered = base.filter(isGoalkeeper)
    if (group === "ZAG") filtered = base.filter(isDefender)
    if (group === "MEI") filtered = base.filter(isMidfielder)
    if (group === "ATA") filtered = base.filter(isAttacker)

    if (filtered.length === 0) filtered = base
    filtered.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    return filtered
  }

  const setSlotPlayer = (slotId: SelectionSlotId, playerId: string | null) => {
    if (!sel) return
    setSel({
      ...sel,
      slots: sel.slots.map((s) => (s.slotId === slotId ? { ...s, playerId } : s)),
    })
  }

  const handleSave = async () => {
    if (!sel) return
    if (!admin) return alert("Apenas o ADM pode salvar a Seleção.")
    setSaving(true)
    try {
      await saveSelection(sel, user?.email || "")
      alert("✅ Seleção salva!")
    } catch (e: any) {
      console.error(e)
      alert("❌ Erro ao salvar. Veja o console.")
    } finally {
      setSaving(false)
    }
  }

  const title =
    mode === "mes" ? `Seleção do Mês • ${MonthLabel(monthId)}` : `Seleção da Temporada • ${seasonId}`

  return (
    <>
      <TopBar title="Seleção" />

      <main className="p-6 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-emerald-300/70 tracking-[0.35em] font-bold text-xs">BABA ELITE</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">SELEÇÃO</h1>
            <div className="text-white/55 mt-2">{title}</div>
          </div>

          {/* Tabs */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-2 flex gap-2 justify-center">
            <button
              onClick={() => setMode("mes")}
              className={[
                "px-5 py-3 rounded-xl font-bold flex items-center gap-2 border",
                mode === "mes"
                  ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                  : "bg-black/10 border-white/10 text-white/70 hover:text-white",
              ].join(" ")}
            >
              🗓️ MÊS
            </button>

            <button
              onClick={() => setMode("temporada")}
              className={[
                "px-5 py-3 rounded-xl font-bold flex items-center gap-2 border",
                mode === "temporada"
                  ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                  : "bg-black/10 border-white/10 text-white/70 hover:text-white",
              ].join(" ")}
            >
              🏆 TEMPORADA
            </button>
          </div>

          {/* seletor de mês */}
          {mode === "mes" && (
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

          <div className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            {/* Campo */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0b1220]/70 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.40)]">
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent_60%)]" />
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.12),transparent_60%)]" />

              <div className="relative p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.28em] text-white/55">FORMAÇÃO</div>
                    <div className="text-white font-extrabold text-2xl">{sel?.formation || "3-2-1"}</div>
                  </div>

                  <div className="px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/10 bg-black/25 text-white/85">
                    {admin ? "ADM • Editável" : "Visualização"}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="text-center text-white/60 text-xs tracking-[0.3em] font-bold">
                    CAMPO (6 JOGADORES)
                  </div>

                  <div className="mt-4 grid grid-cols-5 grid-rows-4 gap-3 sm:gap-4 items-center justify-items-center">
                    {loadingSel ? (
                      <div className="col-span-5 row-span-4 text-center text-slate-300 py-10">
                        Carregando seleção...
                      </div>
                    ) : (
                      (sel?.slots || []).map((slot) => {
                        const p = slot.playerId ? playersById.get(slot.playerId) : null
                        return (
                          <div
                            key={slot.slotId}
                            className={[
                              "w-full max-w-[140px]",
                              slotToGridPos(slot.slotId),
                            ].join(" ")}
                          >
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                              <div className="text-[10px] tracking-[0.25em] text-white/55 font-bold">
                                {slot.slotId}
                              </div>

                              <div className="mt-2 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full border-4 border-emerald-400/60 bg-[#0a1020] overflow-hidden flex items-center justify-center text-emerald-200 font-extrabold">
                                  {p?.fotoUrl ? (
                                    <img src={p.fotoUrl} alt={p.nome} className="w-full h-full object-cover" />
                                  ) : (
                                    initials(p?.nome || "")
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 text-white font-extrabold text-sm line-clamp-1">
                                {p?.nome || "—"}
                              </div>

                              <div className="text-white/55 text-xs">
                                {p ? `${p.posicao || "—"} • OVR ${p.overall ?? 0}` : slot.label}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  {admin && (
                    <button
                      onClick={handleSave}
                      disabled={saving || loadingPlayers}
                      className={[
                        "px-5 py-3 rounded-2xl font-extrabold border",
                        "shadow-[0_10px_30px_rgba(16,185,129,0.18)]",
                        saving
                          ? "bg-black/30 border-white/10 text-white/50 cursor-not-allowed"
                          : "bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25",
                      ].join(" ")}
                    >
                      {saving ? "Salvando..." : "💾 Salvar Seleção"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
              <div className="relative p-6">
                <div className="text-xs tracking-[0.28em] text-white/55">EDITOR</div>
                <div className="text-white font-extrabold text-2xl mt-1">
                  {admin ? "Escolher jogadores" : "Somente visualização"}
                </div>

                {!admin ? (
                  <div className="mt-4 text-white/60">Só o ADM pode editar a seleção.</div>
                ) : loadingPlayers ? (
                  <div className="mt-4 text-slate-300">Carregando jogadores...</div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {(sel?.slots || []).map((slot) => {
                      const opts = optionsForGroup(slot.group)
                      return (
                        <div key={`editor-${slot.slotId}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-white font-extrabold">
                                {slot.slotId} • {slot.label}
                              </div>
                              <div className="text-white/55 text-sm">Grupo: {slot.group}</div>
                            </div>

                            <button
                              onClick={() => setSlotPlayer(slot.slotId, null)}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white"
                            >
                              Limpar
                            </button>
                          </div>

                          <select
                            value={slot.playerId || ""}
                            onChange={(e) => setSlotPlayer(slot.slotId, e.target.value || null)}
                            className="mt-3 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-bold"
                          >
                            <option value="">— Escolher jogador —</option>
                            {opts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} • {p.posicao || "—"} • OVR {p.overall ?? 0}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-6 text-white/45 text-xs">
                  Salva em:{" "}
                  <span className="font-mono">
                    Firestore → selections → {mode === "mes" ? `month_${monthId}` : `season_${seasonId}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-white/45 text-sm">
            Seleção com 6 jogadores: 1 GOL • 2 ZAG • 2 MEI • 1 ATA.
          </div>
        </div>
      </main>
    </>
  )
}