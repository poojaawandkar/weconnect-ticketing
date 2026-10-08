import { useMemo } from 'react'

import { useAuth } from '../auth/useAuth'
import {
  WECONNECT_SUPPORT_ROLE,
  SKILLING_SUPPORT_ROLE,
} from '../data/ticketWorkflow'
import {
  CENTEROPS_MODULE,
  SKILLING_MODULE,
} from '../data/ticketModules'

/*
 * ================================================================
 * useSupportScope
 *
 * The single place the two Support roles' different access is
 * expressed. Every Support page derives what it shows/does from
 * this - nothing is hardcoded per person, and it reacts to Frappe
 * role changes because it reads useAuth().hasRole.
 *
 *   WeConnect Support -> CenterOps + Skilling, can request approval
 *   Skilling Support  -> Skilling only, no approval action
 *
 * actionRoleForTicket():
 *   - a WeConnect Support user may act on ANY routed ticket AS
 *     WeConnect Support - including tickets currently routed to
 *     Skilling Support (they help with / take over Skilling work).
 *     The workflow table still gates what is actually available for
 *     the ticket's current status, so nothing invalid is offered.
 *   - a Skilling-Support-only user may act only on Skilling-routed
 *     tickets, as Skilling Support.
 * ================================================================
 */

export function useSupportScope() {
  const { hasRole } = useAuth()

  const isWeConnectSupport = hasRole(WECONNECT_SUPPORT_ROLE)
  const isSkillingSupport = hasRole(SKILLING_SUPPORT_ROLE)

  return useMemo(() => {
    const modules = isWeConnectSupport
      ? [CENTEROPS_MODULE, SKILLING_MODULE]
      : isSkillingSupport
        ? [SKILLING_MODULE]
        : []

    /*
     * Only tickets actually routed to a support team - a ticket
     * still sitting with a Champion (or otherwise unrouted) is not
     * part of the WeConnect Support workspace. This is what keeps
     * Champion-held tickets and the "Champion In Progress" status
     * out of every Support page.
     */
    const scopeTickets = (tickets = []) =>
      tickets.filter(
        (ticket) => modules.includes(ticket.module) && Boolean(ticket.supportTeam)
      )

    const actionRoleForTicket = (ticket) => {
      if (!ticket?.supportTeam) return null

      // WeConnect Support can pick up any routed ticket (CenterOps
      // or Skilling) as WeConnect Support.
      if (isWeConnectSupport) return WECONNECT_SUPPORT_ROLE

      if (
        ticket.supportTeam === SKILLING_SUPPORT_ROLE &&
        isSkillingSupport
      ) {
        return SKILLING_SUPPORT_ROLE
      }

      return null
    }

    return {
      isWeConnectSupport,
      isSkillingSupport,
      isSupport: isWeConnectSupport || isSkillingSupport,
      modules,
      canRequestApproval: isWeConnectSupport,
      workspaceLabel:
        isWeConnectSupport && isSkillingSupport
          ? 'WeConnect + Skilling Support'
          : isWeConnectSupport
            ? 'WeConnect Support'
            : isSkillingSupport
              ? 'Skilling Support'
              : 'Support',
      scopeTickets,
      actionRoleForTicket,
    }
  }, [isWeConnectSupport, isSkillingSupport])
}
