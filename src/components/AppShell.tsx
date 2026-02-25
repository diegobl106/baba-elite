"use client"

import { ReactNode } from "react"

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background layers (NUNCA podem pegar clique) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {/* base */}
        <div className="absolute inset-0 bg-[#070b14]" />
        {/* glow/gradiente leve */}
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.12),transparent_60%)]" />
        {/* vinheta bem sutil (se isso for forte, fica “escuro”) */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}