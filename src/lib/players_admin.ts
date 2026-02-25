// src/lib/players_admin.ts
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

export type PlayerMini = {
  id: string
  nome: string
  email: string
  posicao: string
}

export async function listPlayersForAdmin(): Promise<PlayerMini[]> {
  const q = query(collection(db, "players"), orderBy("nome", "asc"))
  const snap = await getDocs(q)

  return snap.docs.map((doc) => {
    const d = doc.data() as any
    return {
      id: doc.id,
      nome: d.nome ?? "",
      email: d.email ?? "",
      posicao: d.posicao ?? "",
    }
  })
}