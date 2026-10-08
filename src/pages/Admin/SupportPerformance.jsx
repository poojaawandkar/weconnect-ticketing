import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'

import { useAdminFilters } from '../../admin/data/useAdminFilters'
import { useAdminTicketsStatus } from '../../admin/data/mockTickets'
import { useRegionScope } from '../../admin/data/regionScope'
import {
  supportPerformance,
  supportTeamComparison,
  resolutionTimeTrend,
  resolutionStats,
  fmtHours,
  fmtPct,
} from '../../admin/data/analytics'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import Panel from '../../admin/components/Panel'
import KpiCard from '../../admin/components/KpiCard'
import LineChart from '../../admin/charts/LineChart'

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function CompareRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${tone || 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

function TeamCard({ row }) {
  return (
    <Panel className="border-teal-100">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{row.team.replace(' Support', '')}</p>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
          {row.volume} tickets
        </span>
      </div>
      <div className="mt-3">
        <CompareRow label="Avg time to start work" value={fmtHours(row.avgStartHours)} />
        <CompareRow label="Avg time to first response" value={fmtHours(row.avgResponseHours)} />
        <CompareRow label="Avg time to resolution" value={fmtHours(row.avgResolutionHours)} />
        <CompareRow label="Median resolution" value={fmtHours(row.medianResolutionHours)} />
        <CompareRow
          label="Aged tickets"
          value={row.aged}
          tone={row.aged > 15 ? 'text-rose-600' : 'text-slate-800'}
        />
        <CompareRow label="Reopen rate" value={fmtPct(row.reopenRate)} />
      </div>
    </Panel>
  )
}

function SupportPerformance() {
  const scope = useRegionScope()
  const { error: ticketsError } = useAdminTicketsStatus()
  const { filteredTickets, controls, filters, granularity } = useAdminFilters({
    fields: ['dateRange', 'granularity', 'region', 'module', 'supportTeam'],
    regionScope: scope.regions,
  })
  const t = filteredTickets

  const perf = useMemo(() => supportPerformance(t), [t])
  const stats = useMemo(() => resolutionStats(t), [t])
  const resTrend = useMemo(() => resolutionTimeTrend(t, granularity), [t, granularity])
  const teams = useMemo(() => supportTeamComparison(t), [t])

  const gLabel = granularity === 'day' ? 'day' : granularity === 'month' ? 'month' : 'week'

  const kpis = [
    { label: 'Avg Time to Start Work', value: fmtHours(perf.timeToStart.avg) },
    { label: 'Avg Time to First Response', value: fmtHours(perf.timeToFirstResponse.avg) },
    { label: 'Avg Time to Resolution', value: fmtHours(perf.timeToResolution.avg) },
    { label: 'Aged Tickets', value: perf.agedBacklog, tone: perf.agedBacklog ? 'warning' : undefined, sub: 'open > 2 days' },
    { label: 'Reopened Tickets', value: perf.reopenedCount, sub: `${fmtPct(perf.reopenRate)} of resolved` },
  ]

  const teamScope = filters.supportTeam === 'All' ? 'both support teams' : filters.supportTeam

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-7 lg:px-9">
      <AdminPageHeader
        title="Support Performance"
        question="How well is Support performing — are tickets resolved faster or slower?"
        controls={controls}
      />

      {ticketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{ticketsError}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Resolution time trend + at a glance */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Average Resolution Time"
          subtitle={`Average hours to resolve per ${gLabel} for ${teamScope} — set the date range, granularity and Support Team above`}
        >
          <LineChart
            data={resTrend}
            lines={[{ key: 'avg', name: 'Avg hours to resolve', color: '#0d9488', area: true }]}
            height={230}
            formatValue={(v) => `${Math.round(v)}h`}
          />
        </Panel>

        <Panel title="Resolution Time — at a glance">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Average" value={fmtHours(stats.avg)} />
            <Stat label="Median" value={fmtHours(stats.median)} />
            <Stat label="Fastest" value={fmtHours(stats.fastest)} />
            <Stat label="Slowest" value={fmtHours(stats.slowest)} />
          </div>
        </Panel>
      </div>

      {/* Team comparison cards */}
      <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
        WeConnect Support vs Skilling Support
      </h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {teams.map((row) => <TeamCard key={row.team} row={row} />)}
        {teams.length === 0 && (
          <p className="text-xs text-slate-400">No tickets match these filters.</p>
        )}
      </div>

      <div className="h-8" />
    </div>
  )
}

export default SupportPerformance
