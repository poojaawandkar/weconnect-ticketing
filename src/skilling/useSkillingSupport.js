import { useMemo } from 'react'

import { useAuth } from '../auth/useAuth'
import { SKILLING_SUPPORT_ROLE } from '../data/ticketWorkflow'
import { SKILLING_MODULE } from '../data/ticketModules'

/*
 * ================================================================
 * useSkillingSupport
 *
 * The single place the Skilling Support workspace decides what it
 * shows and what it can act on. It is deliberately small - Skilling
 * Support covers exactly one module (Skilling) and holds exactly
 * one team's transitions - so there is nothing to branch on per
 * person. Everything reacts to Frappe roles via useAuth().hasRole.
 *
 *   scopeTickets()        -> only tickets routed to the Skilling
 *                            Support team (module + supportTeam),
 *                            i.e. "assigned to Skilling Support".
 *   actionRoleForTicket() -> SKILLING_SUPPORT_ROLE when the user
 *                            actually holds the role AND the ticket
 *                            is routed to Skilling Support, else
 *                            null (read-only) - never a fabricated
 *                            transition.
 *
 * Champion has no place here: Champion tickets are never routed to
 * a Support team, so scopeTickets() excludes them by construction.
 * ================================================================
 */

export function useSkillingSupport() {
  const { hasRole } = useAuth()

  const isSkillingSupport = hasRole(SKILLING_SUPPORT_ROLE)

  return useMemo(() => {
    const scopeTickets = (tickets = []) =>
      tickets.filter(
        (ticket) =>
          ticket.module === SKILLING_MODULE &&
          ticket.supportTeam === SKILLING_SUPPORT_ROLE
      )

    const actionRoleForTicket = (ticket) =>
      isSkillingSupport && ticket?.supportTeam === SKILLING_SUPPORT_ROLE
        ? SKILLING_SUPPORT_ROLE
        : null

    return {
      isSkillingSupport,
      workspaceLabel: 'Skilling Support',
      module: SKILLING_MODULE,
      scopeTickets,
      actionRoleForTicket,
    }
  }, [isSkillingSupport])
}
