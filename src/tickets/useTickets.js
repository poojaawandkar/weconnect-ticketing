import { useContext } from 'react'

import { TicketsContext } from './ticketsContext'

/*
 * The one sanctioned way to read/mutate ticket data for any
 * role-based workspace (Champion, WeConnect Support, Skilling
 * Support). Status changes always go through the exposed
 * transition functions (startWork/resumeWork/submitForApproval/
 * resolve/askUser) with an explicit role, never by writing
 * `status` directly - those functions are themselves validated
 * against ROLE_TRANSITIONS in TicketsProvider.
 */

export function useTickets() {
  const context = useContext(TicketsContext)

  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider')
  }

  return context
}
