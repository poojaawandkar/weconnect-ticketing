import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  PieChart as PieChartIcon,
  Plus,
  Ticket,
  Clock3,
  TrendingUp,
} from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { useUserTickets } from '../../tickets/useUserTickets'
import { statusStyles } from '../../utils/ticketStyles'
import { currentGreeting } from '../../utils/greeting'

/*
 * ================================================================
 * STATUS GROUPING
 *
 * The real Ticket Workflow has 9 distinct states. The dashboard
 * keeps its original 4-card / 4-bar layout, so those real states
 * are grouped into the 4 buckets that layout already has - nothing
 * here invents a status that doesn't exist in Frappe.
 * ================================================================
 */

const OPEN_STATUSES = ['Open', 'Reopened']
const PROGRESS_STATUSES = [
  'Champion In Progress',
  'WeConnect Support In Progress',
  'Skilling Support In Progress',
  'Awaiting User',
  'Pending Approval',
]

const MODULE_BAR_COLORS = [
  'bg-teal-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-violet-500',
  'bg-slate-400',
]

/*
 * Validated categorical palette (see the dataviz skill's
 * validate_palette.js - passes lightness/chroma/CVD/contrast for a
 * 6-slot categorical set) for the submodule donut. "Other" is a
 * deliberate neutral outside that set, not a 7th hue.
 */
const SUBMODULE_COLORS = [
  '#0d9488', // teal-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#7c3aed', // violet-600
]
const OTHER_SLICE_COLOR = '#64748b' // slate-500

const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function endOfWeek(date) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

function weekKeyOf(date) {
  return startOfWeek(date).toISOString().slice(0, 10)
}

function formatWeekLabel(weekStartIso) {
  const start = new Date(weekStartIso)
  const end = endOfWeek(start)
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
}

function toDateInputValue(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

/*
 * ================================================================
 * DONUT CHART (plain SVG - no charting library in this project)
 *
 * Built as concentric stroked-circle arcs rather than hand-rolled
 * pie paths: strokeDasharray/-offset on a circle is the simplest
 * reliable way to draw an accurate arc, and a small gap subtracted
 * from each arc's length gives the "2px surface gap" separation
 * between slices without drawing a data-colored border.
 *
 * Hover (on the ring OR its legend row, same as the Admin
 * workspace's admin/charts/DonutChart.jsx) thickens that slice,
 * dims the others, and swaps the centre readout to that slice's own
 * name/value/share - so every dashboard with a donut behaves the
 * same way. The legend lives outside this component (in Overview()
 * below, not here), so the hovered slice is lifted to that parent
 * via `hover`/`onHoverChange` instead of local state, keeping the
 * ring and the legend in sync in both directions.
 * ================================================================
 */

function DonutChart({ slices, total, size = 176, thickness = 30, hover, onHoverChange }) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const gap = total > 0 ? 3 : 0

  const active = hover != null ? slices[hover] : null
  const activePct = active && total ? Math.round((active.value / total) * 100) : 0

  let cumulative = 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Submodule distribution donut chart, ${total} tickets total`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={thickness}
      />

      {total > 0 && slices.map((slice, i) => {
        const arcLength = (slice.value / total) * circumference
        const dash = Math.max(arcLength - gap, 0)
        const dashOffset = -cumulative
        cumulative += arcLength
        const isActive = hover === i

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
            opacity={hover == null || isActive ? 1 : 0.35}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all"
            onMouseEnter={() => onHoverChange(i)}
            onMouseLeave={() => onHoverChange(null)}
          />
        )
      })}

      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        className="fill-slate-900 text-[26px] font-semibold"
      >
        {active ? active.value : total}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        className="fill-slate-400 text-[10px] font-medium uppercase tracking-wide"
      >
        {active
          ? `${active.name} · ${activePct}%`
          : total === 1 ? 'Ticket' : 'Tickets'}
      </text>
    </svg>
  )
}

function Overview() {
  const navigate = useNavigate()
  const { displayName } = useAuth()

  const greeting = currentGreeting()
  const { tickets, loading, error } = useUserTickets()

  const recentTickets = useMemo(
    () => tickets.slice(0, 4),
    [tickets]
  )

  const stats = useMemo(() => {
    const total = tickets.length

    const openCount = tickets.filter((t) =>
      OPEN_STATUSES.includes(t.status)
    ).length

    const progressCount = tickets.filter((t) =>
      PROGRESS_STATUSES.includes(t.status)
    ).length

    const awaitingUserCount = tickets.filter(
      (t) => t.status === 'Awaiting User'
    ).length

    const resolvedCount = tickets.filter(
      (t) => t.status === 'Resolved'
    ).length

    const closedCount = tickets.filter(
      (t) => t.status === 'Closed'
    ).length

    const monthStart = startOfMonth()
    const weekStart = startOfWeek(new Date())

    const createdThisMonth = tickets.filter(
      (t) => t.creation && new Date(t.creation) >= monthStart
    ).length

    const resolvedThisWeek = tickets.filter(
      (t) =>
        t.status === 'Resolved' &&
        t.resolvedOn &&
        new Date(t.resolvedOn) >= weekStart
    ).length

    const resolutionBase = resolvedCount + closedCount
    const resolutionRate =
      resolutionBase > 0
        ? Math.round((closedCount / resolutionBase) * 100)
        : null

    return [
      {
        label: 'Total Tickets',
        value: String(total),
        change:
          total === 0
            ? 'No tickets yet'
            : `+${createdThisMonth} this month`,
        icon: Ticket,
        iconBg: 'bg-teal-50',
        iconColor: 'text-teal-700',
      },
      {
        label: 'Open Tickets',
        value: String(openCount + progressCount),
        change:
          awaitingUserCount > 0
            ? `${awaitingUserCount} awaiting your response`
            : 'None awaiting your response',
        icon: Clock3,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
      {
        label: 'Resolved',
        value: String(resolvedCount),
        change:
          resolvedThisWeek > 0
            ? `+${resolvedThisWeek} this week`
            : 'None this week',
        icon: CheckCircle2,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Closed',
        value: String(closedCount),
        change:
          resolutionRate === null
            ? 'No resolved tickets yet'
            : `${resolutionRate}% resolution rate`,
        icon: TrendingUp,
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
      },
    ]
  }, [tickets])

  /* =========================================================
     TICKET ACTIVITY - period filters (corner dropdowns)
  ========================================================= */

  const currentYear = new Date().getFullYear()

  const [periodType, setPeriodType] = useState('all')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  const yearOptions = useMemo(() => {
    const start = 2026
    const end = Math.max(start, currentYear)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentYear])

  const weekOptions = useMemo(() => {
    const keys = new Set()
    tickets.forEach((t) => {
      if (t.creation) keys.add(weekKeyOf(t.creation))
    })
    return Array.from(keys).sort((a, b) => new Date(b) - new Date(a))
  }, [tickets])

  // Sensible default for whichever secondary selector the period
  // type switches to, without ever overriding a choice already made.
  useEffect(() => {
    if (periodType === 'yearly' && selectedYear == null) {
      setSelectedYear(currentYear)
    } else if (periodType === 'monthly' && selectedMonth == null) {
      setSelectedMonth(new Date().getMonth())
    } else if (periodType === 'weekly' && selectedWeek == null) {
      setSelectedWeek(weekOptions[0] || weekKeyOf(new Date()))
    } else if (periodType === 'daily' && selectedDate == null) {
      setSelectedDate(toDateInputValue(new Date()))
    }
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedDate, weekOptions, currentYear])

  const activityTickets = useMemo(() => {
    if (periodType === 'all') return tickets

    return tickets.filter((t) => {
      if (!t.creation) return false
      const created = new Date(t.creation)

      if (periodType === 'yearly') {
        return selectedYear != null && created.getFullYear() === selectedYear
      }
      if (periodType === 'monthly') {
        // Only one year of ticket history typically exists at a
        // time, so "August" means "August of this year".
        return (
          selectedMonth != null &&
          created.getMonth() === selectedMonth &&
          created.getFullYear() === currentYear
        )
      }
      if (periodType === 'weekly') {
        return selectedWeek != null && weekKeyOf(created) === selectedWeek
      }
      if (periodType === 'daily') {
        return selectedDate != null && toDateInputValue(created) === selectedDate
      }
      return true
    })
  }, [tickets, periodType, selectedYear, selectedMonth, selectedWeek, selectedDate, currentYear])

  const activityBars = useMemo(() => {
    const openCount = activityTickets.filter((t) =>
      OPEN_STATUSES.includes(t.status)
    ).length
    const progressCount = activityTickets.filter((t) =>
      PROGRESS_STATUSES.includes(t.status)
    ).length
    const resolvedCount = activityTickets.filter(
      (t) => t.status === 'Resolved'
    ).length
    const closedCount = activityTickets.filter(
      (t) => t.status === 'Closed'
    ).length

    const max = Math.max(openCount, progressCount, resolvedCount, closedCount, 1)

    const heightFor = (value) =>
      value === 0 ? '4%' : `${Math.max(10, Math.round((value / max) * 100))}%`

    return [
      { label: 'Open', value: openCount, height: heightFor(openCount) },
      { label: 'Progress', value: progressCount, height: heightFor(progressCount) },
      { label: 'Resolved', value: resolvedCount, height: heightFor(resolvedCount) },
      { label: 'Closed', value: closedCount, height: heightFor(closedCount) },
    ]
  }, [activityTickets])

  const moduleData = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      const key = ticket.module || 'Other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const total = tickets.length

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        tickets: count,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        bar: MODULE_BAR_COLORS[index % MODULE_BAR_COLORS.length],
      }))
  }, [tickets])

  const mostActiveModule = moduleData[0]?.name || 'None yet'

  /* =========================================================
     SUBMODULE DISTRIBUTION - donut chart
     Top 6 submodules get their own hue (the categorical soft
     cap); anything past that folds into a neutral "Other" slice
     instead of generating a 7th hue.
  ========================================================= */

  const submoduleSlices = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      const key = ticket.subModule || 'Unspecified'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 6)
    const rest = sorted.slice(6)
    const otherCount = rest.reduce((sum, [, count]) => sum + count, 0)

    const slices = top.map(([name, count], index) => ({
      name,
      value: count,
      color: SUBMODULE_COLORS[index % SUBMODULE_COLORS.length],
    }))

    if (otherCount > 0) {
      slices.push({ name: 'Other', value: otherCount, color: OTHER_SLICE_COLOR })
    }

    return slices
  }, [tickets])

  const submoduleTotal = submoduleSlices.reduce((sum, s) => sum + s.value, 0)
  const topSubmodule = submoduleSlices[0]

  // Shared between the donut ring and its legend below, so hovering
  // either one highlights both (same hover behaviour as the Admin
  // workspace's donut charts).
  const [hoveredSlice, setHoveredSlice] = useState(null)

  /* =========================================================
     OPEN TICKET DETAILS
  ========================================================= */

  const openTicket = (ticket) => {
    navigate(`/tickets/${ticket.id}`)
  }

  const selectClass =
    'h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-2.5 pr-7 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10'

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-9">

      {/* Welcome */}

      <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {displayName}
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Here's a quick overview of your support activity.
          </p>

        </div>

        <button
          type="button"
          onClick={() => navigate('/raise-ticket')}
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-medium text-white shadow-sm transition hover:bg-teal-800"
        >

          <Plus size={17} />

          Raise New Ticket

          <ArrowUpRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />

        </button>

      </section>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Statistics + Ticket Activity - 2x2 cards on the left,
          activity graph on the right, stretched to equal height */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-stretch">

        {/* Statistics - 2x2 */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {stats.map((stat) => {

            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-110" />

                <div className="relative">

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-medium text-slate-500">
                        {stat.label}
                      </p>

                      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {loading ? '—' : stat.value}
                      </p>

                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                    >
                      <Icon size={19} />
                    </div>

                  </div>

                  <p className="mt-4 text-[10px] text-slate-400">
                    {loading ? 'Loading...' : stat.change}
                  </p>

                </div>

              </div>
            )
          })}

        </div>

        {/* Ticket Activity */}

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-3">

            <div>

              <p className="text-sm font-semibold text-slate-900">
                Ticket Activity
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Your ticket status overview
              </p>

            </div>

            {/* Corner filters - period type, then whichever
                secondary selector that period needs */}

            <div className="flex flex-wrap items-center gap-2">

              <div className="relative">
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className={selectClass}
                  aria-label="Ticket activity period"
                >
                  <option value="all">All time</option>
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {periodType === 'yearly' && (
                <div className="relative">
                  <select
                    value={selectedYear ?? ''}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={selectClass}
                    aria-label="Select year"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              {periodType === 'monthly' && (
                <div className="relative">
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={selectClass}
                    aria-label="Select month"
                  >
                    {CALENDAR_MONTHS.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              {periodType === 'weekly' && (
                <div className="relative">
                  <select
                    value={selectedWeek ?? ''}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className={selectClass}
                    aria-label="Select week"
                  >
                    {weekOptions.length === 0 && (
                      <option value={selectedWeek ?? ''}>
                        {selectedWeek ? formatWeekLabel(selectedWeek) : 'No data yet'}
                      </option>
                    )}
                    {weekOptions.map((week) => (
                      <option key={week} value={week}>{formatWeekLabel(week)}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              {periodType === 'daily' && (
                <input
                  type="date"
                  value={selectedDate ?? ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                  aria-label="Select date"
                />
              )}

            </div>

          </div>

          {activityTickets.length === 0 && periodType !== 'all' ? (

            <div className="mt-7 flex flex-1 min-h-[13rem] flex-col items-center justify-center gap-1 rounded-xl bg-slate-50/60 text-center">
              <p className="text-sm font-medium text-slate-500">No tickets in this period</p>
              <p className="text-xs text-slate-400">Try a different range from the filters above.</p>
            </div>

          ) : (

            <div className="mt-7 flex flex-1 min-h-[13rem] items-end gap-5 border-b border-l border-slate-100 px-5 pb-0 pt-5">

              {activityBars.map((item) => (

                <div
                  key={item.label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >

                  <span className="text-[10px] font-semibold text-slate-500">
                    {item.value}
                  </span>

                  <div
                    className="w-full max-w-[48px] rounded-t-lg bg-teal-500/90 transition hover:bg-teal-600"
                    style={{
                      height: item.height,
                    }}
                  />

                  <span className="mb-2 text-[9px] text-slate-400">
                    {item.label}
                  </span>

                </div>

              ))}

            </div>
          )}

        </div>

      </section>

      {/* Tickets by Module + Submodule Distribution */}

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Tickets by Module */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>

            <p className="text-sm font-semibold text-slate-900">
              Tickets by Module
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Where your issues are coming from
            </p>

          </div>

          <div className="mt-7 space-y-5">

            {moduleData.length === 0 && (
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : 'No tickets raised yet.'}
              </p>
            )}

            {moduleData.map((module) => (

              <div key={module.name}>

                <div className="mb-2 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span
                      className={`h-2 w-2 rounded-full ${module.bar}`}
                    />

                    <span className="text-xs font-medium text-slate-600">
                      {module.name}
                    </span>

                  </div>

                  <span className="text-xs font-semibold text-slate-800">
                    {module.tickets}
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className={`h-full rounded-full ${module.bar}`}
                    style={{
                      width: `${module.value}%`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

          <div className="mt-7 flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">

            <div className="flex items-center gap-2">

              <FileText
                size={16}
                className="text-teal-700"
              />

              <span className="text-xs text-teal-800">
                Most active module
              </span>

            </div>

            <span className="text-xs font-semibold text-teal-700">
              {mostActiveModule}
            </span>

          </div>

        </div>

        {/* Submodule Distribution (donut) */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>

            <p className="text-sm font-semibold text-slate-900">
              Submodule Distribution
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Where you've faced the most issues
            </p>

          </div>

          {submoduleSlices.length === 0 ? (

            <div className="mt-7 flex h-44 flex-col items-center justify-center gap-2 text-center">
              <PieChartIcon size={22} className="text-slate-300" />
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : 'No tickets raised yet.'}
              </p>
            </div>

          ) : (

            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">

              <div className="shrink-0">
                <DonutChart
                  slices={submoduleSlices}
                  total={submoduleTotal}
                  hover={hoveredSlice}
                  onHoverChange={setHoveredSlice}
                />
              </div>

              {/* Legend - the dependable identity channel; each
                  slice is direct-labeled with its own count and
                  share here rather than crowding the chart. Hovering
                  a row highlights it on the ring too (and vice versa). */}

              <div className="w-full min-w-0 space-y-2.5">

                {submoduleSlices.map((slice, i) => (

                  <div
                    key={slice.name}
                    onMouseEnter={() => setHoveredSlice(i)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center gap-2.5 rounded-md px-1.5 py-1 transition ${
                      hoveredSlice === i ? 'bg-slate-100' : ''
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
                      {submoduleTotal > 0 ? Math.round((slice.value / submoduleTotal) * 100) : 0}%
                    </span>

                  </div>
                ))}

              </div>

            </div>
          )}

          {topSubmodule && (

            <div className="mt-6 flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">

              <div className="flex items-center gap-2">

                <PieChartIcon
                  size={16}
                  className="text-teal-700"
                />

                <span className="text-xs text-teal-800">
                  Most reported submodule
                </span>

              </div>

              <span className="text-xs font-semibold text-teal-700">
                {topSubmodule.name}
              </span>

            </div>
          )}

        </div>

      </section>

      {/* Recent Tickets */}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-semibold text-slate-900">
              Recent Tickets
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Your latest support requests
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-teal-700 transition hover:text-teal-900"
          >

            View all tickets

            <ArrowUpRight size={14} />

          </button>

        </div>

        {recentTickets.length === 0 ? (

          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">

            <p className="text-sm font-medium text-slate-600">
              {loading ? 'Loading your tickets...' : "You haven't raised any tickets yet."}
            </p>

            {!loading && (
              <button
                type="button"
                onClick={() => navigate('/raise-ticket')}
                className="mt-4 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Raise your first ticket
              </button>
            )}

          </div>

        ) : (

          <>

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/60">

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Ticket
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Module
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Issue
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Raised
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentTickets.map((ticket) => {

                    const status = statusStyles[ticket.status] || statusStyles.Open

                    return (
                      <tr
                        key={ticket.id}
                        className="group border-b border-slate-50 transition hover:bg-slate-50/60"
                      >

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() => openTicket(ticket)}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                          >
                            {ticket.id}
                          </button>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-xs font-medium text-slate-700">
                            {ticket.module}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {ticket.subModule}
                          </p>

                        </td>

                        <td className="max-w-[300px] px-5 py-4">

                          <p className="truncate text-xs text-slate-600">
                            {ticket.issue}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${status.background} ${status.text}`}
                          >
                            {ticket.status}
                          </span>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-[10px] text-slate-400">
                          {ticket.date}
                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() => openTicket(ticket)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"
                          >
                            <ArrowUpRight size={15} />
                          </button>

                        </td>

                      </tr>
                    )
                  })}

                </tbody>

              </table>

            </div>

            {/* Mobile */}

            <div className="divide-y divide-slate-100 md:hidden">

              {recentTickets.map((ticket) => {

                const status = statusStyles[ticket.status] || statusStyles.Open

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => openTicket(ticket)}
                    className="block w-full p-4 text-left transition hover:bg-slate-50"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold text-teal-700">
                          {ticket.id}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {ticket.issue}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${status.background} ${status.text}`}
                      >
                        {ticket.status}
                      </span>

                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">

                      <span>
                        {ticket.module} · {ticket.subModule}
                      </span>

                      <span>
                        {ticket.date}
                      </span>

                    </div>

                  </button>
                )
              })}

            </div>

          </>

        )}

      </section>

      <div className="h-8" />

    </div>
  )
}

export default Overview
