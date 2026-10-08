import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import TicketDetails from '../../components/Dashboard/TicketDetails'
import { useAuth } from '../../auth/useAuth'
import { useUserTickets } from '../../tickets/useUserTickets'
import {
  getTicketDetails,
  applyTicketAction,
  addTicketComment,
} from '../../api/tickets'

/*
 * ================================================================
 * TICKET DETAILS PAGE
 *
 * Owns the real, live fetch of a single ticket
 * (weconnect_ticketing.api.get_ticket_details) and every mutation
 * TicketDetails can trigger (reopen, accept resolution, comment) -
 * each one re-fetches the full ticket from the backend and also
 * refreshes the shared My Tickets / Dashboard list, so every screen
 * stays in sync with Frappe.
 * ================================================================
 */

function TicketDetailsPage() {
  const navigate = useNavigate()
  const { ticketId } = useParams()
  const { user } = useAuth()
  const { refresh: refreshTicketList } = useUserTickets()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const data = await getTicketDetails(ticketId, user)
      setTicket(data)
      setError(null)
    } catch (err) {
      console.error('TicketDetailsPage: failed to load ticket', err)
      setError(err.message || 'Unable to load this ticket right now.')
    } finally {
      setLoading(false)
    }
  }, [ticketId, user])

  useEffect(() => {
    load()
  }, [load])

  const handleReopen = async () => {
    const updated = await applyTicketAction(ticketId, 'Reopen', user)
    setTicket(updated)
    refreshTicketList()
  }

  const handleAcceptResolution = async () => {
    const updated = await applyTicketAction(ticketId, 'Accept Resolution', user)
    setTicket(updated)
    refreshTicketList()
  }

  const handleSendComment = async (content, files) => {
    const updated = await addTicketComment(ticketId, content, files, user)
    setTicket(updated)
    refreshTicketList()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-slate-400">Loading ticket...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-5 py-24 text-center">

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle size={24} className="text-rose-500" />
        </div>

        <p className="max-w-sm text-sm font-medium text-slate-600">
          {error || 'This ticket could not be found.'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          Back to My Tickets
        </button>

      </div>
    )
  }

  return (
    <TicketDetails
      ticket={ticket}
      onReopen={handleReopen}
      onAcceptResolution={handleAcceptResolution}
      onSendComment={handleSendComment}
    />
  )
}

export default TicketDetailsPage
