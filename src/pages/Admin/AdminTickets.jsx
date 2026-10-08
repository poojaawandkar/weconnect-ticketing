import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search, X } from 'lucide-react'

import { useAdminFilters } from '../../admin/data/useAdminFilters'
import { useAdminTicketsStatus } from '../../admin/data/mockTickets'
import { useRegionScope } from '../../admin/data/regionScope'
import { statusGroupOf } from '../../admin/data/dimensions'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import { statusStyles } from '../../utils/ticketStyles'
import { stageLabel } from '../../data/supportStages'
import { shortDate } from '../../utils/ticketDates'
import { usePagination } from '../../components/common/usePagination'
import Pagination from '../../components/common/Pagination'

/*
 * ADMIN TICKETS
 *
 * The analytical, read-only ticket list - the drill-down target
 * for every KPI / chart click. Not an operational queue: no
 * actions, no transitions.
 */

const DAY = 86_400_000

function AdminTickets() {
  const [params] = useSearchParams()
  const initial = { region: params.get('region') || 'All', module: params.get('module') || 'All' }
  const view = params.get('view')

  const scope = useRegionScope()
  const { error: ticketsError } = useAdminTicketsStatus()
  const { filteredTickets, controls } = useAdminFilters({
    fields: ['period', 'region', 'center', 'module', 'subModule', 'supportTeam', 'status', 'priority'],
    initial,
    regionScope: scope.regions,
  })

  const [search, setSearch] = useState(params.get('q') || '')
  const [now] = useState(() => Date.now())

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase()
    return filteredTickets
      .filter((t) => (view === 'aged' ? (now - t.createdAt) / DAY > 2 && statusGroupOf(t.status) !== 'Resolved' : true))
      .filter((t) => {
        if (!text) return true
        return (
          t.id.toLowerCase().includes(text) ||
          `${t.module} ${t.subModule}`.toLowerCase().includes(text) ||
          t.issueTheme.toLowerCase().includes(text) ||
          `${t.region} ${t.center}`.toLowerCase().includes(text)
        )
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [filteredTickets, search, view, now])

  const pager = usePagination(rows, 10)

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-9">
      <AdminPageHeader
        title="Tickets"
        question={
          view === 'aged'
            ? 'Aged open tickets across the organisation.'
            : 'Every ticket, filterable to any slice — the drill-down for the analytics above.'
        }
        controls={controls}
      />

      {ticketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{ticketsError}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">
            {rows.length} ticket{rows.length === 1 ? '' : 's'}
          </p>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets, theme, center..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Ticket', 'Module / Sub-module', 'Region · Center', 'Team', 'Priority', 'Status', 'Age', 'Created'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((t) => {
                const style = statusStyles[t.status] || statusStyles.Open
                const age = Math.floor((now - t.createdAt) / DAY)
                return (
                  <tr key={t.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 text-xs font-semibold text-teal-700">{t.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-slate-700">{t.module}</p>
                      <p className="text-[10px] text-slate-400">{t.subModule}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{t.region} · {t.center}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{t.supportTeam}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{t.priority}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.background} ${style.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {stageLabel(t.status)}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-xs ${age > 7 ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>{age}d</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[10px] text-slate-400">{shortDate(t.createdAt)}</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-xs text-slate-400">
                    No tickets match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination {...pager} />
      </div>

      <div className="h-8" />
    </div>
  )
}

export default AdminTickets
