"use client"

import { useState } from "react"
import { uploadToCloudinary } from "@/lib/cloudinary"

type Props = {
  nome: string
  fotoUrl?: string | null
  onUploaded: (url: string) => Promise<void> | void
  size?: number // px
}

export default function AvatarUploader({
  nome,
  fotoUrl,
  onUploaded,
  size = 96,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  const shownUrl = localUrl || fotoUrl || null
  const initial = (nome?.trim()?.[0] ?? "?").toUpperCase()

  async function onPick(file: File | null) {
    if (!file) return

    // preview rápido
    setLocalUrl(URL.createObjectURL(file))

    try {
      setLoading(true)
      const url = await uploadToCloudinary(file)
      await onUploaded(url)
      setLocalUrl(url)
    } catch (e: any) {
      alert(e?.message ?? "Erro ao enviar foto")
      setLocalUrl(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <label
        className="relative overflow-hidden cursor-pointer select-none"
        style={{
          width: size,
          height: size,
          borderRadius: 18,
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={loading}
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        <div className="w-full h-full bg-white/5 border border-white/10 flex items-center justify-center">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownUrl}
              alt={nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-extrabold text-white/70">
              {initial}
            </span>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-xs font-bold text-white">Enviando...</div>
          </div>
        )}
      </label>

      <div className="text-xs text-white/50">
        {loading ? "Fazendo upload..." : "Clique para trocar"}
      </div>
    </div>
  )
}