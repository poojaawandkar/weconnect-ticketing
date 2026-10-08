import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { useAdminFilters } from '../../admin/data/useAdminFilters'
import { useAdminTicketsStatus } from '../../admin/data/mockTickets'
import { useRegionScope } from '../../admin/data/regionScope'
import { useRegionDimensionsSync } from '../../admin/data/regionDimensions'
import {
  kpis,
  issueTrend,
  regionHealth,
  centerHealth,
  moduleRanking,
  subModuleRanking,
  issueTypeRanking,
  fmtHours,
  fmtPct,
} from '../../admin/data/analytics'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import Panel from '../../admin/components/Panel'
import KpiCard from '../../admin/components/KpiCard'
import DonutChart from '../../admin/charts/DonutChart'
import LineChart from '../../admin/charts/LineChart'
import RankingBars from '../../admin/charts/RankingBars'

// Pie palette - kept muted; distinct enough to read a slice apart.
const PIE = ['#0d9488', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#a855f7', '#64748b']
const MODULE_COLORS = { CenterOps: '#0d9488', Skilling: '#6366f1' }

function Section({ children }) {
  return (
    <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500 first:mt-6">
      {children}
    </h3>
  )
}

function Th({ children }) {
  return (
    <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const scope = useRegionScope()
  const { regions: allRegions, centersByRegion, allCenters } = useRegionDimensionsSync()
  const { error: ticketsError } = useAdminTicketsStatus()
  const { filteredTickets, dimFilteredTickets, controls, filters } = useAdminFilters({
    fields: ['period', 'region', 'center', 'module', 'subModule', 'supportTeam'],
    regionScope: scope.regions,
  })
  const t = filteredTickets
  // One region assigned -> the whole page is that region; a region
  // bar/table would be a single row, so drop it.
  const showRegionBreakdown = !scope.single
  const drill = (qs) => navigate(`/admin/tickets${qs ? `?${qs}` : ''}`)

  const k = useMemo(() => kpis(t), [t])
  const overTime = useMemo(() => issueTrend(dimFilteredTickets, 'month'), [dimFilteredTickets])

  const issueTypeSlices = useMemo(() => {
    const rows = issueTypeRanking(t)
    const top = rows.slice(0, 7)
    const rest = rows.slice(7)
    const slices = top.map((r, i) => ({ label: r.name, value: r.count, color: PIE[i % PIE.length] }))
    if (rest.length) {
      slices.push({
        label: `Other (${rest.length})`,
        value: rest.reduce((s, r) => s + r.count, 0),
        color: '#cbd5e1',
      })
    }
    return slices
  }, [t])

  const regions = useMemo(() => {
    const all = regionHealth(t, { regions: allRegions })
    return scope.regions ? all.filter((r) => scope.regions.includes(r.region)) : all
  }, [t, scope.regions, allRegions])
  const regionBars = useMemo(() => regions.map((r) => ({ name: r.region, value: r.volume })), [regions])

  const centers = useMemo(
    () => centerHealth(t, { region: filters.region, centersByRegion, allCenters }).slice(0, 10),
    [t, filters.region, centersByRegion, allCenters]
  )
  const centerBars = useMemo(() => centers.map((c) => ({ name: c.center, value: c.volume })), [centers])

  const moduleSelected = filters.module !== 'All'
  const moduleSlices = useMemo(
    () =>
      moduleRanking(t).map((r) => ({
        label: r.name,
        value: r.count,
        color: MODULE_COLORS[r.name] || '#94a3b8',
      })),
    [t]
  )
  const subModuleSlices = useMemo(() => {
    const rows = subModuleRanking(t)
    const top = rows.slice(0, 7)
    const rest = rows.slice(7)
    const slices = top.map((r, i) => ({ label: r.name, value: r.count, color: PIE[i % PIE.length] }))
    if (rest.length) {
      slices.push({
        label: `Other (${rest.length})`,
        value: rest.reduce((s, r) => s + r.count, 0),
        color: '#cbd5e1',
      })
    }
    return slices
  }, [t])

  const cards = [
    { label: 'Total Tickets', value: k.total, emphasis: true },
    { label: 'Open Tickets', value: k.open },
    { label: 'In Progress', value: k.inProgress },
    { label: 'Resolved', value: k.resolved, tone: 'success' },
    { label: 'Pending Approval', value: k.pendingApproval, tone: k.pendingApproval ? 'pending' : undefined },
    { label: 'Avg Resolution Time', value: fmtHours(k.avgResolutionHours) },
  ]

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-7 lg:px-9">
      <AdminPageHeader
        title="Overview"
        question="How many tickets are there, where do they stand, and which regions, centers and modules carry the load?"
        controls={controls}
      />

      {ticketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{ticketsError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} onClick={() => drill()} />
        ))}
      </div>

      {/* ---- Ticket overview ---- */}
      <Section>Ticket Overview</Section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Tickets by Issue Type" subtitle="Reported issue type across all tickets">
          {issueTypeSlices.length > 0 ? (
            <DonutChart slices={issueTypeSlices} centerLabel="tickets" onSliceClick={() => drill()} />
          ) : (
            <p className="text-xs text-slate-400">No tickets in this range.</p>
          )}
        </Panel>
        <Panel title="Tickets Over Time" subtitle="New tickets per month">
          <LineChart
            data={overTime}
            lines={[{ key: 'count', name: 'New tickets', color: '#0d9488', area: true }]}
            height={220}
          />
        </Panel>
      </div>

      {/* ---- Region & Center ---- */}
      <Section>{showRegionBreakdown ? 'Region & Center' : 'Centers'}</Section>

      {showRegionBreakdown && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Tickets by Region" subtitle={scope.isRegionHead ? 'Your assigned regions' : 'All six regions'}>
            <RankingBars rows={regionBars} onRowClick={(r) => drill(`region=${r.name}`)} />
          </Panel>
          <Panel title="Region summary">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <Th>Region</Th><Th>Total</Th><Th>Open</Th><Th>Resolved</Th><Th>Resolution %</Th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r) => (
                    <tr
                      key={r.region}
                      onClick={() => drill(`region=${r.region}`)}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60"
                    >
                      <td className="px-2 py-3 text-xs font-semibold text-slate-700">{r.region}</td>
                      <td className="px-2 py-3 text-xs text-slate-600">{r.volume}</td>
                      <td className="px-2 py-3 text-xs text-slate-600">{r.open}</td>
                      <td className="px-2 py-3 text-xs text-slate-600">{r.resolved}</td>
                      <td className={`px-2 py-3 text-xs font-medium ${r.resolutionRate < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fmtPct(r.resolutionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${showRegionBreakdown ? 'mt-6' : ''}`}>
        <Panel
          title="Top Centers by Ticket Count"
          subtitle={filters.region === 'All' ? 'Highest volume first' : `Centers in ${filters.region}`}
        >
          <RankingBars rows={centerBars} onRowClick={(r) => drill(`q=${encodeURIComponent(r.name)}`)} />
        </Panel>
        <Panel title="Center summary">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Center</Th><Th>Region</Th><Th>Tickets</Th><Th>Open</Th><Th>Resolved</Th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => (
                  <tr
                    key={c.center}
                    onClick={() => drill(`q=${encodeURIComponent(c.center)}`)}
                    className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60"
                  >
                    <td className="px-2 py-3 text-xs font-semibold text-slate-700">{c.center}</td>
                    <td className="px-2 py-3 text-xs text-slate-500">{c.region}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">{c.volume}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">{c.open}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">{c.resolved}</td>
                  </tr>
                ))}
                {centers.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-10 text-center text-xs text-slate-400">No centers in this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ---- Module & Issues ---- */}
      <Section>Module &amp; Issues</Section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Tickets by Module" subtitle="Share of tickets — CenterOps vs Skilling">
          <DonutChart
            slices={moduleSlices}
            centerLabel="tickets"
            onSliceClick={(s) => drill(`module=${encodeURIComponent(s.label)}`)}
          />
        </Panel>
        <Panel
          title={moduleSelected ? `${filters.module} · Sub-modules` : 'Sub-modules'}
          subtitle={moduleSelected ? 'Share of issues per sub-module' : 'Top sub-modules — pick a Module to focus'}
        >
          {subModuleSlices.length > 0 ? (
            <DonutChart
              slices={subModuleSlices}
              centerLabel="tickets"
              onSliceClick={(s) => {
                if (s.label.startsWith('Other')) {
                  drill(moduleSelected ? `module=${encodeURIComponent(filters.module)}` : '')
                  return
                }
                drill(
                  moduleSelected
                    ? `module=${encodeURIComponent(filters.module)}&q=${encodeURIComponent(s.label)}`
                    : `q=${encodeURIComponent(s.label)}`
                )
              }}
            />
          ) : (
            <p className="text-xs text-slate-400">No tickets in this range.</p>
          )}
        </Panel>
      </div>

      <div className="h-8" />
    </div>
  )
}

export default AdminDashboard
