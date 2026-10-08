import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'

/*
 * ================================================================
 * TICKETS BY ISSUE TYPE  (vertical bar chart)
 *
 * Replaces the previous status breakdown (Open / In Progress /
 * Awaiting User / ...) with a breakdown of the reporter's own
 * `issueType` at raise time - top 6 by count, the rest folded into
 * "Other", same top-N pattern the sub-module donut elsewhere in this
 * app already uses (issue types are a real Frappe DocType, not a
 * small fixed list, so this stays readable regardless of how many
 * exist). Colours are the same validated categorical palette used
 * for that donut (see src/components/skilling/SkillingAnalytics.jsx)
 * - Tailwind's teal/amber/rose/indigo/emerald/violet-600, in fixed
 * order, with slate-500 reserved for "Other".
 *
 * Built as `h-full` with a flex-1 plot area so it can be dropped
 * beside a grid of stat cards and stretch to the same height.
 * ================================================================
 */

const ISSUE_TYPE_COLORS = [
  'bg-teal-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-violet-600',
]
const OTHER_COLOR = 'bg-slate-500'
const TOP_N = 6

function IssueTypeBarChart({ tickets, label = 'all time' }) {
  const { rows, max } = useMemo(() => {
    const counts = {}
    tickets.forEach((t) => {
      const key = t.issueType || 'Unspecified'
      counts[key] = (counts[key] || 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const otherCount = sorted.slice(TOP_N).reduce((sum, [, count]) => sum + count, 0)

    const r = sorted.slice(0, TOP_N).map(([name, count], index) => ({
      key: name,
      label: name,
      count,
      color: ISSUE_TYPE_COLORS[index % ISSUE_TYPE_COLORS.length],
    }))

    if (otherCount > 0) {
      r.push({ key: 'Other', label: 'Other', count: otherCount, color: OTHER_COLOR })
    }

    return { rows: r, max: Math.max(...r.map((x) => x.count), 1) }
  }, [tickets])

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Tickets by Issue Type</p>
          <p className="mt-1 text-xs text-slate-400">Reported issue type · {label}</p>
        </div>
        <BarChart3 size={16} className="text-slate-300" />
      </div>

      {rows.length === 0 ? (
        <div className="mt-7 flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">No tickets in this period.</p>
        </div>
      ) : (
        <div className="mt-7 flex min-h-[11rem] flex-1 items-end gap-3 border-b border-l border-slate-100 px-2 pb-0 pt-5">
          {rows.map((row) => (
            <div
              key={row.key}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${row.label}: ${row.count}`}
            >
              <span className="text-[10px] font-semibold text-slate-500">{row.count || ''}</span>
              <div
                className={`w-full max-w-[44px] rounded-t-md ${row.color} transition group-hover:opacity-80`}
                style={{
                  height: `${Math.max((row.count / max) * 100, row.count ? 6 : 2)}%`,
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
  )
}

export default IssueTypeBarChart
