import { useMemo, useState } from 'react'
import {
    ArrowUpRight,
    CalendarDays,
    ChevronDown,
    Filter,
    Search,
    X,
} from 'lucide-react'

import { useUserTickets } from '../../tickets/useUserTickets'
import { statusStyles, priorityStyles } from '../../utils/ticketStyles'
import SupportStageTabs from '../support/SupportStageTabs'
import { usePagination } from '../common/usePagination'
import Pagination from '../common/Pagination'

const isOpenLike = (status) => status !== 'Resolved' && status !== 'Closed'

/*
 * ================================================================
 * STATUS TABS - always exactly these, never a shrinking/growing
 * set depending on which statuses happen to occur. "Open" is a
 * bucket, not a single Frappe status: every real workflow state
 * that isn't Resolved/Closed/Reopened yet (Champion In Progress,
 * WeConnect/Skilling Support In Progress, Awaiting User, Pending
 * Approval) still needs a tab to live under, and "still open, not
 * done" is the honest one - it never disappears into an "All"-only
 * ticket the way a strict 1-status-per-tab scheme would.
 *
 * "Needs Your Reply" is the one call-to-action tab: tickets a
 * support team has moved to "Awaiting User" because they asked the
 * requester a question. It overlaps the Open bucket on purpose -
 * it just surfaces the ones the requester has to act on. Opening
 * one goes to the same Ticket Details page, where the support
 * message and the reply box live together.
 *
 * "Sent to L2" is its own bucket, not an Open overlap - like
 * Resolved/Closed/Reopened, a ticket sits here (and only here)
 * until support marks it "Resolved by L2" and it moves back to the
 * Open bucket, so the requester always has one place to check
 * whether their ticket is still with the external L2 team.
 * ================================================================
 */
const STATUS_TABS = [
    { key: 'OPEN', label: 'Open', match: (status) => !['Resolved', 'Closed', 'Reopened', 'Sent to L2'].includes(status) },
    { key: 'Awaiting User', label: 'Needs Your Reply', match: (status) => status === 'Awaiting User' },
    { key: 'Sent to L2', label: 'Sent to L2', match: (status) => status === 'Sent to L2' },
    { key: 'Resolved', label: 'Resolved', match: (status) => status === 'Resolved' },
    { key: 'Closed', label: 'Closed', match: (status) => status === 'Closed' },
    { key: 'Reopened', label: 'Reopened', match: (status) => status === 'Reopened' },
]

function MyTickets({ onOpenTicket }) {
    const { tickets, loading, error } = useUserTickets()

    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const [moduleFilter, setModuleFilter] = useState('All')
    const [priorityFilter, setPriorityFilter] = useState('All')

    // Status is a tab, not a dropdown filter - same tab-wise
    // distribution style as the Support workspace, always showing
    // Open / Resolved / Closed / Reopened (see STATUS_TABS above).
    const [stage, setStage] = useState('ALL')

    const moduleOptions = useMemo(
        () => [...new Set(tickets.map((ticket) => ticket.module).filter(Boolean))],
        [tickets]
    )

    const scopedTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const matchesModule =
                moduleFilter === 'All' ||
                ticket.module === moduleFilter

            const matchesPriority =
                priorityFilter === 'All' ||
                ticket.priority === priorityFilter

            return matchesModule && matchesPriority
        })
    }, [tickets, moduleFilter, priorityFilter])

    const stages = useMemo(() => [
        { key: 'ALL', label: 'All', count: scopedTickets.length },
        ...STATUS_TABS.map((tab) => ({
            key: tab.key,
            label: tab.label,
            count: scopedTickets.filter((ticket) => tab.match(ticket.status)).length,
        })),
    ], [scopedTickets])

    const activeTab = STATUS_TABS.find((tab) => tab.key === stage)

    const filteredTickets = useMemo(() => {
        const searchText = search.toLowerCase().trim()

        return scopedTickets
            .filter((ticket) => stage === 'ALL' || (activeTab && activeTab.match(ticket.status)))
            .filter((ticket) => {
                if (!searchText) return true

                return (
                    ticket.id.toLowerCase().includes(searchText) ||
                    ticket.issue.toLowerCase().includes(searchText) ||
                    ticket.module.toLowerCase().includes(searchText) ||
                    ticket.subModule.toLowerCase().includes(searchText)
                )
            })
    }, [scopedTickets, stage, activeTab, search])

    const pager = usePagination(filteredTickets)

    const activeFilterCount = [
        moduleFilter !== 'All',
        priorityFilter !== 'All',
    ].filter(Boolean).length

    const clearFilters = () => {
        setModuleFilter('All')
        setPriorityFilter('All')
    }

    const clearAll = () => {
        setSearch('')
        setStage('ALL')
        clearFilters()
    }

    return (
        <div className="mx-auto w-full max-w-[1400px] px-5 py-7 sm:px-7 lg:px-9">

            {/* =====================================================
          SEARCH + FILTER + SUMMARY - one line instead of two
          stacked sections, so the top of the page doesn't waste
          height before the tickets even show up. No repeated "My
          Tickets" title/back button either - the shared Header
          already shows the page title and a back control.
      ====================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">

                        {/* Search */}

                        <div className="relative flex-1">

                            <Search
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by ticket ID, issue or module..."
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

                        {/* Filter button */}

                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition ${showFilters || activeFilterCount > 0
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

                    {/* Summary - same line as search/filter */}

                    <div className="flex shrink-0 items-center gap-2">

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">

                            <p className="text-[10px] text-slate-400">
                                Total
                            </p>

                            <p className="mt-0.5 text-base font-semibold text-slate-800">
                                {tickets.length}
                            </p>

                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">

                            <p className="text-[10px] text-slate-400">
                                Open
                            </p>

                            <p className="mt-0.5 text-base font-semibold text-rose-600">
                                {
                                    tickets.filter((ticket) => isOpenLike(ticket.status)).length
                                }
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
            FILTER PANEL - Module / Priority only. Status is the
            tab bar below the search box, not a dropdown here.
        ================================================== */}

                {showFilters && (

                    <div className="mt-4 border-t border-slate-100 pt-5">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">

                            {/* Module */}

                            <div className="flex-1">

                                <label className="mb-2 block text-xs font-medium text-slate-600">
                                    Module
                                </label>

                                <div className="relative">

                                    <select
                                        value={moduleFilter}
                                        onChange={(e) => setModuleFilter(e.target.value)}
                                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                                    >

                                        <option value="All">
                                            All Modules
                                        </option>

                                        {moduleOptions.map((option) => (
                                            <option
                                                key={option}
                                                value={option}
                                            >
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

                            {/* Priority */}

                            <div className="flex-1">

                                <label className="mb-2 block text-xs font-medium text-slate-600">
                                    Priority
                                </label>

                                <div className="relative">

                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm text-slate-600 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                                    >

                                        <option value="All">
                                            All Priorities
                                        </option>

                                        <option value="Urgent">
                                            Urgent
                                        </option>

                                        <option value="High">
                                            High
                                        </option>

                                        <option value="Medium">
                                            Medium
                                        </option>

                                        <option value="Low">
                                            Low
                                        </option>

                                    </select>

                                    <ChevronDown
                                        size={16}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                            </div>

                            {/* Clear */}

                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={activeFilterCount === 0}
                                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Clear Filters
                            </button>

                        </div>

                        {/* Filter summary */}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                            <span className="text-xs text-slate-400">
                                Showing
                            </span>

                            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                                {filteredTickets.length} ticket
                                {filteredTickets.length !== 1 ? 's' : ''}
                            </span>

                            {activeFilterCount > 0 && (
                                <span className="text-xs text-slate-400">
                                    with {activeFilterCount} active filter
                                    {activeFilterCount !== 1 ? 's' : ''}
                                </span>
                            )}

                        </div>

                    </div>

                )}

            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* =====================================================
          TICKET LIST

          Tab-wise distribution, same as the Support workspace -
          Open / In Progress / Resolved / Closed / Reopened tabs,
          built only from statuses that actually occur in these
          tickets.
      ====================================================== */}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="px-5 pt-3 sm:px-6">
                    <SupportStageTabs stages={stages} value={stage} onChange={setStage} />
                </div>

                {/* List Header */}

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                    <div>

                        <h3 className="text-sm font-semibold text-slate-900">
                            Support Requests
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                            {filteredTickets.length} ticket
                            {filteredTickets.length !== 1 ? 's' : ''} found
                        </p>

                    </div>

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

                {/* =================================================
            DESKTOP TABLE
        ================================================== */}

                {filteredTickets.length > 0 ? (

                    <div className="hidden overflow-x-auto md:block">

                        <table className="w-full">

                            <thead>

                                <tr className="border-b border-slate-100 bg-slate-50/60">

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Ticket
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Issue
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Module
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Priority
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Status
                                    </th>

                                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Raised
                                    </th>

                                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {pager.pageItems.map((ticket) => {

                                    const status = statusStyles[ticket.status] || statusStyles.Open

                                    return (
                                        <tr
                                            key={ticket.id}
                                            className="group border-b border-slate-50 transition hover:bg-slate-50/70"
                                        >

                                            {/* Ticket */}

                                            <td className="px-5 py-4">

                                                <button
                                                    type="button"
                                                    onClick={() => onOpenTicket(ticket)}
                                                    className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                                                >
                                                    {ticket.id}
                                                </button>

                                            </td>

                                            {/* Issue */}

                                            <td className="max-w-[320px] px-5 py-4">

                                                <p className="truncate text-sm font-medium text-slate-700">
                                                    {ticket.issue}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {ticket.subModule}
                                                </p>

                                            </td>

                                            {/* Module */}

                                            <td className="px-5 py-4">

                                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                                                    {ticket.module}
                                                </span>

                                            </td>

                                            {/* Priority */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${priorityStyles[ticket.priority]}`}
                                                >
                                                    {ticket.priority}
                                                </span>

                                            </td>

                                            {/* Status */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium ${status.background} ${status.text}`}
                                                >

                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                    />

                                                    {ticket.status}

                                                </span>

                                            </td>

                                            {/* Raised */}

                                            <td className="whitespace-nowrap px-5 py-4">

                                                <div className="flex items-center gap-2">

                                                    <CalendarDays
                                                        size={14}
                                                        className="text-slate-400"
                                                    />

                                                    <div>

                                                        <p className="text-xs text-slate-600">
                                                            {ticket.date}
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                                            {ticket.time}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* Action */}

                                            <td className="px-5 py-4 text-right">

                                                <button
                                                    type="button"
                                                    onClick={() => onOpenTicket(ticket)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"
                                                    title="View ticket"
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>

                                            </td>

                                        </tr>
                                    )
                                })}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    /* =================================================
                       EMPTY STATE
                    ================================================== */

                    <div className="flex flex-col items-center justify-center px-5 py-20 text-center">

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">

                            <Search
                                size={27}
                                className="text-slate-300"
                            />

                        </div>

                        <h3 className="mt-5 text-base font-semibold text-slate-800">
                            {loading
                                ? 'Loading your tickets...'
                                : tickets.length === 0
                                    ? "You haven't raised any tickets yet"
                                    : 'No tickets found'}
                        </h3>

                        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
                            {loading
                                ? 'Fetching the latest data from Frappe.'
                                : tickets.length === 0
                                    ? 'Tickets you raise will show up here.'
                                    : "We couldn't find any tickets matching your current search or filters."}
                        </p>

                        {!loading && tickets.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="mt-5 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
                            >
                                Clear Filters
                            </button>
                        )}

                    </div>

                )}

                {/* =================================================
            MOBILE LIST
        ================================================== */}

                {filteredTickets.length > 0 && (

                    <div className="divide-y divide-slate-100 md:hidden">

                        {pager.pageItems.map((ticket) => {

                            const status = statusStyles[ticket.status] || statusStyles.Open

                            return (
                                <div
                                    key={ticket.id}
                                    className="p-5"
                                >

                                    <div className="flex items-start justify-between gap-3">

                                        <div>

                                            <button
                                                type="button"
                                                className="text-sm font-semibold text-teal-700"
                                            >
                                                {ticket.id}
                                            </button>

                                            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
                                                {ticket.issue}
                                            </p>

                                        </div>

                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ${status.background} ${status.text}`}
                                        >

                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                            />

                                            {ticket.status}

                                        </span>

                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">

                                        <div>

                                            <p className="text-[11px] text-slate-400">
                                                Module
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-600">
                                                {ticket.module}
                                            </p>

                                        </div>

                                        <div>

                                            <p className="text-[11px] text-slate-400">
                                                Priority
                                            </p>

                                            <span
                                                className={`mt-1 inline-block rounded-lg px-2 py-1 text-xs font-medium ${priorityStyles[ticket.priority]}`}
                                            >
                                                {ticket.priority}
                                            </span>

                                        </div>

                                        <div>

                                            <p className="text-[11px] text-slate-400">
                                                Raised
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-600">
                                                {ticket.date}
                                            </p>

                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onOpenTicket(ticket)}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700"
                                    >
                                        View Ticket
                                        <ArrowUpRight size={14} />
                                    </button>

                                </div>
                            )
                        })}

                    </div>

                )}

                {filteredTickets.length > 0 && <Pagination {...pager} />}

            </div>

            <div className="h-8" />

        </div>
    )
}

export default MyTickets