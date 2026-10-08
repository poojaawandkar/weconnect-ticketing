import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { useSupportScope } from '../../support/useSupportScope'
import { awaitingSupportReview } from '../../data/ticketConversation'
import { SKILLING_MODULE } from '../../data/ticketModules'
import { WECONNECT_SUPPORT_ROLE } from '../../data/ticketWorkflow'
import SupportStageTabs from './SupportStageTabs'
import SupportTicketTable from './SupportTicketTable'

/*
 * ================================================================
 * MODULE TICKETS WORKSPACE
 *
 * The shared, clean ticket workspace behind the CenterOps Tickets
 * and Skilling Tickets pages (WeConnect Support). Same pattern as
 * the Skilling Support "Skilling Tickets" page:
 *
 *   one-line context  ->  count + search  ->  fixed status tabs
 *   ->  one operational table (paginated 5 per page)
 *
 * The Skilling page also gets a "From Skilling" tab tracking
 * tickets Skilling Support has forwarded to WeConnect Support.
 *
 * Row actions come from useSupportScope().actionRoleForTicket -
 * WeConnect Support can act on any routed ticket (CenterOps or
 * Skilling) as WeConnect Support; the workflow table gates what is
 * actually available.
 * ================================================================
 */

const STATUS_TABS = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'Open', label: 'Open', match: (t) => t.status === 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress', match: (t) => t.status.includes('In Progress') },
  { key: 'REPLIED', label: 'Replied', match: (t) => awaitingSupportReview(t) },
  { key: 'Awaiting User', label: 'Awaiting User', match: (t) => t.status === 'Awaiting User' },
  { key: 'Sent to L2', label: 'Sent to L2', match: (t) => t.status === 'Sent to L2' },
  { key: 'Pending Approval', label: 'Pending Approval', match: (t) => t.status === 'Pending Approval' },
  { key: 'Resolved', label: 'Resolved', match: (t) => t.status === 'Resolved' },
  { key: 'Closed', label: 'Closed', match: (t) => t.status === 'Closed' },
  { key: 'Reopened', label: 'Reopened', match: (t) => t.status === 'Reopened' },
]

/*
 * A ticket forwarded from Skilling Support has no dedicated
 * "forwarded from" field in Frappe - it's identified from the real
 * fields the Forward transition actually changes: still module
 * Skilling, now support_team WeConnect Support, with the hand-off
 * note left in Forward Reason.
 */
const FROM_SKILLING_TAB = {
  key: 'FROM_SKILLING',
  label: 'From Skilling',
  match: (t) =>
    t.module === SKILLING_MODULE &&
    t.supportTeam === WECONNECT_SUPPORT_ROLE &&
    Boolean(t.forwardReason),
}

const TABLE_COLUMNS = ['ticket', 'issue', 'subModule', 'center', 'status', 'action']

function ModuleTicketsWorkspace({ module, subtitle }) {
  const navigate = useNavigate()
  const { tickets, weConnectTicketsError } = useTickets()
  const { scopeTickets, actionRoleForTicket } = useSupportScope()

  const [tab, setTab] = useState('ALL')
  const [search, setSearch] = useState('')

  const tabList = useMemo(
    () =>
      module === SKILLING_MODULE
        ? [STATUS_TABS[0], FROM_SKILLING_TAB, ...STATUS_TABS.slice(1)]
        : STATUS_TABS,
    [module]
  )

  const moduleTickets = useMemo(
    () => scopeTickets(tickets).filter((t) => t.module === module),
    [tickets, scopeTickets, module]
  )

  const stages = useMemo(
    () =>
      tabList.map((entry) => ({
        key: entry.key,
        label: entry.label,
        count: moduleTickets.filter(entry.match).length,
      })),
    [moduleTickets, tabList]
  )

  const visibleTickets = useMemo(() => {
    const text = search.trim().toLowerCase()
    const activeTab = tabList.find((entry) => entry.key === tab) || tabList[0]

    return moduleTickets
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
  }, [moduleTickets, tabList, tab, search])

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-9">

      <p className="mb-5 text-sm text-slate-500">{subtitle}</p>

      {weConnectTicketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{weConnectTicketsError}</span>
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
          onOpen={(id) => navigate(`/support/tickets/${id}`)}
          actionRoleForTicket={actionRoleForTicket}
          emptyText="No tickets in this view for the current filters."
        />
      </div>

      <div className="h-8" />
    </div>
  )
}

export default ModuleTicketsWorkspace
