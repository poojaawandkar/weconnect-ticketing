import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  ShieldCheck,
  Ticket,
} from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { useTickets } from '../../tickets/useTickets'
import { CHAMPION_ROLE, requiresChampionAction } from '../../data/ticketWorkflow'
import { statusStyles } from '../../utils/ticketStyles'
import { currentGreeting } from '../../utils/greeting'
import TicketWorkflowActions from '../../components/Dashboard/TicketWorkflowActions'

/*
 * ================================================================
 * CHAMPION DASHBOARD
 *
 * Operational overview for a WeConnect Champion - the tickets
 * routed to them across their region, not their own tickets.
 * Reads live from useTickets() so actions taken here or on any
 * other Champion page (Resolve, Ask User, Start/Resume Work) are
 * reflected immediately. Dummy data only; not wired to Frappe yet
 * - see src/tickets/TicketsProvider.jsx.
 * ================================================================
 */

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low']

function sortByPriority(list) {
  return [...list].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  )
}

function ChampionDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tickets, activityLog } = useTickets()

  // Friendly greeting derived from the real logged-in Frappe user,
  // never a hardcoded name.
  const displayName = (user || '').split('@')[0]
  const greeting = currentGreeting()

  /* =========================================================
     COUNTS - exact workflow states only
  ========================================================= */

  const counts = useMemo(() => {
    const byStatus = (status) => tickets.filter((t) => t.status === status).length

    return {
      assigned: tickets.length,
      open: byStatus('Open'),
      championInProgress: byStatus('Champion In Progress'),
      awaitingUser: byStatus('Awaiting User'),
      resolved: byStatus('Resolved'),
      reopened: byStatus('Reopened'),
      closed: byStatus('Closed'),
    }
  }, [tickets])

  const priorityTickets = useMemo(
    () => sortByPriority(tickets.filter((t) => requiresChampionAction(t.status))),
    [tickets]
  )

  const moduleData = useMemo(() => {
    const modules = ['Skilling', 'CenterOps']

    return modules.map((name) => {
      const moduleTickets = tickets.filter((t) => t.module === name)

      return {
        name,
        tickets: moduleTickets.length,
        value: Math.round((moduleTickets.length / tickets.length) * 100),
        bar: name === 'Skilling' ? 'bg-teal-500' : 'bg-emerald-500',
      }
    })
  }, [tickets])

  const activityData = [
    { label: 'Open', value: counts.open },
    { label: 'In Progress', value: counts.championInProgress },
    { label: 'Awaiting User', value: counts.awaitingUser },
    { label: 'Resolved', value: counts.resolved },
    { label: 'Reopened', value: counts.reopened },
    { label: 'Closed', value: counts.closed },
  ]

  const maxActivity = Math.max(...activityData.map((a) => a.value), 1)

  const cards = [
    {
      label: 'Assigned to Me',
      value: counts.assigned,
      icon: Ticket,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-700',
    },
    {
      label: 'Open',
      value: counts.open,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      label: 'Champion In Progress',
      value: counts.championInProgress,
      icon: Clock3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Awaiting User',
      value: counts.awaitingUser,
      icon: ShieldCheck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Resolved',
      value: counts.resolved,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Reopened',
      value: counts.reopened,
      icon: RotateCcw,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-7 lg:px-9">

      {/* Welcome */}

      <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1">
            <ShieldCheck size={13} className="text-teal-700" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
              Champion Workspace
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {displayName}
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Here's an overview of your assigned support tickets.
          </p>

        </div>

        <button
          type="button"
          onClick={() => navigate('/champion/action')}
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-medium text-white shadow-sm transition hover:bg-teal-800"
        >
          <ShieldCheck size={17} />
          Review Action Queue
          <ArrowUpRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </button>

      </section>

      {/* Summary cards */}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">

        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-110" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon size={19} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

      </section>

      {/* =====================================================
          REQUIRES MY ACTION
      ====================================================== */}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Tickets Requiring Champion Action
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Open, Reopened, and Champion In Progress - most urgent first
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/champion/action')}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-teal-700 transition hover:text-teal-900"
          >
            View action queue
            <ArrowUpRight size={14} />
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ticket</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Module</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issue</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Region / Center</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Updated</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {priorityTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-400">
                    Nothing requires your action right now.
                  </td>
                </tr>
              )}

              {priorityTickets.map((ticket) => {
                const status = statusStyles[ticket.status]

                return (
                  <tr
                    key={ticket.id}
                    className="group border-b border-slate-50 transition hover:bg-slate-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/champion/tickets/${ticket.id}`)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        {ticket.id}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-700">
                      {ticket.module}
                    </td>
                    <td className="max-w-[240px] px-5 py-4">
                      <p className="truncate text-xs text-slate-600">
                        {ticket.issue}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {ticket.region} · {ticket.center}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${status.background} ${status.text}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[10px] text-slate-400">
                      {ticket.updatedDate}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <TicketWorkflowActions ticket={ticket} role={CHAMPION_ROLE} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

        </div>

      </section>

      {/* =====================================================
          CHARTS
      ====================================================== */}

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.85fr_0.85fr]">

        {/* Ticket Activity */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ticket Activity
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Status breakdown of assigned tickets
              </p>
            </div>
          </div>

          <div className="mt-7 flex h-44 items-end gap-4 border-b border-l border-slate-100 px-4 pb-0 pt-5">
            {activityData.map((item) => (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] font-semibold text-slate-500">
                  {item.value}
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-lg bg-teal-500/90 transition hover:bg-teal-600"
                  style={{
                    height: `${Math.max((item.value / maxActivity) * 100, 6)}%`,
                  }}
                />
                <span className="mb-2 text-center text-[8px] leading-tight text-slate-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Tickets by Module */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Tickets by Module
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Skilling vs CenterOps
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {moduleData.map((module) => (
              <div key={module.name}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${module.bar}`} />
                    <span className="text-xs font-medium text-slate-600">
                      {module.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {module.tickets}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${module.bar}`}
                    style={{ width: `${module.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3">
            <FileText size={16} className="text-teal-700" />
            <span className="text-xs text-teal-800">
              {tickets.length} tickets tracked this cycle
            </span>
          </div>

        </div>

        {/* Recent Champion Activity */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Recent Activity
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Latest updates on your queue
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {activityLog.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-slate-600">
                    {activity.text}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </section>

      <div className="h-8" />

    </div>
  )
}

export default ChampionDashboard
