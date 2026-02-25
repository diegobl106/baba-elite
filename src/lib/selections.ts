// src/lib/selections.ts
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export type SelectionType = "month" | "season"

export type SelectionSlotId =
  | "GOL"
  | "ZAG1"
  | "ZAG2"
  | "MEI1"
  | "MEI2"
  | "ATA"

export type SelectionSlot = {
  slotId: SelectionSlotId
  label: string
  group: "GOL" | "ZAG" | "MEI" | "ATA"
  playerId: string | null
}

export type SelectionDoc = {
  type: SelectionType
  id: string // YYYY-MM (month) | YYYY (season)
  title: string
  formation: string // ex: 3-2-1
  slots: SelectionSlot[]
  updatedAt?: any
  updatedBy?: string
}

export function defaultSlots(): SelectionSlot[] {
  return [
    { slotId: "GOL", label: "Goleiro", group: "GOL", playerId: null },

    { slotId: "ZAG1", label: "Zagueiro", group: "ZAG", playerId: null },
    { slotId: "ZAG2", label: "Zagueiro", group: "ZAG", playerId: null },

    { slotId: "MEI1", label: "Meia", group: "MEI", playerId: null },
    { slotId: "MEI2", label: "Meia", group: "MEI", playerId: null },

    { slotId: "ATA", label: "Atacante", group: "ATA", playerId: null },
  ]
}

export function selectionDocId(type: SelectionType, id: string) {
  return `${type}_${id}`
}

export async function getSelection(type: SelectionType, id: string): Promise<SelectionDoc> {
  const ref = doc(db, "selections", selectionDocId(type, id))
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const title = type === "month" ? `Seleção do Mês (${id})` : `Seleção da Temporada (${id})`
    return {
      type,
      id,
      title,
      formation: "3-2-1",
      slots: defaultSlots(),
    }
  }

  const data = snap.data() as any
  return {
    type: data.type,
    id: data.id,
    title: data.title ?? "",
    formation: data.formation ?? "3-2-1",
    slots: Array.isArray(data.slots) ? data.slots : defaultSlots(),
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy,
  }
}

export async function saveSelection(input: SelectionDoc, updatedByEmail: string) {
  const ref = doc(db, "selections", selectionDocId(input.type, input.id))
  await setDoc(
    ref,
    {
      ...input,
      updatedBy: updatedByEmail || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}