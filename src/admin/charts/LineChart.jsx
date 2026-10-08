import { useId, useMemo, useState } from 'react'

/*
 * ================================================================
 * LINE / AREA CHART  (plain SVG - no charting library)
 *
 * A calm, "market trend" style line chart: thin non-scaling
 * strokes, an optional soft gradient area under the primary line,
 * a faint baseline grid, HTML axis labels (so nothing distorts)
 * and a hover crosshair + tooltip.
 *
 *   data  = [{ label, <key>: number, ... }]
 *   lines = [{ key, name, color, area? }]
 * ================================================================
 */

const PAD_TOP = 0.12
const PAD_BOTTOM = 0.08

function LineChart({
  data,
  lines,
  height = 200,
  formatValue = (v) => Math.round(v),
  yTicks = 4,
}) {
  const gid = useId().replace(/[:]/g, '')
  const [hover, setHover] = useState(null)

  const { max, paths, areas } = useMemo(() => {
    const allValues = data.flatMap((d) => lines.map((l) => d[l.key] || 0))
    const rawMax = Math.max(...allValues, 1)
    const niceMax = rawMax <= 5 ? 5 : Math.ceil(rawMax / 5) * 5
    const n = data.length

    const xAt = (i) => (n <= 1 ? 500 : (i / (n - 1)) * 1000)
    const yAt = (v) => {
      const t = v / niceMax
      return 1000 * (PAD_TOP + (1 - PAD_TOP - PAD_BOTTOM) * (1 - t))
    }

    const paths = lines.map((l) => ({
      ...l,
      d: data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d[l.key] || 0)}`).join(' '),
    }))

    const areas = lines
      .filter((l) => l.area)
      .map((l) => ({
        ...l,
        d:
          `M ${xAt(0)} ${yAt(0)} ` +
          data.map((d, i) => `L ${xAt(i)} ${yAt(d[l.key] || 0)}`).join(' ') +
          ` L ${xAt(n - 1)} ${yAt(0)} Z`,
      }))

    return { max: niceMax, paths, areas, xAt, yAt }
  }, [data, lines])

  const n = data.length
  const xStep = n <= 16 ? 1 : Math.ceil(n / 12)
  const xLabelIdx = data
    .map((_, i) => i)
    .filter((i) => i % xStep === 0 || i === n - 1)

  const gridVals = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i)

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex flex-col justify-between py-0.5 text-right text-[9px] text-slate-400" style={{ height }}>
          {[...gridVals].reverse().map((v) => (
            <span key={v}>{formatValue(v)}</span>
          ))}
        </div>

        {/* Plot */}
        <div
          className="relative flex-1"
          style={{ height }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
            setHover(Math.round(t * (n - 1)))
          }}
        >
          {/* grid lines */}
          {gridVals.map((v, i) => (
            <div
              key={v}
              className="absolute inset-x-0 border-t border-slate-100"
              style={{ top: `${(PAD_TOP + (1 - PAD_TOP - PAD_BOTTOM) * (1 - i / yTicks)) * 100}%` }}
            />
          ))}

          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              {areas.map((a) => (
                <linearGradient key={a.key} id={`${gid}-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.color} stopOpacity="0.14" />
                  <stop offset="100%" stopColor={a.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>

            {areas.map((a) => (
              <path key={a.key} d={a.d} fill={`url(#${gid}-${a.key})`} stroke="none" />
            ))}

            {paths.map((p) => (
              <path
                key={p.key}
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {hover != null && (
              <line
                x1={n <= 1 ? 500 : (hover / (n - 1)) * 1000}
                x2={n <= 1 ? 500 : (hover / (n - 1)) * 1000}
                y1="0"
                y2="1000"
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* hover markers + tooltip */}
          {hover != null && data[hover] && (
            <>
              {lines.map((l) => {
                const v = data[hover][l.key] || 0
                const topPct = (PAD_TOP + (1 - PAD_TOP - PAD_BOTTOM) * (1 - v / max)) * 100
                const leftPct = n <= 1 ? 50 : (hover / (n - 1)) * 100
                return (
                  <span
                    key={l.key}
                    className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                    style={{ top: `${topPct}%`, left: `${leftPct}%`, backgroundColor: l.color }}
                  />
                )
              })}
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] shadow-lg"
                style={{
                  left: `${Math.min(85, Math.max(15, n <= 1 ? 50 : (hover / (n - 1)) * 100))}%`,
                  top: 4,
                }}
              >
                <p className="font-semibold text-slate-700">{data[hover].fullLabel || data[hover].label}</p>
                {lines.map((l) => (
                  <p key={l.key} className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.name}: <span className="font-semibold text-slate-700">{formatValue(data[hover][l.key] || 0)}</span>
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* X axis */}
      <div className="ml-8 mt-1.5 flex justify-between text-[9px] text-slate-400">
        {xLabelIdx.map((i) => (
          <span key={i}>{data[i]?.label}</span>
        ))}
      </div>

      {/* Legend */}
      {lines.length > 1 && (
        <div className="ml-8 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {lines.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: l.color }} />
              {l.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default LineChart
