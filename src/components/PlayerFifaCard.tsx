"use client"

import Image from "next/image"
import { Player } from "@/lib/players"

function initials(nome: string) {
  const parts = (nome || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  const a = parts[0]?.[0] ?? ""
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (a + b).toUpperCase()
}

type Props = {
  player: Player & { fotoUrl?: string }
  rank: number
  variant?: "gold" | "green" | "blue" | "silver"
}

const variantStyles = {
  gold: {
    ring: "from-amber-300/40 via-yellow-500/30 to-amber-200/40",
    glow: "bg-[radial-gradient(600px_240px_at_30%_20%,rgba(245,158,11,0.18),transparent_60%)]",
    badge: "bg-amber-400/15 text-amber-300 border-amber-300/20",
  },
  green: {
    ring: "from-emerald-300/35 via-emerald-500/25 to-teal-200/35",
    glow: "bg-[radial-gradient(600px_240px_at_30%_20%,rgba(16,185,129,0.18),transparent_60%)]",
    badge: "bg-emerald-400/15 text-emerald-300 border-emerald-300/20",
  },
  blue: {
    ring: "from-sky-300/35 via-blue-500/25 to-indigo-200/35",
    glow: "bg-[radial-gradient(600px_240px_at_30%_20%,rgba(59,130,246,0.16),transparent_60%)]",
    badge: "bg-sky-400/15 text-sky-300 border-sky-300/20",
  },
  silver: {
    ring: "from-slate-200/30 via-slate-400/20 to-slate-200/30",
    glow: "bg-[radial-gradient(600px_240px_at_30%_20%,rgba(148,163,184,0.14),transparent_60%)]",
    badge: "bg-slate-200/10 text-slate-200 border-white/10",
  },
} as const

export default function PlayerFifaCard({
  player,
  rank,
  variant = "green",
}: Props) {
  const v = variantStyles[variant]
  const fotoUrl = (player as any).fotoUrl as string | undefined

  return (
    <div className="relative">
      {/* borda/anel */}
      <div
        className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${v.ring}`}
        aria-hidden="true"
      />
      <div className="relative rounded-2xl bg-[#0b1220]/90 border border-white/10 overflow-hidden shadow-[0_12px_50px_rgba(0,0,0,0.45)]">
        {/* glow interno */}
        <div className={`absolute inset-0 ${v.glow}`} aria-hidden="true" />
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />

        {/* topo */}
        <div className="relative p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex flex-col leading-none">
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {player.overall}
              </div>
              <div className="text-xs font-semibold text-slate-300 tracking-widest mt-1">
                {player.posicao?.toUpperCase() || "—"}
              </div>
            </div>

            <div className="pt-1">
              <div className="text-white font-bold text-lg leading-tight">
                {player.nome}
              </div>
              <div className="text-slate-300 text-sm mt-1">
                #{rank} • {player.jogos} jogos
              </div>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-full text-xs border ${v.badge}`}
          >
            TOP {rank}
          </div>
        </div>

        {/* corpo (foto + stats) */}
        <div className="relative px-4 pb-4">
          <div className="flex gap-4 items-center">
            {/* foto */}
            <div className="relative w-[92px] h-[108px] rounded-xl overflow-hidden border border-white/10 bg-[#0a1020]">
              {fotoUrl ? (
                <Image
                  src={fotoUrl}
                  alt={player.nome}
                  fill
                  className="object-cover"
                  sizes="92px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-extrabold text-xl">
                    {initials(player.nome)}
                  </div>
                </div>
              )}

              {/* overlay FIFA style */}
              <div
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),transparent_55%)]"
                aria-hidden="true"
              />
            </div>

            {/* stats */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Stat label="GOLS" value={player.gols} />
              <Stat label="ASSIST" value={player.assistencias} />
              <Stat label="JOGOS" value={player.jogos} />
              <Stat label="CARAC" value={player.caracteristica || "—"} text />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  text,
}: {
  label: string
  value: any
  text?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] tracking-widest text-slate-300 font-semibold">
        {label}
      </div>
      <div
        className={`mt-1 ${
          text ? "text-sm" : "text-lg"
        } font-bold text-white truncate`}
        title={String(value ?? "")}
      >
        {value ?? "—"}
      </div>
    </div>
  )
}