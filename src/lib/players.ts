// src/lib/players.ts
import { db } from "@/lib/firebase"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore"

export type Player = {
  id: string
  nome: string
  email: string
  posicao: string
  caracteristica: string
  overall: number
  jogos: number
  gols: number
  assistencias: number
  fotoUrl?: string
}

export type PlayerInput = Omit<Player, "id">

function toNumber(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function mapDocToPlayer(doc0: any): Player {
  const d = doc0.data() as any
  return {
    id: doc0.id,
    nome: d.nome ?? "",
    email: d.email ?? "",
    posicao: d.posicao ?? "",
    caracteristica: d.caracteristica ?? "",
    overall: toNumber(d.overall),
    jogos: toNumber(d.jogos),
    gols: toNumber(d.gols),
    assistencias: toNumber(d.assistencias),
    fotoUrl: d.fotoUrl ?? "",
  }
}

export async function getPlayerByEmail(email: string): Promise<Player | null> {
  const q = query(
    collection(db, "players"),
    where("email", "==", normalizeEmail(email)),
    limit(1)
  )
  const snap = await getDocs(q)
  const doc0 = snap.docs[0]
  if (!doc0) return null
  return mapDocToPlayer(doc0)
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const ref = doc(db, "players", id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const d = snap.data() as any
  return {
    id: snap.id,
    nome: d.nome ?? "",
    email: d.email ?? "",
    posicao: d.posicao ?? "",
    caracteristica: d.caracteristica ?? "",
    overall: toNumber(d.overall),
    jogos: toNumber(d.jogos),
    gols: toNumber(d.gols),
    assistencias: toNumber(d.assistencias),
    fotoUrl: d.fotoUrl ?? "",
  }
}

export async function listPlayersByOverall(): Promise<Player[]> {
  const q = query(collection(db, "players"), orderBy("overall", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapDocToPlayer(d))
}

export async function listPlayersByName(): Promise<Player[]> {
  const q = query(collection(db, "players"), orderBy("nome", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapDocToPlayer(d))
}

export async function createPlayer(input: PlayerInput): Promise<string> {
  const payload = {
    ...input,
    email: normalizeEmail(input.email),
    overall: toNumber(input.overall),
    jogos: toNumber(input.jogos),
    gols: toNumber(input.gols),
    assistencias: toNumber(input.assistencias),
    fotoUrl: input.fotoUrl ?? "",
  }

  const existing = await getPlayerByEmail(payload.email)
  if (existing) {
    throw new Error("Já existe um jogador com esse email.")
  }

  const ref = await addDoc(collection(db, "players"), payload)
  return ref.id
}

export async function updatePlayer(id: string, input: PlayerInput): Promise<void> {
  const ref = doc(db, "players", id)
  const payload = {
    ...input,
    email: normalizeEmail(input.email),
    overall: toNumber(input.overall),
    jogos: toNumber(input.jogos),
    gols: toNumber(input.gols),
    assistencias: toNumber(input.assistencias),
    fotoUrl: input.fotoUrl ?? "",
  }
  await updateDoc(ref, payload as any)
}

export async function updatePlayerPhoto(id: string, fotoUrl: string): Promise<void> {
  const ref = doc(db, "players", id)
  await updateDoc(ref, { fotoUrl })
}

export async function deletePlayer(id: string): Promise<void> {
  const ref = doc(db, "players", id)
  await deleteDoc(ref)
}