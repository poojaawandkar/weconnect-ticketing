import { useCallback, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { parseTicketDate } from '../../utils/ticketDates'

/*
 * ================================================================
 * usePeriodFilter
 *
 * The same corner-dropdown period control the User dashboard's
 * Ticket Activity chart uses - All time / Yearly / Monthly /
 * Weekly / Daily, with the secondary selector each mode needs -
 * packaged so a page can render the control once and reuse the
 * resulting filter across several charts / cards.
 *
 *   const { controls, filter } = usePeriodFilter()
 *   const scoped = filter(tickets)   // ...and render {controls}
 *
 * `dateField` is which ticket field to test (default createdDate).
 * ================================================================
 */

const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const dayMs = 86_400_000

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function weekKeyOf(date) {
  return startOfWeek(date).toISOString().slice(0, 10)
}

function formatWeekLabel(weekStartIso) {
  const start = new Date(weekStartIso)
  const end = new Date(start.getTime() + 6 * dayMs)
  const fmt = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

function toDateInputValue(date) {
  const d = new Date(date)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

const SELECT_CLASS =
  'h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-2.5 pr-7 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10'

export function usePeriodFilter(dateField = 'createdDate') {
  const now = useMemo(() => new Date(), [])
  const currentYear = now.getFullYear()

  const [periodType, setPeriodType] = useState('all')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedWeek, setSelectedWeek] = useState(weekKeyOf(now))
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(now))

  const yearOptions = useMemo(() => {
    const start = 2026
    const end = Math.max(start, currentYear)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentYear])

  const weekOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getTime() - i * 7 * dayMs)
        return weekKeyOf(d)
      }),
    [now]
  )

  const filter = useCallback(
    (tickets = []) => {
      if (periodType === 'all') return tickets

      return tickets.filter((ticket) => {
        const d = parseTicketDate(ticket[dateField])
        if (!d) return false

        if (periodType === 'yearly') return d.getFullYear() === selectedYear
        if (periodType === 'monthly') {
          return d.getMonth() === selectedMonth && d.getFullYear() === currentYear
        }
        if (periodType === 'weekly') return weekKeyOf(d) === selectedWeek
        if (periodType === 'daily') return toDateInputValue(d) === selectedDate
        return true
      })
    },
    [periodType, selectedYear, selectedMonth, selectedWeek, selectedDate, currentYear, dateField]
  )

  const label = useMemo(() => {
    if (periodType === 'all') return 'all time'
    if (periodType === 'yearly') return String(selectedYear)
    if (periodType === 'monthly') return CALENDAR_MONTHS[selectedMonth].toLowerCase()
    if (periodType === 'weekly') return formatWeekLabel(selectedWeek)
    if (periodType === 'daily') return selectedDate
    return ''
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedDate])

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Period"
        >
          <option value="all">All time</option>
          <option value="yearly">Yearly</option>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {periodType === 'yearly' && (
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={SELECT_CLASS}
            aria-label="Select year"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      )}

      {periodType === 'monthly' && (
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className={SELECT_CLASS}
            aria-label="Select month"
          >
            {CALENDAR_MONTHS.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      )}

      {periodType === 'weekly' && (
        <div className="relative">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Select week"
          >
            {weekOptions.map((week) => (
              <option key={week} value={week}>{formatWeekLabel(week)}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      )}

      {periodType === 'daily' && (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
          aria-label="Select date"
        />
      )}
    </div>
  )

  return { controls, filter, label, periodType }
}
