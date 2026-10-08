import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../auth/useAuth'
import { getMyTickets } from '../api/tickets'
import { UserTicketsContext } from './userTicketsContext'

/*
 * ================================================================
 * USER TICKETS PROVIDER
 *
 * Real, live tickets for the WeConnect User workspace (Dashboard,
 * My Tickets, Ticket Details) - fetched from
 * weconnect_ticketing.api.get_my_tickets, which the backend
 * already scopes to `raised_by = frappe.session.user`.
 *
 * This is deliberately separate from src/tickets/TicketsProvider,
 * which still backs the Champion/Support workspaces with seed data
 * that this task does not touch. Mounted once, inside UserRoute, so
 * it only fetches for a session that actually has WeConnect User
 * access.
 * ================================================================
 */

export function UserTicketsProvider({ children }) {
  const { user } = useAuth()

  const [tickets, setTickets] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setTickets([])
      setStatusCounts({})
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const data = await getMyTickets()

      setTickets(data.tickets)
      setStatusCounts(data.statusCounts)
      setError(null)
    } catch (err) {
      console.error('UserTicketsProvider: failed to load tickets', err)
      setError(
        err.message || 'Unable to load your tickets right now.'
      )
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      tickets,
      statusCounts,
      loading,
      error,
      refresh,
    }),
    [tickets, statusCounts, loading, error, refresh]
  )

  return (
    <UserTicketsContext.Provider value={value}>
      {children}
    </UserTicketsContext.Provider>
  )
}
