import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Forward,
  MessageCircle,
  MessageCircleQuestion,
  PlayCircle,
  Send,
  XCircle,
} from 'lucide-react'

/*
 * ================================================================
 * ACTIVITY TIMELINE
 *
 * Renders the permanent, backend-persisted Ticket Activity history
 * (see weconnect_ticketing.api._log_ticket_activity and the
 * `activity` array every ticket-details mapper in src/api/tickets.js
 * now returns) - never React/local state. One entry per real action,
 * newest first (already sorted by the mapper), each showing the
 * action, who performed it, when, and any comment/reference.
 *
 * Shared by the WeConnect User's own Ticket Details page and both
 * support workspaces' Ticket Details page, so a ticket's full
 * history - including a detour to L2 or an approval decision - stays
 * visible no matter which page it's viewed from, even after the
 * ticket has moved back to a different workflow state.
 * ================================================================
 */

function activityVisual(action = '') {
  const lower = action.toLowerCase()

  if (lower.includes('rejected')) return { Icon: XCircle, accent: 'text-rose-600', bg: 'bg-rose-50' }
  if (lower.includes('approved')) return { Icon: CheckCircle2, accent: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (lower.includes('resolved by l2')) return { Icon: CheckCircle2, accent: 'text-indigo-600', bg: 'bg-indigo-50' }
  if (lower.includes('sent to l2')) return { Icon: ArrowUpRight, accent: 'text-indigo-600', bg: 'bg-indigo-50' }
  if (lower.includes('resolved')) return { Icon: CheckCircle2, accent: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (lower.includes('closed')) return { Icon: CheckCircle2, accent: 'text-slate-500', bg: 'bg-slate-100' }
  if (lower.includes('reopened')) return { Icon: AlertTriangle, accent: 'text-orange-600', bg: 'bg-orange-50' }
  if (lower.includes('forwarded')) return { Icon: Forward, accent: 'text-amber-700', bg: 'bg-amber-50' }
  if (lower.includes('requested')) return { Icon: Send, accent: 'text-violet-600', bg: 'bg-violet-50' }
  if (lower.includes('asked')) return { Icon: MessageCircleQuestion, accent: 'text-blue-600', bg: 'bg-blue-50' }
  if (lower.includes('reply')) return { Icon: MessageCircle, accent: 'text-blue-600', bg: 'bg-blue-50' }
  if (lower.includes('started') || lower.includes('resumed') || lower.includes('created')) {
    return { Icon: PlayCircle, accent: 'text-teal-700', bg: 'bg-teal-50' }
  }

  return { Icon: Clock3, accent: 'text-slate-500', bg: 'bg-slate-100' }
}

/*
 * The backend stores `reference` as a plain value (the L2 ticket
 * number, or the approval type) - labelled here, at render time,
 * based on what kind of action it's attached to, e.g. "L2 Ticket:
 * L2-12345" or "Approval Type: Regional Head".
 */
function referenceLabel(entry) {
  if (!entry.reference) return null

  const lower = entry.action.toLowerCase()
  if (lower.includes('l2')) return `L2 Ticket: ${entry.reference}`
  if (lower.includes('approval')) return `Approval Type: ${entry.reference}`
  return entry.reference
}

function ActivityTimeline({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No activity has been recorded on this ticket yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const { Icon, accent, bg } = activityVisual(entry.action)

        return (
          <div
            key={entry.id}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${accent}`}>
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-xs font-semibold text-slate-800">{entry.action}</p>
                <span className="text-[10px] text-slate-400">{entry.performedOn}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {entry.performedBy || 'System'}
              </p>
              {entry.reference && (
                <p className="mt-1.5 text-xs text-slate-600">{referenceLabel(entry)}</p>
              )}
              {entry.details && (
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                  {entry.details}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ActivityTimeline
