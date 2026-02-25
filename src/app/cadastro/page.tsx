"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CadastroPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const router = useRouter()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Por enquanto é fake, só pra navegar e testar o layout.
    router.push("/home")
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/60 border border-slate-700/40 shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400" />

        <div className="flex flex-col gap-2 pt-4">
          <h1 className="text-3xl font-extrabold text-white">Cadastro</h1>
          <p className="text-slate-300/80">Crie sua conta no Baba Elite</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-slate-300 text-sm font-semibold">NOME</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950/40 border border-slate-700/40 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold">E-MAIL</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 w-full rounded-2xl bg-slate-950/40 border border-slate-700/40 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold">SENHA</label>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl bg-slate-950/40 border border-slate-700/40 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="w-full rounded-2xl py-4 font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
            Criar conta
          </button>

          <p className="text-center text-slate-400">
            Já tem conta?{" "}
            <Link className="text-emerald-400 font-semibold" href="/login">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}