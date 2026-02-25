"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      router.replace("/home")
    } catch (err: any) {
      alert(err?.message ?? "Erro ao logar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* FUNDO (não pode bloquear clique) */}
      <div className="absolute inset-0 bg-[#070b14] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_40%,rgba(59,130,246,0.10),transparent_45%)]" />

      {/* CONTEÚDO (tem que ficar acima) */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-100 mb-6">Baba Elite</h1>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-3 text-white outline-none focus:border-emerald-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />

            <input
              className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-3 text-white outline-none focus:border-emerald-500"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 py-3 font-semibold text-black"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="w-full text-emerald-400 hover:text-emerald-300 text-sm pt-2"
              onClick={() => router.push("/cadastro")}
            >
              Primeira vez? Cadastre-se
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}