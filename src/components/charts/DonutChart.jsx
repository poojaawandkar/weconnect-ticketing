import { useState } from 'react'

/*
 * ================================================================
 * DONUT CHART  (plain SVG - no charting library in this project)
 *
 * Same construction as the User dashboard's submodule donut:
 * concentric stroked-circle arcs (strokeDasharray/-offset on one
 * circle is the simplest reliable way to draw an accurate arc), a
 * small gap subtracted from each arc for a 2-3px surface separation
 * between slices, and the total in the middle.
 *
 * Hover (on the ring OR its legend row - same as the Admin
 * workspace's admin/charts/DonutChart.jsx) thickens that slice,
 * dims the others, and swaps the centre readout to that slice's own
 * name/value/share, so every dashboard with a donut behaves the
 * same way.
 *
 * `slices` is [{ name, value, color }] - already ordered and
 * colour-assigned by the caller (colour follows the entity, not its
 * rank). The legend is the dependable identity channel: every slice
 * is direct-labelled there with its own count and share, so the
 * chart never relies on colour alone. Each arc also keeps a native
 * <title> as an accessible fallback.
 * ================================================================
 */

function DonutChart({
  slices,
  size = 168,
  thickness = 26,
  unitLabel = 'Tickets',
  emptyText = 'No tickets in range.',
}) {
  const [hoverName, setHoverName] = useState(null)

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const gap = total > 0 && slices.length > 1 ? 3 : 0

  const active = hoverName != null ? slices.find((s) => s.name === hoverName) : null
  const activePct = active && total ? Math.round((active.value / total) * 100) : 0

  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label={`${unitLabel} distribution, ${total} total`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={thickness}
        />

        {total > 0 &&
          slices.map((slice) => {
            const arcLength = (slice.value / total) * circumference
            const dash = Math.max(arcLength - gap, 0)
            const dashOffset = -cumulative
            cumulative += arcLength
            const isActive = hoverName === slice.name

            return (
              <circle
                key={slice.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isActive ? thickness + 4 : thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={dashOffset}
                opacity={hoverName == null || isActive ? 1 : 0.35}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all"
                onMouseEnter={() => setHoverName(slice.name)}
                onMouseLeave={() => setHoverName(null)}
              >
                <title>{`${slice.name}: ${slice.value} (${
                  total ? Math.round((slice.value / total) * 100) : 0
                }%)`}</title>
              </circle>
            )
          })}

        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-slate-900 text-[24px] font-semibold"
        >
          {active ? active.value : total}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          className="fill-slate-400 text-[9px] font-medium uppercase tracking-wide"
        >
          {active
            ? `${active.name} · ${activePct}%`
            : total === 1
              ? unitLabel.replace(/s$/, '')
              : unitLabel}
        </text>
      </svg>

      <ul className="w-full min-w-0 space-y-2">
        {slices.length === 0 && (
          <li className="text-xs text-slate-400">{emptyText}</li>
        )}

        {slices.map((slice) => (
          <li
            key={slice.name}
            onMouseEnter={() => setHoverName(slice.name)}
            onMouseLeave={() => setHoverName(null)}
            className={`flex items-center gap-2.5 rounded-md px-1.5 py-1 transition ${
              hoverName === slice.name ? 'bg-slate-100' : ''
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">
              {slice.name}
            </span>
            <span className="shrink-0 text-xs font-semibold text-slate-800">
              {slice.value}
            </span>
            <span className="w-10 shrink-0 text-right text-[10px] text-slate-400">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DonutChart
