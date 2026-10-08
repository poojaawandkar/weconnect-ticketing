import { useState } from 'react'

/*
 * ================================================================
 * DONUT / PIE CHART  (plain SVG - no charting library)
 *
 * A simple ring of proportional arcs with a legend. Hovering a
 * slice (on the ring OR its legend row) highlights it and swaps
 * the centre readout / summary line to that slice: label, count
 * and share.
 *
 *   slices = [{ label, value, color }]
 * ================================================================
 */

const R = 60
const STROKE = 22
const C = 2 * Math.PI * R

function DonutChart({ slices, centerLabel = 'Total', donut = true, onSliceClick }) {
  const [hover, setHover] = useState(null)

  const data = slices.filter((s) => s.value > 0)
  const total = data.reduce((sum, s) => sum + s.value, 0)

  const arcs = data.map((s, i) => {
    const frac = total ? s.value / total : 0
    const before = data.slice(0, i).reduce((sum, x) => sum + (total ? x.value / total : 0), 0)
    return { ...s, i, dash: frac * C, gap: C - frac * C, offset: -before * C }
  })

  const active = hover != null ? data[hover] : null
  const activePct = active && total ? Math.round((active.value / total) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
          {total === 0 && (
            <circle cx="80" cy="80" r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
          )}
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === a.i ? STROKE + 3 : STROKE}
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={a.offset}
              opacity={hover == null || hover === a.i ? 1 : 0.35}
              className={onSliceClick ? 'cursor-pointer transition-all' : 'transition-all'}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
              onClick={onSliceClick ? () => onSliceClick(a) : undefined}
            />
          ))}
          {donut && <circle cx="80" cy="80" r={R - STROKE / 2 - 2} fill="#fff" />}
        </svg>

        {donut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold tracking-tight text-slate-900">
              {active ? active.value : total}
            </p>
            <p className="max-w-[88px] truncate text-[10px] font-medium text-slate-400">
              {active ? `${active.label} · ${activePct}%` : centerLabel}
            </p>
          </div>
        )}
      </div>

      <div className="w-full">
        <ul className="space-y-1">
          {slices.map((s) => {
            const idx = data.findIndex((d) => d.label === s.label)
            const pct = total ? Math.round((s.value / total) * 100) : 0
            const isActive = hover != null && idx === hover
            return (
              <li
                key={s.label}
                onMouseEnter={() => idx >= 0 && setHover(idx)}
                onMouseLeave={() => setHover(null)}
                onClick={onSliceClick && idx >= 0 ? () => onSliceClick({ ...s }) : undefined}
                className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs transition ${
                  isActive ? 'bg-slate-100' : ''
                } ${onSliceClick ? 'cursor-pointer' : ''}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="truncate text-slate-600">{s.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-slate-400">
                  <span className="font-semibold text-slate-800">{s.value}</span>
                  <span className="ml-1.5">{pct}%</span>
                </span>
              </li>
            )
          })}
        </ul>

        <p className="mt-2 border-t border-slate-100 px-2 pt-2 text-[11px] text-slate-500">
          {active ? (
            <>
              <span className="font-semibold text-slate-700">{active.label}</span>: {active.value} of {total}{' '}
              {centerLabel} ({activePct}%)
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-700">{total}</span> {centerLabel} across {data.length}{' '}
              {data.length === 1 ? 'category' : 'categories'}
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default DonutChart
