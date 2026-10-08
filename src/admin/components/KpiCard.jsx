import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

/*
 * ================================================================
 * KPI CARD
 *
 * The Admin KPI tile: label, big value, an optional sub-line and
 * an optional delta chip. `emphasis` swaps the plain white surface
 * for a subtle teal gradient - used sparingly, for one headline
 * metric per row only.
 *
 * `tone` ('warning' | 'success' | 'pending') tints the value when
 * the number itself is the signal (e.g. aged tickets).
 * `deltaGood` says whether "up" is good, so the chip colour reads
 * correctly.
 * ================================================================
 */

const TONE = {
  warning: 'text-rose-600',
  success: 'text-emerald-600',
  pending: 'text-amber-600',
}

function KpiCard({ label, value, sub, delta, deltaGood = false, tone, emphasis = false, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  const hasDelta = delta != null && Math.abs(delta) >= 1
  const positive = delta > 0
  const good = positive === deltaGood

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group flex h-full flex-col rounded-2xl border p-4 text-left shadow-sm transition ${
        emphasis ? 'border-teal-200 bg-gradient-to-br from-teal-50 to-white' : 'border-slate-200 bg-white'
      } ${onClick ? 'hover:border-teal-300 hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        {hasDelta && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              good ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(Math.round(delta))}%
          </span>
        )}
      </div>

      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${tone ? TONE[tone] : 'text-slate-900'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </Comp>
  )
}

export default KpiCard
