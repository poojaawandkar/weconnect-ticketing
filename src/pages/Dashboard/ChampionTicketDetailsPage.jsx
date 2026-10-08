import { useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

import TicketDetails from '../../components/Dashboard/TicketDetails'
import TicketWorkflowActions from '../../components/Dashboard/TicketWorkflowActions'
import { useTickets } from '../../tickets/useTickets'
import { CHAMPION_ROLE, getActionsForRole } from '../../data/ticketWorkflow'

/*
 * Reuses the same TicketDetails component the User workspace uses
 * (same status rendering, same conversation/reply mechanism) in
 * viewerRole="champion" mode, which hides the requester-only
 * "Resolution doesn't solve my issue" / "Mark as Closed" actions -
 * see the comment on TicketDetails for why.
 *
 * The actual Champion workflow actions (Start Work / Ask User /
 * Resolve / Resume Work) live in a small bar above it, driven by
 * the ticket's current status via TicketWorkflowActions.
 */

function ChampionTicketDetailsPage() {
  const { ticketId } = useParams()
  const { getTicketById } = useTickets()

  const ticket = getTicketById(ticketId)

  const actions = ticket ? getActionsForRole(ticket.status, CHAMPION_ROLE) : []

  return (
    <div>

      {ticket && actions.length > 0 && (
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3">
            <ShieldCheck size={16} className="shrink-0 text-teal-700" />
            <p className="text-xs text-teal-800">
              This ticket is <span className="font-semibold">{ticket.status}</span> - the following Champion actions are available.
            </p>
          </div>

          <TicketWorkflowActions ticket={ticket} role={CHAMPION_ROLE} size="lg" />

        </div>
      )}

      <TicketDetails
        ticket={ticket}
        viewerRole="champion"
      />

    </div>
  )
}

export default ChampionTicketDetailsPage
