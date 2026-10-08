import { useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

import {
  MODULES,
  SUBMODULES_BY_MODULE,
  SUPPORT_TEAMS,
  PRIORITIES,
  STATUS_GROUPS,
  ISSUE_THEMES,
  APPROVAL_TYPES,
} from './dimensions'
import { useRegionDimensionsSync } from './regionDimensions'
import { useAdminTicketsSync } from './mockTickets'

/*
 * ================================================================
 * useAdminFilters
 *
 * One smart global filter area for the Admin workspace. A page
 * lists the `fields` it wants; the hook renders that control bar,
 * keeps the state (with dependent Region→Center and Module→Sub-
 * module resets) and returns the filtered ticket list + the chosen
 * time granularity.
 *
 * The ticket list is the isolated mock dataset (getAdminTickets);
 * swap that call for the Frappe Analytics response and nothing
 * else changes.
 * ================================================================
 */

const DAY = 86_400_000

const SELECT =
  'h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10'

function toInput(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// A labelled <select> - a plain render helper (not a component), so
// this hook file stays hook-only for fast refresh.
function renderSelect(label, value, onChange, options) {
  return (
    <label key={label} className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT} aria-label={label}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  )
}

const DEFAULTS = {
  period: 'this_month',
  region: 'All',
  center: 'All',
  module: 'All',
  subModule: 'All',
  supportTeam: 'All',
  status: 'All',
  priority: 'All',
  theme: 'All',
  approvalType: 'All',
}

export function useAdminFilters({
  fields = [],
  defaultPeriod,
  defaultGranularity = 'week',
  initial = {},
  regionScope = null,
} = {}) {
  const now = useMemo(() => new Date(), [])

  // Real Frappe tickets, kept in sync with the shared fetch in
  // mockTickets.js (a network fetch can't be synchronous the way the
  // old in-memory generator was - this re-renders once real data
  // arrives).
  const liveTickets = useAdminTicketsSync()

  // Real Region/Center master data (see regionDimensions.js) - empty
  // until the fetch resolves, then real "Region"/"Center" DocType
  // names, never a hardcoded list.
  const { regions: REGIONS, centersByRegion: CENTERS_BY_REGION } = useRegionDimensionsSync()

  // currentUser -> assignedRegion(s) -> allowedTickets. When a
  // Regional Head is viewing, `regionScope` is their region list and
  // the whole dataset is narrowed to it up front - not hidden later.
  const scopeKey = regionScope ? regionScope.join('|') : ''
  const allTickets = useMemo(() => {
    return regionScope ? liveTickets.filter((t) => regionScope.includes(t.region)) : liveTickets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, liveTickets])

  const lockedRegion = regionScope && regionScope.length === 1 ? regionScope[0] : null

  const [filters, setFilters] = useState(() => {
    const base = {
      ...DEFAULTS,
      period: defaultPeriod || DEFAULTS.period,
      ...Object.fromEntries(
        Object.entries(initial).filter(([k, v]) => k in DEFAULTS && v)
      ),
    }
    // Clamp any incoming region/center to what this user may see.
    if (lockedRegion) base.region = lockedRegion
    else if (regionScope && !['All', ...regionScope].includes(base.region)) base.region = 'All'
    if (
      base.center !== 'All' &&
      regionScope &&
      !regionScope.some((r) => (CENTERS_BY_REGION[r] || []).includes(base.center))
    ) {
      base.center = 'All'
    }
    return base
  })
  const [from, setFrom] = useState(toInput(new Date(now.getTime() - 90 * DAY)))
  const [to, setTo] = useState(toInput(now))
  const [granularity, setGranularity] = useState(defaultGranularity)

  const set = (key, value) => {
    // A single-region Regional Head cannot change region.
    if (key === 'region' && lockedRegion) return
    setFilters((f) => {
      const next = { ...f, [key]: value }
      if (key === 'region') next.center = 'All'
      if (key === 'module') next.subModule = 'All'
      return next
    })
  }

  const has = (name) => fields.includes(name)

  const rangeMode = fields.includes('dateRange')

  /* ---- period window --------------------------------------- */
  const window = useMemo(() => {
    if (!rangeMode && filters.period === 'this_month') {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
    }
    if (!rangeMode && filters.period === 'last_month') {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1),
      }
    }
    // custom / date-range mode
    return { start: new Date(`${from}T00:00:00`), end: new Date(`${to}T23:59:59`) }
  }, [rangeMode, filters.period, from, to, now])

  /* ---- apply ----------------------------------------------- */

  // Every dimension filter EXCEPT the time window - lets a page
  // compare the current period against the previous one.
  const dimFilteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (filters.region !== 'All' && t.region !== filters.region) return false
      if (filters.center !== 'All' && t.center !== filters.center) return false
      if (filters.module !== 'All' && t.module !== filters.module) return false
      if (filters.subModule !== 'All' && t.subModule !== filters.subModule) return false
      if (filters.supportTeam !== 'All' && t.supportTeam !== filters.supportTeam) return false
      if (filters.status !== 'All' && t.statusGroup !== filters.status) return false
      if (filters.priority !== 'All' && t.priority !== filters.priority) return false
      if (filters.theme !== 'All' && t.issueTheme !== filters.theme) return false
      if (filters.approvalType !== 'All' && t.approval?.type !== filters.approvalType) return false
      return true
    })
  }, [allTickets, filters])

  const usePeriod = fields.includes('period') || fields.includes('dateRange')

  const filteredTickets = useMemo(
    () =>
      usePeriod
        ? dimFilteredTickets.filter((t) => t.createdAt >= window.start && t.createdAt <= window.end)
        : dimFilteredTickets,
    [dimFilteredTickets, window, usePeriod]
  )

  const prevWindow = useMemo(() => {
    const len = window.end - window.start
    return { start: new Date(window.start.getTime() - len), end: window.start }
  }, [window])

  const prevPeriodTickets = useMemo(
    () => dimFilteredTickets.filter((t) => t.createdAt >= prevWindow.start && t.createdAt < prevWindow.end),
    [dimFilteredTickets, prevWindow]
  )

  const centerOptions = ['All', ...(
    filters.region !== 'All'
      ? CENTERS_BY_REGION[filters.region] || []
      : regionScope
        ? regionScope.flatMap((r) => CENTERS_BY_REGION[r] || [])
        : []
  )]
  const subModuleOptions = ['All', ...(filters.module === 'All' ? [] : SUBMODULES_BY_MODULE[filters.module])]

  const controls = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <SlidersHorizontal size={14} className="text-slate-400" />

      {has('period') && (
        <div className="flex items-center gap-1">
          {[
            ['this_month', 'This Month'],
            ['last_month', 'Last Month'],
            ['custom', 'Custom'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => set('period', key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                filters.period === key ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
          {filters.period === 'custom' && (
            <span className="ml-1 flex items-center gap-1">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={SELECT} aria-label="From" />
              <span className="text-slate-300">–</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={SELECT} aria-label="To" />
            </span>
          )}
        </div>
      )}

      {has('granularity') && (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {[['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGranularity(key)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                granularity === key ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {has('dateRange') && (
        <span className="flex items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Range</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={SELECT} aria-label="From" />
          <span className="text-slate-300">–</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={SELECT} aria-label="To" />
        </span>
      )}

      {has('region') && (
        lockedRegion ? (
          <span key="Region" className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Region</span>
            <span className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-600">
              {lockedRegion}
            </span>
          </span>
        ) : (
          renderSelect(
            'Region',
            filters.region,
            (v) => set('region', v),
            regionScope ? ['All', ...regionScope] : ['All', ...REGIONS]
          )
        )
      )}
      {has('center') && renderSelect('Center', filters.center, (v) => set('center', v), centerOptions)}
      {has('module') && renderSelect('Module', filters.module, (v) => set('module', v), ['All', ...MODULES])}
      {has('subModule') && renderSelect('Sub-module', filters.subModule, (v) => set('subModule', v), subModuleOptions)}
      {has('supportTeam') && renderSelect('Team', filters.supportTeam, (v) => set('supportTeam', v), ['All', ...SUPPORT_TEAMS])}
      {has('status') && renderSelect('Status', filters.status, (v) => set('status', v), ['All', ...STATUS_GROUPS])}
      {has('priority') && renderSelect('Priority', filters.priority, (v) => set('priority', v), ['All', ...PRIORITIES])}
      {has('theme') && renderSelect('Theme', filters.theme, (v) => set('theme', v), ['All', ...ISSUE_THEMES])}
      {has('approvalType') && renderSelect('Approval', filters.approvalType, (v) => set('approvalType', v), ['All', ...APPROVAL_TYPES])}
    </div>
  )

  return {
    allTickets,
    filteredTickets,
    dimFilteredTickets,
    prevPeriodTickets,
    filters,
    set,
    granularity,
    setGranularity,
    window,
    controls,
  }
}
