// src/lib/monthRankings.ts
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { Player } from "@/lib/players"

export type MonthPlayerRow = {
  player: Player
  monthId: string // YYYY-MM
  overall: number
  jogos: number
  gols: number
  assistencias: number
}

function toNumber(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function listMonthRows(monthId: string): Promise<MonthPlayerRow[]> {
  const playersSnap = await getDocs(collection(db, "players"))

  const rows: MonthPlayerRow[] = []

  for (const pDoc of playersSnap.docs) {
    const d = pDoc.data() as any

    const player: Player = {
      id: pDoc.id,
      nome: d.nome ?? "",
      email: d.email ?? "",
      posicao: d.posicao ?? "",
      caracteristica: d.caracteristica ?? "",
      overall: toNumber(d.overall),
      jogos: toNumber(d.jogos),
      gols: toNumber(d.gols),
      assistencias: toNumber(d.assistencias),
      fotoUrl: d.fotoUrl ?? "",
    } as any

    const monthRef = doc(db, "players", pDoc.id, "months", monthId)
    const monthSnap = await getDoc(monthRef)

    if (!monthSnap.exists()) continue

    const m = monthSnap.data() as any

    rows.push({
      player,
      monthId,
      overall: toNumber(m.overall),
      jogos: toNumber(m.jogos),
      gols: toNumber(m.gols),
      assistencias: toNumber(m.assistencias),
    })
  }

  return rows
}