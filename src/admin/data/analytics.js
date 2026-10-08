/*
 * ================================================================
 * ADMIN ANALYTICS - PURE SELECTORS
 *
 * Every function here is `(tickets, options) => shape`. No state,
 * no rendering, no data source - the Admin pages call these on a
 * filtered ticket list. Swap the mock dataset for the Frappe
 * Analytics API and these keep working unchanged.
 * ================================================================
 */

import { OPEN_STATUS_GROUPS } from './dimensions'

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

/* ---------- small math helpers -------------------------------- */

export function avg(nums) {
  const v = nums.filter((n) => n != null && !Number.isNaN(n))
  if (!v.length) return 0
  return v.reduce((s, n) => s + n, 0) / v.length
}

export function median(nums) {
  const v = nums.filter((n) => n != null && !Number.isNaN(n)).sort((a, b) => a - b)
  if (!v.length) return 0
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

export function fmtHours(h) {
  if (h == null || Number.isNaN(h)) return '—'
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 48) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function fmtPct(x) {
  return `${Math.round(x)}%`
}

const isOpen = (t) => OPEN_STATUS_GROUPS.includes(t.statusGroup)
const isDone = (t) => t.statusGroup === 'Resolved' || t.statusGroup === 'Closed'

/* ---------- time bucketing ------------------------------------ */

function startOfWeek(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay())
  return x
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function bucketMeta(date, granularity) {
  const d = new Date(date)
  if (granularity === 'day') {
    d.setHours(0, 0, 0, 0)
    return {
      key: d.toISOString().slice(0, 10),
      date: d,
      label: `${d.getDate()} ${MON[d.getMonth()]}`,
      fullLabel: `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`,
    }
  }
  if (granularity === 'week') {
    const s = startOfWeek(d)
    const e = new Date(s)
    e.setDate(e.getDate() + 6)
    return {
      key: s.toISOString().slice(0, 10),
      date: s,
      label: `${s.getDate()} ${MON[s.getMonth()]}`,
      fullLabel: `${s.getDate()} ${MON[s.getMonth()]} – ${e.getDate()} ${MON[e.getMonth()]} ${e.getFullYear()}`,
    }
  }
  const s = new Date(d.getFullYear(), d.getMonth(), 1)
  return {
    key: `${s.getFullYear()}-${s.getMonth()}`,
    date: s,
    label: MON[s.getMonth()],
    fullLabel: `${MON[s.getMonth()]} ${s.getFullYear()}`,
  }
}

function stepDate(d, granularity) {
  const x = new Date(d)
  if (granularity === 'day') x.setDate(x.getDate() + 1)
  else if (granularity === 'week') x.setDate(x.getDate() + 7)
  else x.setMonth(x.getMonth() + 1)
  return x
}

export function enumerateBuckets(tickets, granularity, now = new Date()) {
  if (!tickets.length) return []
  const min = tickets.reduce((m, t) => Math.min(m, +t.createdAt), Infinity)
  let cursor = bucketMeta(new Date(min), granularity).date
  const end = bucketMeta(now, granularity).date
  const out = []
  let guard = 0
  while (cursor <= end && guard < 400) {
    out.push(bucketMeta(cursor, granularity))
    cursor = stepDate(cursor, granularity)
    guard += 1
  }
  return out
}

/* ---------- KPIs --------------------------------------------- */

// Coarse status buckets an executive reads by.
const inGroup = (t, ...groups) => groups.includes(t.statusGroup)

export function kpis(tickets, now = new Date()) {
  const total = tickets.length
  const open = tickets.filter((t) => inGroup(t, 'Open', 'Reopened'))
  const inProgress = tickets.filter((t) => inGroup(t, 'In Progress', 'Awaiting User'))
  const resolved = tickets.filter((t) => inGroup(t, 'Resolved', 'Closed'))
  const done = tickets.filter(isDone)
  const openAll = tickets.filter(isOpen)
  const aged = openAll.filter((t) => (now - t.createdAt) / DAY > 2)
  const resolutionRate = total ? (done.length / total) * 100 : 0
  const avgResolution = avg(tickets.map((t) => t.timeToResolution))
  const pendingApproval = tickets.filter((t) => t.statusGroup === 'Pending Approval').length

  return {
    total,
    open: open.length,
    inProgress: inProgress.length,
    resolved: resolved.length,
    aged: aged.length,
    resolutionRate,
    avgResolutionHours: avgResolution,
    pendingApproval,
  }
}

/* ---------- volume & trend ---------------------------------- */

export function issueTrend(tickets, granularity) {
  const buckets = enumerateBuckets(tickets, granularity)
  return buckets.map((b) => ({
    ...b,
    count: tickets.filter((t) => bucketMeta(t.createdAt, granularity).key === b.key).length,
  }))
}

/* ---------- region ---------------------------------------- */

export function regionHealth(tickets, { regions = [], now = new Date() } = {}) {
  return regions.map((region) => {
    const rows = tickets.filter((t) => t.region === region)
    const open = rows.filter(isOpen)
    const aged = open.filter((t) => (now - t.createdAt) / DAY > 2)
    const done = rows.filter(isDone)
    return {
      region,
      volume: rows.length,
      open: open.length,
      resolved: done.length,
      aged: aged.length,
      agedPct: open.length ? (aged.length / open.length) * 100 : 0,
      resolutionRate: rows.length ? (done.length / rows.length) * 100 : 0,
      avgResolutionHours: avg(rows.map((t) => t.timeToResolution)),
    }
  }).sort((a, b) => b.volume - a.volume)
}

/* ---------- center --------------------------------------- */

/*
 * Per-center totals, highest volume first. `region` (optional)
 * restricts to the centers of one region; otherwise every center
 * that has at least one ticket is returned.
 */
export function centerHealth(tickets, { region, centersByRegion = {}, allCenters = [] } = {}) {
  const centers = region && region !== 'All' ? centersByRegion[region] || [] : allCenters
  const regionOf = (center) =>
    Object.keys(centersByRegion).find((r) => centersByRegion[r].includes(center)) || '—'

  return centers
    .map((center) => {
      const rows = tickets.filter((t) => t.center === center)
      const open = rows.filter(isOpen)
      const done = rows.filter(isDone)
      return {
        center,
        region: regionOf(center),
        volume: rows.length,
        open: open.length,
        resolved: done.length,
        resolutionRate: rows.length ? (done.length / rows.length) * 100 : 0,
      }
    })
    .filter((c) => c.volume > 0 || (region && region !== 'All'))
    .sort((a, b) => b.volume - a.volume)
}

/* ---------- module ---------------------------------------- */

export function ranking(tickets, keyFn, { now = new Date(), splitAt } = {}) {
  const cut = splitAt || new Date(now.getTime() - 30 * DAY)
  const map = new Map()
  tickets.forEach((t) => {
    const k = keyFn(t)
    if (!k) return
    const cur = map.get(k) || { name: k, count: 0, recent: 0, prior: 0 }
    cur.count += 1
    if (+t.createdAt >= +cut) cur.recent += 1
    else cur.prior += 1
    map.set(k, cur)
  })
  const total = tickets.length || 1
  return [...map.values()]
    .map((x) => ({
      ...x,
      share: (x.count / total) * 100,
      trendDelta: x.prior ? ((x.recent - x.prior) / x.prior) * 100 : x.recent ? 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export function moduleRanking(tickets, opts) {
  return ranking(tickets, (t) => t.module, opts)
}
export function subModuleRanking(tickets, opts) {
  return ranking(tickets, (t) => t.subModule, opts)
}
/*
 * Ticket count per reported issue type - replaces the old status
 * donut on the Overview tab. `issueTheme` is the real Ticket's
 * `issue_type` (see mapAdminTicket in admin/data/mockTickets.js) -
 * an explicit "Unspecified" fallback keeps tickets with no issue type
 * set (now the norm at raise time - see RaiseTicket.jsx and
 * weconnect_ticketing.api.create_ticket, which no longer collects it)
 * visible as their own bucket instead of silently dropped by
 * ranking()'s falsy-key skip.
 */
export function issueTypeRanking(tickets, opts) {
  return ranking(tickets, (t) => t.issueTheme || 'Unspecified', opts)
}

/* ---------- support performance ------------------------- */

export function supportPerformance(tickets, now = new Date()) {
  const metric = (fn) => {
    const vals = tickets.map(fn).filter((n) => n != null && !Number.isNaN(n))
    return { avg: avg(vals), median: median(vals), n: vals.length }
  }
  const done = tickets.filter(isDone)
  const reopened = tickets.filter((t) => t.reopened > 0).length
  const aged = tickets.filter(isOpen).filter((t) => (now - t.createdAt) / DAY > 2).length

  return {
    timeToStart: metric((t) => t.timeToStart),
    timeToFirstResponse: metric((t) => t.timeToFirstResponse),
    timeToResolution: metric((t) => t.timeToResolution),
    activeHandling: metric((t) => t.activeHandling),
    awaitingUser: metric((t) => (t.awaitingUserHours ? t.awaitingUserHours : null)),
    approvalWait: metric((t) => t.approvalWaitHours),
    reopenRate: done.length ? (reopened / done.length) * 100 : 0,
    reopenedCount: reopened,
    agedBacklog: aged,
  }
}

export function supportTeamComparison(tickets, now = new Date()) {
  const teams = [...new Set(tickets.map((t) => t.supportTeam))]
  return teams.map((team) => {
    const rows = tickets.filter((t) => t.supportTeam === team)
    const done = rows.filter(isDone)
    const reopened = rows.filter((t) => t.reopened > 0).length
    return {
      team,
      volume: rows.length,
      avgStartHours: avg(rows.map((t) => t.timeToStart)),
      avgResponseHours: avg(rows.map((t) => t.timeToFirstResponse)),
      avgResolutionHours: avg(rows.map((t) => t.timeToResolution)),
      medianResolutionHours: median(rows.map((t) => t.timeToResolution)),
      reopenRate: done.length ? (reopened / done.length) * 100 : 0,
      aged: rows.filter(isOpen).filter((t) => (now - t.createdAt) / DAY > 2).length,
    }
  }).sort((a, b) => b.volume - a.volume)
}

/*
 * Headline resolution-time numbers for the Support Performance
 * tab: average, median, fastest and slowest (hours).
 */
export function resolutionStats(tickets) {
  const vals = tickets.map((t) => t.timeToResolution).filter((n) => n != null && !Number.isNaN(n))
  return {
    n: vals.length,
    avg: avg(vals),
    median: median(vals),
    fastest: vals.length ? Math.min(...vals) : null,
    slowest: vals.length ? Math.max(...vals) : null,
  }
}

export function resolutionTimeTrend(tickets, granularity) {
  const buckets = enumerateBuckets(tickets, granularity)
  return buckets.map((b) => {
    const inBucket = tickets.filter(
      (t) => t.resolvedAt && bucketMeta(t.resolvedAt, granularity).key === b.key
    )
    return {
      ...b,
      avg: avg(inBucket.map((t) => t.timeToResolution)),
      median: median(inBucket.map((t) => t.timeToResolution)),
    }
  })
}

/* ---------- approvals --------------------------------- */

export function approvalPipeline(tickets) {
  const withApproval = tickets.filter((t) => t.approval)
  const by = (s) => withApproval.filter((t) => t.approval.status === s)
  const pending = by('Pending')
  return {
    sent: withApproval.length,
    pending: pending.length,
    approved: by('Approved').length,
    rejected: by('Rejected').length,
    regionalHeadPending: pending.filter((t) => t.approval.type === 'Regional Head').length,
    programHeadPending: pending.filter((t) => t.approval.type === 'Program Head').length,
    avgApprovalHours: avg(
      withApproval
        .filter((t) => t.approval.decidedAt)
        .map((t) => (t.approval.decidedAt - t.approval.requestedAt) / HOUR)
    ),
    rows: withApproval,
  }
}
