import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  HeadphonesIcon,
  MessageCircleQuestion,
  Ticket,
} from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { useTickets } from '../../tickets/useTickets'
import { useSkillingSupport } from '../../skilling/useSkillingSupport'
import { ticketRequiresAction } from '../../data/ticketWorkflow'
import { statusStyles } from '../../utils/ticketStyles'
import { stageLabel } from '../../data/supportStages'
import { isToday, shortDate } from '../../utils/ticketDates'
import { awaitingSupportReview } from '../../data/ticketConversation'
import { usePeriodFilter } from '../../components/charts/usePeriodFilter'
import { usePagination } from '../../components/common/usePagination'
import Pagination from '../../components/common/Pagination'
import SupportSummaryCards from '../../components/support/SupportSummaryCards'
import SkillingAnalytics from '../../components/skilling/SkillingAnalytics'
import TicketWorkflowActions from '../../components/Dashboard/TicketWorkflowActions'

/*
 * ================================================================
 * SKILLING SUPPORT DASHBOARD
 *
 * A calm operational overview for the Skilling Support workspace -
 * one module, one team, so no module split, no approval queue
 * (Skilling Support holds no approval transition), no Champion
 * anything.
 *
 *   TOP      workspace indicator + "Support overview, {name}" +
 *            period filter (All time / Yearly / Monthly / Weekly /
 *            Daily - see usePeriodFilter), which scopes the cards
 *            and both charts
 *   CARDS    Total / Open / In Progress / Awaiting User /
 *            Resolved / Closed
 *   CHARTS   Tickets by Status (bars) + Tickets by Sub-module
 *            (donut), side by side
 *   QUEUE    "Requires Attention" - tickets raised today OR where
 *            the requester just replied, and this user has a
 *            transition available right now
 *
 * Dummy data via useTickets(); scoped through useSkillingSupport()
 * so swapping in real Frappe Ticket data needs no UI change.
 * ================================================================
 */

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low']

function SkillingSupportDashboard() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const { tickets, skillingTicketsError } = useTickets()
  const { workspaceLabel, scopeTickets, actionRoleForTicket } = useSkillingSupport()

  const { controls: periodControls, filter: filterByPeriod, label: periodLabel } =
    usePeriodFilter()

  const myTickets = useMemo(() => scopeTickets(tickets), [tickets, scopeTickets])

  const periodTickets = useMemo(
    () => filterByPeriod(myTickets),
    [myTickets, filterByPeriod]
  )

  const counts = useMemo(() => {
    const inRange = periodTickets
    return {
      total: inRange.length,
      open: inRange.filter((t) => t.status === 'Open').length,
      inProgress: inRange.filter((t) => t.status === 'Skilling Support In Progress').length,
      awaitingUser: inRange.filter((t) => t.status === 'Awaiting User').length,
      resolved: inRange.filter((t) => t.status === 'Resolved').length,
      closed: inRange.filter((t) => t.status === 'Closed').length,
    }
  }, [periodTickets])

  const cards = [
    { label: 'Total Tickets', value: counts.total, icon: Ticket, iconBg: 'bg-teal-50', iconColor: 'text-teal-700' },
    { label: 'Open', value: counts.open, icon: AlertTriangle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { label: 'In Progress', value: counts.inProgress, icon: Clock3, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Awaiting User', value: counts.awaitingUser, icon: MessageCircleQuestion, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Resolved', value: counts.resolved, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Closed', value: counts.closed, icon: CheckCircle2, iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
  ]

  /*
   * Purely workflow-driven AND raised today: a ticket is here only
   * if this user has a real transition available on it right now
   * and it came in today. The full actionable backlog (older Open /
   * In Progress / Reopened tickets) lives on the Skilling Tickets
   * page, by status tab.
   */
  const actionQueue = useMemo(
    () =>
      myTickets
        .filter((t) => isToday(t.createdDate) || awaitingSupportReview(t))
        .filter((t) => {
          const role = actionRoleForTicket(t)
          return role && ticketRequiresAction(t, role)
        })
        .sort(
          (a, b) =>
            PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
        ),
    [myTickets, actionRoleForTicket]
  )

  const queuePager = usePagination(actionQueue)

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-7 lg:px-9">

      {skillingTicketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{skillingTicketsError}</span>
        </div>
      )}

      {/* Header */}

      <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1">
            <HeadphonesIcon size={13} className="text-teal-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
              {workspaceLabel} Workspace
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Support overview, {displayName}
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Skilling tickets assigned to your team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Showing</span>
          {periodControls}
        </div>
      </section>

      {/* Summary cards */}

      <SupportSummaryCards cards={cards} columnsClassName="sm:grid-cols-3 xl:grid-cols-6" />

      {/* Analytics */}

      <div className="mt-5">
        <SkillingAnalytics periodTickets={periodTickets} label={periodLabel} />
      </div>

      {/* Requires attention */}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Requires Attention</p>
            <p className="mt-1 text-xs text-slate-400">
              Raised today, or the requester just replied · most urgent first
            </p>
          </div>
          <span className="w-fit rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
            {actionQueue.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {actionQueue.length === 0 && (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <CheckCircle2 size={22} className="text-slate-300" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">Nothing needs you now</p>
              <p className="mt-1 text-xs text-slate-400">
                No tickets raised today and no new replies. Open{' '}
                <button
                  type="button"
                  onClick={() => navigate('/skilling-support/tickets')}
                  className="font-medium text-teal-700 hover:text-teal-900"
                >
                  Skilling Tickets
                </button>{' '}
                for the full queue.
              </p>
            </div>
          )}

          {queuePager.pageItems.map((ticket) => {
            const style = statusStyles[ticket.status] || statusStyles.Open

            return (
              <div
                key={ticket.id}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/skilling-support/tickets/${ticket.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700">{ticket.id}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[11px] text-slate-400">{ticket.subModule}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.background} ${style.text}`}
                    >
                      {stageLabel(ticket.status)}
                    </span>
                    {awaitingSupportReview(ticket) && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        Requester replied
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-slate-700">
                    {ticket.issue}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {ticket.region} · {ticket.center} · Updated {shortDate(ticket.updatedDate)}
                  </p>
                </button>

                <div className="shrink-0">
                  <TicketWorkflowActions ticket={ticket} role={actionRoleForTicket(ticket)} />
                </div>
              </div>
            )
          })}
        </div>

        <Pagination {...queuePager} />
      </section>

      <div className="h-8" />
    </div>
  )
}

export default SkillingSupportDashboard
