"use client"

import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { monthLabel, MonthStats } from "@/lib/career"

function GlassCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.12),transparent_60%)]" />

      <div className="relative p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.28em] text-white/55 font-bold">{title}</div>
            {subtitle ? <div className="text-white/80 text-sm mt-1">{subtitle}</div> : null}
          </div>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur px-4 py-3">
      <div className="text-white/70 text-xs font-bold">{label}</div>
      <div className="text-emerald-200 text-lg font-extrabold">{v}</div>
    </div>
  )
}

export function CareerOVRChart({
  months,
  height = 220,
}: {
  months: MonthStats[]
  height?: number
}) {
  const data = (months || [])
    .slice()
    .sort((a, b) => a.monthId.localeCompare(b.monthId))
    .map((m) => ({
      month: monthLabel(m.monthId),
      ovr: m.overall ?? 0,
    }))

  return (
    <GlassCard title="EVOLUÇÃO" subtitle="OVR por mês">
      {data.length === 0 ? (
        <div className="text-white/60">Sem dados ainda.</div>
      ) : (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="ovr"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  )
}