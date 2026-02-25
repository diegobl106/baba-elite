"use client"

export type TabItem = { key: string; label: string }

export default function Tabs({
  items,
  activeKey,
  onChange,
}: {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}) {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-1 flex gap-1">
      {items.map((it) => {
        const active = it.key === activeKey
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`flex-1 rounded-2xl py-3 text-sm font-extrabold tracking-wide ${
              active
                ? "bg-slate-950/60 border border-slate-700/60 text-emerald-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}