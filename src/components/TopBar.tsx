"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { getPlayerByEmail, Player } from "@/lib/players"

type Props = {
  title: string
  showPlayerCard?: boolean
}

function initialsFromName(nome?: string) {
  const parts = (nome || "").trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export default function TopBar({ title, showPlayerCard = true }: Props) {
  const router = useRouter()

  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true)

        if (!user?.email) {
          setPlayer(null)
          setLoading(false)
          return
        }

        const p = await getPlayerByEmail(user.email)
        setPlayer(p)
        setLoading(false)
      } catch {
        setPlayer(null)
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const initials = useMemo(() => initialsFromName(player?.nome), [player?.nome])

  async function handleLogout() {
    try {
      setLoggingOut(true)
      await signOut(auth)
      router.push("/login")
    } catch {
      alert("Erro ao sair")
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-[#070d18]/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* título */}
          <div>
            <div className="text-white/60 text-xs tracking-[0.28em] font-bold">
              BABA ELITE
            </div>

            <div className="text-white font-extrabold text-lg">
              {title}
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* card jogador */}
            {showPlayerCard && player && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-[radial-gradient(600px_220px_at_30%_20%,rgba(16,185,129,0.18),transparent_55%)] px-3 py-2">

                {/* foto */}
                <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 bg-black/25">
                  {player.fotoUrl ? (
                    <img
                      src={player.fotoUrl}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-200 font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                {/* nome */}
                <div>
                  <div className="text-white text-sm font-bold">
                    {player.nome}
                  </div>

                  <div className="text-white/50 text-xs">
                    {player.posicao}
                  </div>
                </div>

                {/* OVR */}
                <div className="ml-2 text-right">
                  <div className="text-white/50 text-xs">
                    OVR
                  </div>

                  <div className="text-emerald-400 font-extrabold text-xl">
                    {player.overall}
                  </div>
                </div>

              </div>
            )}

            {/* botão sair */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                px-4 py-2
                rounded-xl
                bg-red-500/10
                border border-red-500/30
                text-red-400
                text-sm font-bold
                hover:bg-red-500/20
                transition
              "
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>

          </div>

        </div>
      </div>
    </header>
  )
}