import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Filter, Search, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { statusStyles, priorityStyles } from '../../utils/ticketStyles'

/*
 * ================================================================
 * ALL CHAMPION TICKETS
 *
 * Every ticket visible to the Champion, using the exact Frappe
 * workflow state names, filterable by Module / Status / Priority /
 * Center / Region as specified.
 * ================================================================
 */

const FILTER_FIELDS = [
  { key: 'moduleFilter', label: 'Module', dataKey: 'module', placeholder: 'All Modules' },
  { key: 'statusFilter', label: 'Status', dataKey: 'status', placeholder: 'All Status' },
  { key: 'priorityFilter', label: 'Priority', dataKey: 'priority', placeholder: 'All Priorities' },
  { key: 'centerFilter', label: 'Center', dataKey: 'center', placeholder: 'All Centers' },
  { key: 'regionFilter', label: 'Region', dataKey: 'region', placeholder: 'All Regions' },
]

function uniqueValues(tickets, dataKey) {
  return Array.from(new Set(tickets.map((ticket) => ticket[dataKey])))
}

function ChampionTickets() {
  const navigate = useNavigate()
  const { tickets } = useTickets()

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    moduleFilter: 'All',
    statusFilter: 'All',
    priorityFilter: 'All',
    centerFilter: 'All',
    regionFilter: 'All',
  })

  const filterOptions = useMemo(
    () =>
      FILTER_FIELDS.reduce((acc, field) => {
        acc[field.key] = uniqueValues(tickets, field.dataKey)
        return acc
      }, {}),
    [tickets]
  )

  const setFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  const activeFilterCount = Object.values(filters).filter((value) => value !== 'All').length

  const clearFilters = () => {
    setFilters({
      moduleFilter: 'All',
      statusFilter: 'All',
      priorityFilter: 'All',
      centerFilter: 'All',
      regionFilter: 'All',
    })
  }

  const clearAll = () => {
    setSearch('')
    clearFilters()
  }

  const filteredTickets = useMemo(() => {
    const searchText = search.toLowerCase().trim()

    return tickets.filter((ticket) => {
      const matchesSearch =
        !searchText ||
        ticket.id.toLowerCase().includes(searchText) ||
        ticket.issue.toLowerCase().includes(searchText) ||
        ticket.module.toLowerCase().includes(searchText) ||
        ticket.region.toLowerCase().includes(searchText) ||
        ticket.center.toLowerCase().includes(searchText)

      const matchesModule = filters.moduleFilter === 'All' || ticket.module === filters.moduleFilter
      const matchesStatus = filters.statusFilter === 'All' || ticket.status === filters.statusFilter
      const matchesPriority = filters.priorityFilter === 'All' || ticket.priority === filters.priorityFilter
      const matchesCenter = filters.centerFilter === 'All' || ticket.center === filters.centerFilter
      const matchesRegion = filters.regionFilter === 'All' || ticket.region === filters.regionFilter

      return (
        matchesSearch &&
        matchesModule &&
        matchesStatus &&
        matchesPriority &&
        matchesCenter &&
        matchesRegion
      )
    })
  }, [tickets, search, filters])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-7 lg:px-9">

      {/* No repeated "All Champion Tickets" title here - the
          shared Header already shows the page title and a back
          control. */}

      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <p className="text-sm text-slate-500">
          Every ticket visible to you across Skilling and CenterOps.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-400">Total</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-800">
            {tickets.length}
          </p>
        </div>

      </div>

      {/* Search + Filters */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition ${
              showFilters || activeFilterCount > 0
                ? 'border-teal-200 bg-teal-50 text-teal-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

        </div>

        {showFilters && (
          <div className="mt-4 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-end">

              {FILTER_FIELDS.map((field) => (
                <div key={field.key} className="flex-1 lg:min-w-[160px]">
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    {field.label}
                  </label>
                  <div className="relative">
                    <select
                      value={filters[field.key]}
                      onChange={(e) => setFilter(field.key, e.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                    >
                      <option value="All">{field.placeholder}</option>
                      {filterOptions[field.key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear Filters
              </button>

            </div>
          </div>
        )}

      </div>

      {/* Table */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <p className="text-sm font-semibold text-slate-900">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </p>
          {(search || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              <X size={13} />
              Clear all
            </button>
          )}
        </div>

        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ticket</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Issue</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Module</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Region / Center</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workflow State</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const status = statusStyles[ticket.status]

                  return (
                    <tr key={ticket.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/champion/tickets/${ticket.id}`)}
                          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                        >
                          {ticket.id}
                        </button>
                      </td>
                      <td className="max-w-[280px] px-5 py-4">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {ticket.issue}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {ticket.subModule}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          {ticket.module}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                        {ticket.region} · {ticket.center}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${priorityStyles[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium ${status.background} ${status.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {ticket.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {ticket.updatedDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <Search size={27} className="text-slate-300" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-800">
              No tickets found
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
              We couldn't find any tickets matching your current search or filters.
            </p>
          </div>
        )}

      </div>

      <div className="h-8" />

    </div>
  )
}

export default ChampionTickets
