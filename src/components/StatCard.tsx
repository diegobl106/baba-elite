export default function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800/60 p-4 shadow-lg">
      <p className="text-slate-400 text-xs font-bold tracking-wide uppercase">{title}</p>
      <p className="text-3xl font-extrabold text-emerald-400 mt-2">{value}</p>
      {subtitle ? <p className="text-slate-500 text-sm mt-1">{subtitle}</p> : <div className="h-5" />}
    </div>
  )
}