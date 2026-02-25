"use client"

import BottomNav from "@/components/BottomNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      {/* FUNDO do (app) (não pode bloquear clique) */}
      <div className="pointer-events-none absolute inset-0 bg-transparent" />

      {/* Conteúdo */}
      <div className="relative z-10 pb-24">{children}</div>

      {/* Navbar */}
      <BottomNav />
    </div>
  )
}