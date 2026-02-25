// src/lib/career.ts
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"

export type MonthStats = {
  monthId: string
  overall: number
  jogos: number
  gols: number
  assistencias: number
  gs: number
  cs: number
  updatedAt?: any
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function monthRef(playerId: string, monthId: string) {
  return doc(db, "players", playerId, "months", monthId)
}

function monthsCollection(playerId: string) {
  return collection(db, "players", playerId, "months")
}

//
// LISTAR MESES
//
export async function listMonths(playerId: string): Promise<MonthStats[]> {
  const q = query(
    monthsCollection(playerId),
    orderBy("__name__", "desc") // ordena por YYYY-MM
  )

  const snap = await getDocs(q)

  return snap.docs.map((docu) => {
    const d = docu.data() as any

    return {
      monthId: docu.id,
      overall: toNumber(d.overall),
      jogos: toNumber(d.jogos),
      gols: toNumber(d.gols),
      assistencias: toNumber(d.assistencias),
      gs: toNumber(d.gs),
      cs: toNumber(d.cs),
      updatedAt: d.updatedAt,
    }
  })
}

//
// PEGAR UM MÊS
//
export async function getMonthStats(playerId: string, monthId: string): Promise<MonthStats | null> {
  const ref = monthRef(playerId, monthId)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  const d = snap.data() as any

  return {
    monthId: snap.id,
    overall: toNumber(d.overall),
    jogos: toNumber(d.jogos),
    gols: toNumber(d.gols),
    assistencias: toNumber(d.assistencias),
    gs: toNumber(d.gs),
    cs: toNumber(d.cs),
    updatedAt: d.updatedAt,
  }
}

//
// CRIAR OU ATUALIZAR MÊS
//
export async function upsertMonthStats(
  playerId: string,
  input: Partial<MonthStats> & { monthId: string }
) {
  const ref = monthRef(playerId, input.monthId)

  await setDoc(
    ref,
    {
      overall: toNumber(input.overall),
      jogos: toNumber(input.jogos),
      gols: toNumber(input.gols),
      assistencias: toNumber(input.assistencias),
      gs: toNumber(input.gs),
      cs: toNumber(input.cs),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

//
// DELETAR MÊS
//
export async function deleteMonthStats(playerId: string, monthId: string) {
  const ref = monthRef(playerId, monthId)
  await deleteDoc(ref)
}

//
// LABEL BONITA
//
export function monthLabel(ym: string) {
  const [y, m] = (ym || "").split("-")

  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const idx = Math.max(0, Math.min(11, Number(m) - 1))

  return `${names[idx]}/${y}`
}