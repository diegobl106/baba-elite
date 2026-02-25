"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Carregando...
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

// deixa compatível com import default E import nomeado
export default Protected