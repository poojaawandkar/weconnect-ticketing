import { useContext } from 'react'

import { UserTicketsContext } from './userTicketsContext'

/*
 * ================================================================
 * useUserTickets()
 *
 * The one sanctioned way for the WeConnect User workspace
 * (Dashboard, My Tickets) to read the real, live tickets the
 * current user has raised. Always call refresh() after a mutation
 * (raising a ticket, a workflow action) instead of reading stale
 * local state.
 * ================================================================
 */

export function useUserTickets() {
  const context = useContext(UserTicketsContext)

  if (context === undefined) {
    throw new Error('useUserTickets must be used within a UserTicketsProvider')
  }

  return context
}
