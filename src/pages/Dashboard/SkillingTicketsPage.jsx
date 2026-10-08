import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { useSkillingSupport } from '../../skilling/useSkillingSupport'
import { awaitingSupportReview } from '../../data/ticketConversation'
import SupportStageTabs from '../../components/support/SupportStageTabs'
import SupportTicketTable from '../../components/support/SupportTicketTable'

/*
 * ================================================================
 * SKILLING TICKETS
 *
 * The Skilling Support ticket workspace: every ticket routed to the
 * Skilling Support team, filtered by horizontal workflow-status
 * tabs. One page, one table - no per-status sidebar pages, no
 * Champion columns.
 *
 * The tab set is fixed to the workflow states a Skilling Support
 * ticket can actually be in (the two "In Progress" internal names
 * collapse to one "In Progress" tab), plus one "Replied" tab -
 * tickets where the requester has answered an earlier question and
 * the ball is back with support. Row actions come from
 * useSkillingSupport().actionRoleForTicket, so a user only ever
 * sees an action the Frappe workflow would allow.
 * ================================================================
 */

const STATUS_TABS = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'Open', label: 'Open', match: (t) => t.status === 'Open' },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    match: (t) => t.status === 'Skilling Support In Progress',
  },
  { key: 'REPLIED', label: 'Replied', match: (t) => awaitingSupportReview(t) },
  { key: 'Awaiting User', label: 'Awaiting User', match: (t) => t.status === 'Awaiting User' },
  { key: 'Sent to L2', label: 'Sent to L2', match: (t) => t.status === 'Sent to L2' },
  { key: 'Reopened', label: 'Reopened', match: (t) => t.status === 'Reopened' },
  { key: 'Resolved', label: 'Resolved', match: (t) => t.status === 'Resolved' },
  { key: 'Closed', label: 'Closed', match: (t) => t.status === 'Closed' },
]

const TABLE_COLUMNS = [
  'ticket',
  'issue',
  'subModule',
  'center',
  'status',
  'action',
]

function SkillingTicketsPage() {
  const navigate = useNavigate()
  const { tickets, skillingTicketsError } = useTickets()
  const { scopeTickets, actionRoleForTicket } = useSkillingSupport()

  const [tab, setTab] = useState('ALL')
  const [search, setSearch] = useState('')

  const myTickets = useMemo(() => scopeTickets(tickets), [tickets, scopeTickets])

  const stages = useMemo(
    () =>
      STATUS_TABS.map((entry) => ({
        key: entry.key,
        label: entry.label,
        count: myTickets.filter(entry.match).length,
      })),
    [myTickets]
  )

  const visibleTickets = useMemo(() => {
    const text = search.trim().toLowerCase()
    const activeTab = STATUS_TABS.find((entry) => entry.key === tab) || STATUS_TABS[0]

    return myTickets
      .filter(activeTab.match)
      .filter((t) => {
        if (!text) return true
        return (
          t.id.toLowerCase().includes(text) ||
          t.issue.toLowerCase().includes(text) ||
          t.subModule.toLowerCase().includes(text) ||
          t.region.toLowerCase().includes(text) ||
          t.center.toLowerCase().includes(text)
        )
      })
  }, [myTickets, tab, search])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-7 lg:px-9">

      {/* The shared Header already shows the "Skilling Tickets" title
          and a back control - this is just the one-line context. */}

      <p className="mb-5 text-sm text-slate-500">
        Tickets assigned to Skilling Support.
      </p>

      {skillingTicketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{skillingTicketsError}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">
            {visibleTickets.length} ticket{visibleTickets.length === 1 ? '' : 's'}
          </p>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
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

        <div className="px-5 pt-1">
          <SupportStageTabs stages={stages} value={tab} onChange={setTab} />
        </div>

        <SupportTicketTable
          tickets={visibleTickets}
          columns={TABLE_COLUMNS}
          onOpen={(id) => navigate(`/skilling-support/tickets/${id}`)}
          actionRoleForTicket={actionRoleForTicket}
          emptyText="No tickets in this status for the current filters."
        />
      </div>

      <div className="h-8" />
    </div>
  )
}

export default SkillingTicketsPage
