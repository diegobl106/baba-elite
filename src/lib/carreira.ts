// src/lib/carreira.ts
import { db } from "@/lib/firebase"
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore"

export type AddMatchInput = {
  playerId: string
  date: string // "2026-02-22"
  gols?: number
  assistencias?: number
  vitoria?: boolean
  cs?: number
  gs?: number
}

function getMonthFromDate(date: string) {
  return date.slice(0, 7) // "YYYY-MM"
}

export async function addMatchAndUpdateMonth(input: AddMatchInput) {
  const {
    playerId,
    date,
    gols = 0,
    assistencias = 0,
    vitoria = false,
    cs = 0,
    gs = 0,
  } = input

  const month = getMonthFromDate(date)
  const matchId = date // 1 jogo por dia (se quiser 2 jogos no mesmo dia, a gente muda depois)

  // 1) salva o jogo do dia
  const matchRef = doc(db, "players", playerId, "matches", matchId)
  await setDoc(
    matchRef,
    {
      date,
      month,
      gols,
      assistencias,
      jogos: 1,
      vitoria,
      cs,
      gs,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  // 2) garante doc do mês e incrementa
  const monthRef = doc(db, "players", playerId, "months", month)
  await setDoc(monthRef, { month }, { merge: true })

  await updateDoc(monthRef, {
    jogos: increment(1),
    gols: increment(gols),
    assistencias: increment(assistencias),
    vitorias: increment(vitoria ? 1 : 0),
    cs: increment(cs),
    gs: increment(gs),
    updatedAt: serverTimestamp(),
  })
}