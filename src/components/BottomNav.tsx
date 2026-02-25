// src/components/BottomNav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type Item = { href: string; label: string }

const items: Item[] = [
  { href: "/home", label: "Home" },
  { href: "/carreira", label: "Carreira" },
  { href: "/rankings", label: "Rankings" },
  { href: "/selecao", label: "Seleção" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#070b14]/90 backdrop-blur supports-[backdrop-filter]:bg-[#070b14]/70">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-4 py-2">
          {items.map((it) => {
            const active = pathname === it.href

            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "flex flex-col items-center justify-center py-2 rounded-xl text-xs transition-colors",
                  active
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                <span className="font-medium">{it.label}</span>

                <span
                  className={[
                    "mt-1 h-1 w-6 rounded-full transition-all",
                    active
                      ? "bg-emerald-400"
                      : "bg-transparent",
                  ].join(" ")}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}