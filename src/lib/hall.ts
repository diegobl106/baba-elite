// src/lib/hall.ts
import { Player, listPlayersByName } from "@/lib/players"
import { listMonths, MonthStats } from "@/lib/career"

export type Category =
  | "mvp"
  | "artilheiro"
  | "garcom"
  | "goleiro"
  | "defensor"
  | "mais_jogos"

export type HallRecord = {
  category: Category
  label: string
  statLabel: string
  value: number
  monthId: string // YYYY-MM
  player: Player
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

function catMeta(cat: Category) {
  switch (cat) {
    case "mvp":
      return { label: "MVP (Recorde)", statLabel: "OVR" }
    case "artilheiro":
      return { label: "Artilheiro (Recorde)", statLabel: "GOLS" }
    case "garcom":
      return { label: "Garçom (Recorde)", statLabel: "ASSIST" }
    case "goleiro":
      return { label: "Goleiro (Recorde)", statLabel: "OVR" }
    case "defensor":
      return { label: "Defensor (Recorde)", statLabel: "OVR" }
    case "mais_jogos":
      return { label: "Mais Jogos (Recorde)", statLabel: "JOGOS" }
  }
}

function valueFor(cat: Category, m: MonthStats) {
  switch (cat) {
    case "mvp":
    case "goleiro":
    case "defensor":
      return Number(m.overall || 0)
    case "artilheiro":
      return Number(m.gols || 0)
    case "garcom":
      return Number(m.assistencias || 0)
    case "mais_jogos":
      return Number(m.jogos || 0)
  }
}

function better(a: { value: number; ovr: number }, b: { value: number; ovr: number }) {
  // maior value ganha; se empatar, maior overall (do mês) desempata
  if (b.value !== a.value) return b.value > a.value
  return b.ovr > a.ovr
}

/**
 * Calcula os recordes históricos automaticamente.
 * Lê todos os players e todos os meses (subcoleção months) e pega o maior valor por categoria.
 */
export async function computeHallRecords(): Promise<HallRecord[]> {
  const players = await listPlayersByName()

  const cats: Category[] = [
    "mvp",
    "artilheiro",
    "garcom",
    "goleiro",
    "defensor",
    "mais_jogos",
  ]

  // guarda o melhor de cada categoria
  const best: Record<
    Category,
    | {
        value: number
        monthId: string
        player: Player
        ovr: number
      }
    | null
  > = {
    mvp: null,
    artilheiro: null,
    garcom: null,
    goleiro: null,
    defensor: null,
    mais_jogos: null,
  }

  for (const p of players) {
    const months = await listMonths(p.id) // lê players/{id}/months/*
    if (!months || months.length === 0) continue

    for (const m of months) {
      for (const cat of cats) {
        if (cat === "goleiro" && !isGoalkeeper(p)) continue
        if (cat === "defensor" && !isDefender(p)) continue

        const value = valueFor(cat, m)
        const ovr = Number(m.overall || 0)

        const current = best[cat]
        if (!current) {
          best[cat] = { value, monthId: m.monthId, player: p, ovr }
          continue
        }

        if (better({ value: current.value, ovr: current.ovr }, { value, ovr })) {
          best[cat] = { value, monthId: m.monthId, player: p, ovr }
        }
      }
    }
  }

  // transforma em array ordenado padrão
  return (Object.keys(best) as Category[])
    .map((cat) => {
      const b = best[cat]
      if (!b) return null

      const meta = catMeta(cat)
      return {
        category: cat,
        label: meta.label,
        statLabel: meta.statLabel,
        value: b.value,
        monthId: b.monthId,
        player: b.player,
      } as HallRecord
    })
    .filter(Boolean) as HallRecord[]
}