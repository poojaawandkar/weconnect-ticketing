import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'

import SupportTicketDetail from '../../components/support/SupportTicketDetail'
import { useTickets } from '../../tickets/useTickets'
import { useSkillingSupport } from '../../skilling/useSkillingSupport'

/*
 * Skilling Support's ticket detail - fetches the real Ticket
 * (communication history, attachments, resolution) from Frappe on
 * open, then renders the shared SupportTicketDetail layout, scoped
 * through useSkillingSupport() so the action buttons are only ever
 * the transitions this user may perform on a Skilling-routed
 * ticket.
 */

function SkillingTicketDetailsPage() {
  const { ticketId } = useParams()
  const { getTicketById, fetchSkillingTicketDetails } = useTickets()
  const { actionRoleForTicket } = useSkillingSupport()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchSkillingTicketDetails(ticketId)
      .catch((err) => {
        if (cancelled) return
        console.error('SkillingTicketDetailsPage: failed to load ticket', err)
        setError(err.message || 'Unable to load this ticket right now.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ticketId, fetchSkillingTicketDetails])

  const ticket = getTicketById(ticketId)
  const actionRole = ticket ? actionRoleForTicket(ticket) : null

  if (loading && !ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-5 py-24 text-center">
        <Loader2 size={22} className="animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Loading ticket…</p>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle size={24} className="text-rose-500" />
        </div>
        <p className="max-w-sm text-sm font-medium text-slate-600">{error}</p>
      </div>
    )
  }

  return (
    <>
      {error && ticket && (
        <div className="mx-auto mt-5 flex w-full max-w-[1080px] items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:px-6">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <SupportTicketDetail
        ticket={ticket}
        actionRole={actionRole}
        backTo="/skilling-support/tickets"
        backLabel="Back to Skilling Tickets"
      />
    </>
  )
}

export default SkillingTicketDetailsPage
