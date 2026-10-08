/*
 * ================================================================
 * TICKET DATE HELPERS
 *
 * The dummy ticket seed stores dates as "DD Mon YYYY" strings
 * (e.g. "25 Aug 2026"). Real Frappe Ticket data will expose proper
 * ISO datetimes - parseTicketDate() already handles both, so the
 * period filtering / trend charts don't need to change when the
 * backend is wired in.
 * ================================================================
 */

const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

export function parseTicketDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const text = String(value).trim()

  // "DD Mon YYYY"
  const parts = text.split(/\s+/)
  if (parts.length === 3 && MONTHS[parts[1]] != null) {
    return new Date(Number(parts[2]), MONTHS[parts[1]], Number(parts[0]))
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/*
 * The period filter shown on every analytics area. Values are the
 * number of days back from "now" a ticket must have been created in
 * to be counted.
 */
export const PERIODS = [
  { key: 'Weekly', label: 'Weekly', days: 7 },
  { key: 'Monthly', label: 'Monthly', days: 31 },
]

export function periodDays(key) {
  return PERIODS.find((p) => p.key === key)?.days ?? 31
}

export function isWithinPeriod(dateValue, periodKey, now = new Date()) {
  const date = parseTicketDate(dateValue)
  if (!date) return true

  const days = periodDays(periodKey)
  const diffDays = (now.getTime() - date.getTime()) / 86_400_000

  // A small negative tolerance keeps "today" in range regardless of
  // timezone rounding.
  return diffDays <= days && diffDays >= -1.5
}

/*
 * True when the given ticket date (an ISO datetime or a
 * "DD Mon YYYY" string) falls on the current calendar day. Used by
 * the Skilling Support dashboard's "Requires Attention" queue,
 * which deliberately shows only tickets raised today - the full
 * actionable backlog lives on the Skilling Tickets page.
 */
export function isToday(dateValue, now = new Date()) {
  const date = parseTicketDate(dateValue)
  if (!date) return false

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function shortDate(dateValue) {
  const date = parseTicketDate(dateValue)
  if (!date) return String(dateValue ?? '')

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

/*
 * Buckets a list of tickets into day-by-day counts for the trend
 * chart, ordered oldest -> newest, limited to the selected period.
 */
export function volumeByDay(tickets, periodKey, dateField = 'createdDate', now = new Date()) {
  const days = periodDays(periodKey)
  const buckets = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - i)
    buckets.push({ date: day, label: shortDate(day), count: 0 })
  }

  tickets.forEach((ticket) => {
    const date = parseTicketDate(ticket[dateField])
    if (!date) return

    const match = buckets.find(
      (bucket) =>
        bucket.date.getFullYear() === date.getFullYear() &&
        bucket.date.getMonth() === date.getMonth() &&
        bucket.date.getDate() === date.getDate()
    )

    if (match) match.count += 1
  })

  // For the weekly view every day is useful; for the monthly view
  // collapse to a readable ~10 point series.
  if (buckets.length <= 10) return buckets

  const step = Math.ceil(buckets.length / 10)
  const collapsed = []

  for (let i = 0; i < buckets.length; i += step) {
    const slice = buckets.slice(i, i + step)
    collapsed.push({
      date: slice[0].date,
      label: slice[0].label,
      count: slice.reduce((sum, b) => sum + b.count, 0),
    })
  }

  return collapsed
}
