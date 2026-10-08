import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Download, FileText, Loader2, Sparkles } from 'lucide-react'

import { useAdminTicketsSync, useAdminTicketsStatus } from '../../admin/data/mockTickets'
import {
  MODULES,
  SUPPORT_TEAMS,
} from '../../admin/data/dimensions'
import { useRegionDimensionsSync } from '../../admin/data/regionDimensions'
import { kpis, fmtHours, fmtPct } from '../../admin/data/analytics'
import { useRegionScope } from '../../admin/data/regionScope'
import { generateReport } from '../../api/reports'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import Panel from '../../admin/components/Panel'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const YEARS = [2025, 2026]
const REPORT_TYPES = ['Monthly', 'Weekly', 'Daily']

const DOC_SECTIONS = [
  'Executive Summary', 'Status Overview', 'Ageing Backlog', 'Issue Trend',
  'Region Performance', 'Center Highlights', 'Module / Sub-module Hotspots',
  'Recurring Issue Themes', 'Support Performance', 'Approval Status',
  'Key Trends', 'Areas Requiring Attention', 'Recommended Actions',
]

const SELECT = 'h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function weeksInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate() > 28 ? 5 : 4
}

function Reports() {
  const now = new Date()
  const scope = useRegionScope()
  // Real Region/Center master data (see regionDimensions.js) - empty
  // until the fetch resolves, then real "Region"/"Center" DocType
  // names, never a hardcoded list.
  const { regions: REGIONS, centersByRegion: CENTERS_BY_REGION } = useRegionDimensionsSync()
  // Real, live Frappe tickets (weconnect_ticketing.api.get_admin_tickets).
  // useAdminTicketsSync() is what actually TRIGGERS that fetch and
  // re-renders this page once it resolves - every other Admin page
  // gets this for free through useAdminFilters(), but Reports.jsx has
  // its own Monthly/Weekly/Daily period model instead of that hook's
  // this_month/last_month/custom one, so it needs the ticket fetch
  // wired up directly here (a plain getAdminTickets() read, with no
  // subscription, would silently stay an empty [] forever if this is
  // the first Admin page opened - never mock/hardcoded data, just an
  // unstarted fetch).
  const liveTickets = useAdminTicketsSync()
  const { loading: ticketsLoading, error: ticketsError } = useAdminTicketsStatus()
  const [type, setType] = useState('Monthly')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [week, setWeek] = useState(1)
  const [date, setDate] = useState(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10))
  const [f, setF] = useState({ region: 'All', center: 'All', module: 'All', supportTeam: 'All' })
  const [phase, setPhase] = useState('idle') // idle | preview | generating | ready
  // The real .docx from weconnect_ticketing.api.generate_report,
  // fetched once on "Generate DOC" and held here so "Download DOC"
  // is an instant local save - not a second network round trip.
  const [report, setReport] = useState(null) // { blob, filename } | null
  const [genError, setGenError] = useState('')

  const reset = (fn) => (v) => { fn(v); setPhase('idle'); setReport(null); setGenError('') }
  const setFilter = (k, v) => {
    setF((c) => ({ ...c, [k]: v, ...(k === 'region' ? { center: 'All' } : {}) }))
    setPhase('idle')
    setReport(null)
    setGenError('')
  }

  const win = useMemo(() => {
    if (type === 'Monthly') return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1), label: `${MONTHS[month]} ${year}` }
    if (type === 'Weekly') {
      const s = (week - 1) * 7 + 1
      const e = Math.min(week * 7, new Date(year, month + 1, 0).getDate())
      return { start: new Date(year, month, s), end: new Date(year, month, e + 1), label: `${MONTHS[month]} ${year} · Week ${week}` }
    }
    const d = new Date(`${date}T00:00:00`)
    return { start: d, end: new Date(d.getTime() + 86400000), label: date }
  }, [type, year, month, week, date])

  // A Regional Head's report is always locked to their region(s) -
  // there is no Region selector and no way to widen it.
  const regionScope = scope.regions
  const allowedCenters = regionScope
    ? regionScope.flatMap((r) => CENTERS_BY_REGION[r] || [])
    : null

  const scoped = useMemo(
    () => liveTickets.filter((t) => {
      if (t.createdAt < win.start || t.createdAt >= win.end) return false
      if (regionScope && !regionScope.includes(t.region)) return false
      if (!regionScope && f.region !== 'All' && t.region !== f.region) return false
      if (f.center !== 'All' && t.center !== f.center) return false
      if (f.module !== 'All' && t.module !== f.module) return false
      if (f.supportTeam !== 'All' && t.supportTeam !== f.supportTeam) return false
      return true
    }),
    [liveTickets, win, f, regionScope]
  )
  const k = useMemo(() => kpis(scoped), [scoped])

  const reportScopeLabel = regionScope
    ? scope.single
      ? `Report scope: ${regionScope[0]}`
      : 'Report scope: Assigned regions'
    : null

  const scopeLabel =
    [regionScope ? null : f.region, f.center, f.module, f.supportTeam]
      .filter((v) => v && v !== 'All')
      .join(' · ') || (regionScope ? '' : 'All regions & modules')

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-7 lg:px-9">
      <AdminPageHeader title="Reports" question="Generate a shareable DOC report for any period and slice." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Report type */}
        <Panel title="Report Type" bodyClass="mt-4">
          <div className="grid grid-cols-3 gap-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => { setType(rt); setPhase('idle'); setReport(null); setGenError('') }}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                  type === rt ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {rt}
              </button>
            ))}
          </div>
        </Panel>

        {/* Period */}
        <Panel title="Period" bodyClass="mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {type !== 'Daily' && (
              <>
                <Field label="Month">
                  <select className={SELECT} value={month} onChange={(e) => reset(setMonth)(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Year">
                  <select className={SELECT} value={year} onChange={(e) => reset(setYear)(Number(e.target.value))}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
              </>
            )}
            {type === 'Weekly' && (
              <Field label="Week">
                <select className={SELECT} value={week} onChange={(e) => reset(setWeek)(Number(e.target.value))}>
                  {Array.from({ length: weeksInMonth(year, month) }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
                </select>
              </Field>
            )}
            {type === 'Daily' && (
              <Field label="Date">
                <input type="date" className={SELECT} value={date} onChange={(e) => reset(setDate)(e.target.value)} />
              </Field>
            )}
          </div>
        </Panel>

        {/* Filters */}
        <Panel
          title="Filters"
          subtitle={reportScopeLabel || 'Optional'}
          bodyClass="mt-4"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {!regionScope && (
              <Field label="Region">
                <select className={SELECT} value={f.region} onChange={(e) => setFilter('region', e.target.value)}>
                  {['All', ...REGIONS].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            )}
            <Field label="Center">
              <select className={SELECT} value={f.center} onChange={(e) => setFilter('center', e.target.value)}>
                {['All', ...(regionScope ? allowedCenters : f.region === 'All' ? [] : CENTERS_BY_REGION[f.region])].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Module">
              <select className={SELECT} value={f.module} onChange={(e) => setFilter('module', e.target.value)}>
                {['All', ...MODULES].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Support Team">
              <select className={SELECT} value={f.supportTeam} onChange={(e) => setFilter('supportTeam', e.target.value)}>
                {['All', ...SUPPORT_TEAMS].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
        </Panel>

        {/* Actions + preview */}
        <Panel className="lg:col-span-2" bodyClass="">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPhase('preview')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <FileText size={15} /> Preview Report
            </button>
            <button
              type="button"
              onClick={async () => {
                setPhase('generating')
                setGenError('')
                try {
                  const { blob, filename } = await generateReport({
                    report_type: type,
                    year,
                    month: month + 1, // frontend is 0-indexed, backend is 1-12
                    week,
                    date,
                    region: f.region,
                    center: f.center,
                    module: f.module,
                    support_team: f.supportTeam,
                  })
                  setReport({ blob, filename })
                  setPhase('ready')
                } catch (err) {
                  setGenError(err.message || 'The report could not be generated. Try again.')
                  setPhase('preview')
                }
              }}
              disabled={phase === 'generating' || ticketsLoading || scoped.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {phase === 'generating' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {phase === 'generating' ? 'Generating…' : 'Generate DOC'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!report) return
                const url = URL.createObjectURL(report.blob)
                const link = document.createElement('a')
                link.href = url
                link.download = report.filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              }}
              disabled={!report}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} /> Download DOC
            </button>

            <span className="text-[11px] text-slate-400">
              {win.label}
              {reportScopeLabel ? ` · ${reportScopeLabel}` : ''}
              {scopeLabel ? ` · ${scopeLabel}` : ''}
            </span>
          </div>

          {(phase === 'preview' || phase === 'ready') && (
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-6">
              {[
                ['Total', k.total], ['Open', k.open], ['Aged', k.aged],
                ['Resolution', fmtPct(k.resolutionRate)], ['Avg Resolve', fmtHours(k.avgResolutionHours)], ['Pending Appr.', k.pendingApproval],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                  <p className="text-[9px] font-medium text-slate-500">{label}</p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">{val}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">The DOC will contain:</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {DOC_SECTIONS.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Check size={11} className="shrink-0 text-teal-500" /> {s}
                </li>
              ))}
            </ul>
          </div>

          {report && (
            <p className="mt-3 text-[10px] text-emerald-600">
              {report.filename} is ready — click Download DOC to save it.
            </p>
          )}
          {genError && (
            <p className="mt-3 flex items-start gap-1.5 text-[10px] text-rose-600">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {genError}
            </p>
          )}
          {ticketsLoading && (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Loader2 size={11} className="animate-spin" /> Loading tickets…
            </p>
          )}
          {ticketsError && (
            <p className="mt-3 flex items-start gap-1.5 text-[10px] text-rose-600">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {ticketsError}
            </p>
          )}
          {!ticketsLoading && !ticketsError && scoped.length === 0 && (
            <p className="mt-3 text-[10px] text-amber-600">No tickets in this period — pick another range.</p>
          )}
        </Panel>
      </div>

      <div className="h-8" />
    </div>
  )
}

export default Reports
