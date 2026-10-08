import { useMemo } from 'react'
import { PieChart } from 'lucide-react'

import DonutChart from '../charts/DonutChart'

/*
 * ================================================================
 * SUPPORT ANALYTICS  (WeConnect Support dashboard)
 *
 * The two sub-module donuts, side by side - one for CenterOps, one
 * for Skilling (top 6 + "Other" each). The "Tickets by Issue Type"
 * bar chart lives in IssueTypeBarChart, rendered beside the summary
 * cards.
 *
 * `periodTickets` is already scoped + filtered to the dashboard's
 * period by the caller.
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
const NEUTRAL = '#64748b'

function subModuleSlices(tickets) {
  const counts = {}
  tickets.forEach((t) => {
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

  if (otherCount > 0) slices.push({ name: 'Other', value: otherCount, color: NEUTRAL })
  return slices
}

function SupportAnalytics({ periodTickets, label = 'all time' }) {
  const centerOpsSlices = useMemo(
    () => subModuleSlices(periodTickets.filter((t) => t.module === 'CenterOps')),
    [periodTickets]
  )
  const skillingSlices = useMemo(
    () => subModuleSlices(periodTickets.filter((t) => t.module === 'Skilling')),
    [periodTickets]
  )

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {[
        { title: 'Sub-modules · CenterOps', slices: centerOpsSlices },
        { title: 'Sub-modules · Skilling', slices: skillingSlices },
      ].map((chart) => (
        <div key={chart.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{chart.title}</p>
              <p className="mt-1 text-xs text-slate-400">Where the load sits · {label}</p>
            </div>
            <PieChart size={16} className="text-slate-300" />
          </div>

          <div className="mt-6">
            <DonutChart slices={chart.slices} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SupportAnalytics
