import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

/*
 * ================================================================
 * HORIZONTAL RANKING
 *
 * A ranked list of rows with a proportional bar - used instead of
 * a pie/vertical-bar for module hotspots, region/center rankings,
 * theme rankings, etc.
 *
 *   rows = [{ name, value, meta?, delta? }]
 * `meta` is a small right-aligned secondary label; `delta` (a %)
 * shows a subtle up/down trend chip.
 * ================================================================
 */

function RankingBars({ rows, valueLabel = '', color = '#0d9488', onRowClick, max: maxProp }) {
  const max = maxProp || Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="space-y-2.5">
      {rows.length === 0 && <p className="text-xs text-slate-400">No data in range.</p>}

      {rows.map((row, i) => {
        const Row = onRowClick ? 'button' : 'div'
        return (
          <Row
            key={row.name}
            type={onRowClick ? 'button' : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`block w-full text-left ${onRowClick ? 'group' : ''}`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-3 shrink-0 text-[10px] font-semibold text-slate-300">{i + 1}</span>
                <span className={`truncate text-xs font-medium text-slate-700 ${onRowClick ? 'group-hover:text-teal-700' : ''}`}>
                  {row.name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {row.delta != null && Math.abs(row.delta) >= 1 && (
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-medium ${
                      row.delta > 0 ? 'text-rose-500' : 'text-emerald-600'
                    }`}
                  >
                    {row.delta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(Math.round(row.delta))}%
                  </span>
                )}
                {row.meta != null && <span className="text-[10px] text-slate-400">{row.meta}</span>}
                <span className="text-xs font-semibold tabular-nums text-slate-800">
                  {row.value}
                  {valueLabel ? <span className="ml-0.5 text-[10px] font-normal text-slate-400">{valueLabel}</span> : null}
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color || color }}
              />
            </div>
          </Row>
        )
      })}
    </div>
  )
}

export default RankingBars
