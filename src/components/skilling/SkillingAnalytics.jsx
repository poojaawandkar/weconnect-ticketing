import { useMemo } from 'react'
import { BarChart3, PieChart } from 'lucide-react'

import DonutChart from '../charts/DonutChart'

/*
 * ================================================================
 * SKILLING ANALYTICS
 *
 * Two visuals, side by side, both fed the same period-scoped
 * ticket set (the page owns the period filter - see usePeriodFilter):
 *
 *   Tickets by Issue Type  vertical bar chart, top 6 reported issue
 *                          types by count + "Other" (issue types are
 *                          a real Frappe DocType, not a small fixed
 *                          list, so this stays readable regardless
 *                          of how many exist - same top-N pattern as
 *                          the sub-module donut below)
 *   Tickets by Sub-module  donut, top 6 + "Other"
 *
 * Both use the same validated categorical palette (dataviz
 * validate_palette.js) - bars keep it as a distinct visual form from
 * the donut even though they now share a colour scheme.
 * ================================================================
 */

const CATEGORICAL = [
  '#0d9488', // teal-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#7c3aed', // violet-600
]
const NEUTRAL = '#64748b' // slate-500 - a deliberate non-hue for "Other"
const TOP_N = 6

function SkillingAnalytics({ periodTickets, label = 'all time' }) {
  const issueTypeBars = useMemo(() => {
    const counts = {}
    periodTickets.forEach((t) => {
      const key = t.issueType || 'Unspecified'
      counts[key] = (counts[key] || 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const otherCount = sorted.slice(TOP_N).reduce((sum, [, count]) => sum + count, 0)

    const rows = sorted.slice(0, TOP_N).map(([name, count], index) => ({
      key: name,
      label: name,
      count,
      color: CATEGORICAL[index % CATEGORICAL.length],
    }))

    if (otherCount > 0) {
      rows.push({ key: 'Other', label: 'Other', count: otherCount, color: NEUTRAL })
    }

    return { rows, max: Math.max(...rows.map((r) => r.count), 1) }
  }, [periodTickets])

  const subModuleSlices = useMemo(() => {
    const counts = {}
    periodTickets.forEach((t) => {
      const key = t.subModule || 'Unspecified'
      counts[key] = (counts[key] || 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const otherCount = sorted.slice(6).reduce((sum, [, count]) => sum + count, 0)

    const slices = sorted.slice(0, 6).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORICAL[index % CATEGORICAL.length],
    }))

    if (otherCount > 0) {
      slices.push({ name: 'Other', value: otherCount, color: NEUTRAL })
    }

    return slices
  }, [periodTickets])

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

      {/* Tickets by Issue Type - vertical bars */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tickets by Issue Type</p>
            <p className="mt-1 text-xs text-slate-400">Reported issue type · {label}</p>
          </div>
          <BarChart3 size={16} className="text-slate-300" />
        </div>

        {issueTypeBars.rows.length === 0 ? (
          <div className="mt-7 flex h-44 items-center justify-center">
            <p className="text-xs text-slate-400">No tickets in this period.</p>
          </div>
        ) : (
          <div className="mt-7 flex h-44 items-end gap-3 border-b border-l border-slate-100 px-2 pb-0 pt-5">
            {issueTypeBars.rows.map((row) => (
              <div
                key={row.key}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                title={`${row.label}: ${row.count}`}
              >
                <span className="text-[10px] font-semibold text-slate-500">
                  {row.count || ''}
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-md transition group-hover:opacity-80"
                  style={{
                    backgroundColor: row.color,
                    height: `${Math.max(
                      (row.count / issueTypeBars.max) * 100,
                      row.count ? 6 : 2
                    )}%`,
                  }}
                />
                <span className="line-clamp-2 h-6 text-center text-[8px] leading-tight text-slate-400">
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tickets by Sub-module - donut */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tickets by Sub-module</p>
            <p className="mt-1 text-xs text-slate-400">Where the load sits · {label}</p>
          </div>
          <PieChart size={16} className="text-slate-300" />
        </div>

        <div className="mt-6">
          <DonutChart slices={subModuleSlices} />
        </div>
      </div>

    </div>
  )
}

export default SkillingAnalytics
