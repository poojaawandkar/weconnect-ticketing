import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, ShieldAlert, Wrench } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { CHAMPION_ROLE, requiresChampionAction } from '../../data/ticketWorkflow'
import { priorityStyles } from '../../utils/ticketStyles'
import TicketWorkflowActions from '../../components/Dashboard/TicketWorkflowActions'

/*
 * ================================================================
 * REQUIRES MY ACTION
 *
 * Driven entirely by workflow state via requiresChampionAction()
 * (src/data/ticketWorkflow.js) - never a hand-picked list of ticket
 * IDs. That function returns true for any status a Champion
 * transition is available from, which today is exactly Open,
 * Reopened, and Champion In Progress (Ask User/Resolve). If Frappe
 * ever adds a Champion transition from another status, it appears
 * here automatically without a frontend change.
 * ================================================================
 */

const STATUS_GROUPS = [
  {
    status: 'Open',
    description: "New tickets that haven't been started yet.",
    icon: ShieldAlert,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    status: 'Reopened',
    description: 'Requester wasn\'t satisfied with the resolution.',
    icon: RotateCcw,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    status: 'Champion In Progress',
    description: 'Being worked on - ask the requester a question or resolve.',
    icon: Wrench,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
]

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low']

function sortByPriority(list) {
  return [...list].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  )
}

function ChampionAction() {
  const navigate = useNavigate()
  const { tickets } = useTickets()

  const grouped = useMemo(() => {
    const actionTickets = tickets.filter((t) => requiresChampionAction(t.status))

    return STATUS_GROUPS.map((group) => ({
      ...group,
      tickets: sortByPriority(actionTickets.filter((t) => t.status === group.status)),
    }))
  }, [tickets])

  const totalActionable = grouped.reduce((sum, group) => sum + group.tickets.length, 0)

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-7 sm:px-7 lg:px-9">

      {/* No repeated "Requires My Action" title here - the shared
          Header already shows the page title and a back control. */}

      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <p className="text-sm text-slate-500">
          Open, Reopened, and Champion In Progress tickets, most urgent first.
        </p>

        <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-2.5">
          <p className="text-xs text-violet-600">Total pending</p>
          <p className="mt-0.5 text-lg font-semibold text-violet-700">
            {totalActionable}
          </p>
        </div>

      </div>

      {/* Status groups */}

      <div className="space-y-5">

        {grouped.map(({ status, description, icon: Icon, iconBg, iconColor, tickets: groupTickets }) => (
          <section
            key={status}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {status}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {groupTickets.length}
              </span>
            </div>

            {groupTickets.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {groupTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/champion/tickets/${ticket.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-teal-700">
                          {ticket.id}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-xs text-slate-400">
                          {ticket.module} · {ticket.subModule}
                        </span>
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${priorityStyles[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium text-slate-700">
                        {ticket.issue}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {ticket.region} · {ticket.center} · Requester: {ticket.requesterRole} · Created {ticket.createdDate}
                      </p>
                    </button>

                    <div className="shrink-0">
                      <TicketWorkflowActions ticket={ticket} role={CHAMPION_ROLE} size="lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center sm:px-6">
                <p className="text-xs text-slate-400">
                  Nothing here right now.
                </p>
              </div>
            )}

          </section>
        ))}

      </div>

      <div className="h-8" />

    </div>
  )
}

export default ChampionAction
