import { useCallback, useEffect, useMemo, useState } from 'react'

import { seedTickets as allSeedTickets } from '../data/championTickets'
import {
  ROLE_TRANSITIONS,
  WECONNECT_SUPPORT_ROLE,
  SKILLING_SUPPORT_ROLE,
} from '../data/ticketWorkflow'
import { useAuth } from '../auth/useAuth'
import {
  getSkillingSupportTickets,
  getSkillingSupportTicketDetails,
  startSkillingTicketWork,
  resumeSkillingTicketWork,
  askSkillingTicketUser,
  resolveSkillingTicket,
  forwardSkillingTicketToWeConnect,
  escalateSkillingTicketToL2,
  resolveSkillingTicketFromL2,
  getWeConnectSupportTickets,
  getWeConnectSupportTicketDetails,
  startWeConnectTicketWork,
  resumeWeConnectTicketWork,
  askWeConnectTicketUser,
  resolveWeConnectTicket,
  submitWeConnectTicketForApproval,
  escalateWeConnectTicketToL2,
  resolveWeConnectTicketFromL2,
} from '../api/tickets'
import { TicketsContext } from './ticketsContext'

/*
 * ================================================================
 * TICKETS PROVIDER
 *
 * Holds every role-based workspace's ticket data (Champion,
 * WeConnect Support, Skilling Support) and is the ONLY place that
 * mutates ticket status.
 *
 * Skilling Support and WeConnect Support tickets are both real, live
 * Frappe data now (see src/api/tickets.js) - fetched, scoped and
 * acted on entirely server-side for the logged-in user. Champion is
 * UNCHANGED and continues on the existing dummy seed
 * (src/data/championTickets.js) with the same local-mutation logic
 * as before - that is a separate, later task.
 *
 * Every Champion mutation is still looked up in ROLE_TRANSITIONS
 * (src/data/ticketWorkflow.js) for the role actually performing it,
 * so a transition that doesn't exist in the real Frappe workflow, or
 * that exists for a different role, cannot be applied here.
 *
 * Identity for anything written by a Champion action comes from
 * useAuth().user - the real logged-in Frappe user - never a
 * hardcoded name. Skilling Support and WeConnect Support actions
 * carry no local identity at all - the backend records who performed
 * them.
 * ================================================================
 */

// Any ticket already routed to a support team (Skilling Support or
// WeConnect Support) now lives entirely in real Frappe data -
// excluded from the seed so nothing is ever shown twice or falls
// back to fake data for either team. What's left in the seed is only
// genuinely Champion-only / unrouted tickets.
const unroutedSeedTickets = allSeedTickets.filter((ticket) => !ticket.supportTeam)

function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatNow() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// A short display initials pair derived from the real logged-in
// user's identifier (e.g. an email's local part) - never a
// hardcoded name.
function initialsFor(identity) {
  const local = (identity || '').split('@')[0]
  return (local.slice(0, 2) || '??').toUpperCase()
}

// Later entries win - used to dedupe the merged ticket list for a
// user who holds both Skilling Support and WeConnect Support roles,
// where the same ticket could otherwise be fetched into both real
// data sources at once.
function dedupeById(lists) {
  const byId = new Map()
  lists.forEach((list) => {
    list.forEach((ticket) => byId.set(ticket.id, ticket))
  })
  return Array.from(byId.values())
}

let activityIdCounter = 1000

export function TicketsProvider({ children }) {
  const { user, hasRole } = useAuth()
  const isSkillingSupport = hasRole(SKILLING_SUPPORT_ROLE)
  const isWeConnectSupport = hasRole(WECONNECT_SUPPORT_ROLE)

  const [otherTickets, setOtherTickets] = useState(unroutedSeedTickets)

  /*
   * ============================================================
   * SKILLING SUPPORT - REAL FRAPPE DATA (unchanged)
   * ============================================================
   */

  const [skillingTickets, setSkillingTickets] = useState([])
  const [skillingTicketsLoading, setSkillingTicketsLoading] = useState(true)
  const [skillingTicketsError, setSkillingTicketsError] = useState(null)

  const refreshSkillingTickets = useCallback(async () => {
    if (!isSkillingSupport) {
      setSkillingTickets([])
      setSkillingTicketsLoading(false)
      return
    }

    setSkillingTicketsLoading(true)

    try {
      const data = await getSkillingSupportTickets()
      setSkillingTickets(data.tickets)
      setSkillingTicketsError(null)
    } catch (err) {
      console.error('TicketsProvider: failed to load Skilling Support tickets', err)
      setSkillingTicketsError(
        err.message || 'Unable to load Skilling Support tickets right now.'
      )
    } finally {
      setSkillingTicketsLoading(false)
    }
  }, [isSkillingSupport])

  useEffect(() => {
    refreshSkillingTickets()
  }, [refreshSkillingTickets])

  const fetchSkillingTicketDetails = useCallback(
    async (ticketId) => {
      const detail = await getSkillingSupportTicketDetails(ticketId, user)

      setSkillingTickets((previous) => {
        const exists = previous.some((t) => t.id === ticketId)
        return exists
          ? previous.map((t) => (t.id === ticketId ? detail : t))
          : [...previous, detail]
      })

      return detail
    },
    [user]
  )

  /*
   * ============================================================
   * WECONNECT SUPPORT - REAL FRAPPE DATA
   *
   * Team-wide, not per-user: every ticket routed to a support team
   * across Center Ops and Skilling (see get_weconnect_support_tickets
   * on the backend) - never filtered to "assigned to me".
   * ============================================================
   */

  const [weConnectTickets, setWeConnectTickets] = useState([])
  const [weConnectTicketsLoading, setWeConnectTicketsLoading] = useState(true)
  const [weConnectTicketsError, setWeConnectTicketsError] = useState(null)

  const refreshWeConnectTickets = useCallback(async () => {
    if (!isWeConnectSupport) {
      setWeConnectTickets([])
      setWeConnectTicketsLoading(false)
      return
    }

    setWeConnectTicketsLoading(true)

    try {
      const data = await getWeConnectSupportTickets()
      setWeConnectTickets(data.tickets)
      setWeConnectTicketsError(null)
    } catch (err) {
      console.error('TicketsProvider: failed to load WeConnect Support tickets', err)
      setWeConnectTicketsError(
        err.message || 'Unable to load WeConnect Support tickets right now.'
      )
    } finally {
      setWeConnectTicketsLoading(false)
    }
  }, [isWeConnectSupport])

  useEffect(() => {
    refreshWeConnectTickets()
  }, [refreshWeConnectTickets])

  const fetchWeConnectTicketDetails = useCallback(
    async (ticketId) => {
      const detail = await getWeConnectSupportTicketDetails(ticketId, user)

      setWeConnectTickets((previous) => {
        const exists = previous.some((t) => t.id === ticketId)
        return exists
          ? previous.map((t) => (t.id === ticketId ? detail : t))
          : [...previous, detail]
      })

      return detail
    },
    [user]
  )

  const tickets = useMemo(
    () => dedupeById([otherTickets, skillingTickets, weConnectTickets]),
    [otherTickets, skillingTickets, weConnectTickets]
  )

  const [activityLog, setActivityLog] = useState([
    { id: 1, text: 'WC-2036 - Champion started work on this ticket.', time: 'Yesterday' },
    { id: 2, text: 'WC-2030 - Champion asked the requester for more information.', time: '2 days ago' },
    { id: 3, text: 'WC-2024 - marked Resolved.', time: '5 days ago' },
    { id: 4, text: 'WC-2026 - requester reopened after resolution.', time: 'Today' },
    { id: 5, text: 'WC-2017 - WeConnect Support started work on this ticket.', time: '2 days ago' },
    { id: 6, text: 'WC-2016 - Skilling Support started work on this ticket.', time: '3 days ago' },
  ])

  const logActivity = useCallback((text) => {
    activityIdCounter += 1

    setActivityLog((previous) => [
      { id: activityIdCounter, text, time: 'Just now' },
      ...previous,
    ])
  }, [])

  /*
   * ============================================================
   * APPLY TRANSITION (Champion only)
   *
   * The single place a CHAMPION ticket's status is written locally.
   * Looks up ROLE_TRANSITIONS[role][actionKey] and validates it
   * against the ticket's current status before writing anything.
   * Skilling Support and WeConnect Support never reach this - their
   * transitions go straight to Frappe (see below).
   * ============================================================
   */

  const applyTransition = useCallback(
    (ticketId, role, actionKey, extraFields = {}) => {
      const transition = ROLE_TRANSITIONS[role]?.[actionKey]

      if (!transition) {
        console.error(`"${actionKey}" is not a defined transition for role "${role}".`)
        return
      }

      setOtherTickets((previous) =>
        previous.map((ticket) => {
          if (ticket.id !== ticketId) {
            return ticket
          }

          if (ticket.status !== transition.from) {
            console.error(
              `Cannot apply "${transition.label}" (${role}) to ${ticketId}: expected status "${transition.from}", found "${ticket.status}".`
            )
            return ticket
          }

          return {
            ...ticket,
            ...extraFields,
            status: transition.to,
            updatedDate: formatToday(),
          }
        })
      )

      return transition
    },
    []
  )

  /*
   * ============================================================
   * START WORK / RESUME WORK
   *
   * Skilling Support / WeConnect Support: real Frappe workflow
   * transition, then the returned ticket replaces the local copy -
   * never a guessed status. Champion: unchanged local mutation.
   * ============================================================
   */

  const startWork = useCallback(
    async (ticketId, role) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const updated = await startSkillingTicketWork(ticketId, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const updated = await startWeConnectTicketWork(ticketId, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      const transition = applyTransition(ticketId, role, 'START_WORK')
      if (transition) {
        logActivity(`${ticketId} - ${role} started work on this ticket.`)
      }
    },
    [user, applyTransition, logActivity]
  )

  const resumeWork = useCallback(
    async (ticketId, role) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const updated = await resumeSkillingTicketWork(ticketId, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const updated = await resumeWeConnectTicketWork(ticketId, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      const transition = applyTransition(ticketId, role, 'RESUME_WORK')
      if (transition) {
        logActivity(`${ticketId} - ${role} resumed work after it was reopened.`)
      }
    },
    [user, applyTransition, logActivity]
  )

  const submitForApproval = useCallback(
    (ticketId, role) => {
      // Dead code path in practice - WeConnect Support's real Submit
      // for Approval always goes through requestApproval() below
      // (opened via the modal), and no other role holds this
      // transition. Left as the local Champion-style fallback only
      // for structural symmetry with the other transition helpers.
      const transition = applyTransition(ticketId, role, 'SUBMIT_FOR_APPROVAL')
      if (transition) {
        logActivity(`${ticketId} - ${role} submitted this ticket for approval.`)
      }
    },
    [applyTransition, logActivity]
  )

  /*
   * ============================================================
   * REQUEST APPROVAL (WeConnect Support only)
   *
   * WeConnect Support In Progress -> Submit for Approval -> Pending
   * Approval, the real Frappe transition. Only approval_type (and an
   * optional note, stored as Approval Comments) are sent - the
   * existing "Ticket Approval Creation" Server Script resolves the
   * actual recipient and creates the Ticket Approval record; that
   * routing is not duplicated here.
   * ============================================================
   */

  const requestApproval = useCallback(
    async (ticketId, approval) => {
      const updated = await submitWeConnectTicketForApproval(
        ticketId,
        approval.approverType,
        approval.note,
        user
      )
      setWeConnectTickets((previous) =>
        previous.map((t) => (t.id === ticketId ? updated : t))
      )
    },
    [user]
  )

  /*
   * ============================================================
   * FORWARD TO WECONNECT SUPPORT (Skilling Support only, unchanged)
   * ============================================================
   */

  const forwardToWeConnect = useCallback(
    async (ticketId, reason) => {
      const updated = await forwardSkillingTicketToWeConnect(ticketId, reason, user)
      setSkillingTickets((previous) =>
        previous.map((t) => (t.id === ticketId ? updated : t))
      )
    },
    [user]
  )

  /*
   * ============================================================
   * NEED L2 / RESOLVED BY L2
   *
   * Skilling Support / WeConnect Support only, dispatched to the
   * matching team's real Frappe transition by `role` - same
   * replace-with-whatever-Frappe-returns pattern as every other
   * action above, never a locally guessed status.
   * ============================================================
   */

  const escalateToL2 = useCallback(
    async (ticketId, l2TicketNumber, role) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const updated = await escalateSkillingTicketToL2(ticketId, l2TicketNumber, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const updated = await escalateWeConnectTicketToL2(ticketId, l2TicketNumber, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
      }
    },
    [user]
  )

  const resolveFromL2 = useCallback(
    async (ticketId, role) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const updated = await resolveSkillingTicketFromL2(ticketId, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const updated = await resolveWeConnectTicketFromL2(ticketId, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
      }
    },
    [user]
  )

  /*
   * ============================================================
   * RESOLVE
   *
   * Skilling Support / WeConnect Support: uploads any attached files
   * to Frappe first (the existing uploadFile() integration - never a
   * local blob URL), then calls the real Resolve transition.
   * Champion: unchanged local mutation.
   * ============================================================
   */

  const resolve = useCallback(
    async (ticketId, resolutionText, attachments = [], role, issueType) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const files = attachments.map((a) => a.file).filter(Boolean)
        const updated = await resolveSkillingTicket(ticketId, resolutionText, issueType, files, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const files = attachments.map((a) => a.file).filter(Boolean)
        const updated = await resolveWeConnectTicket(ticketId, resolutionText, issueType, files, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      const transition = applyTransition(ticketId, role, 'RESOLVE', {
        resolution: resolutionText,
        resolutionAttachments: attachments,
        resolvedAt: new Date().toISOString(),
        resolvedBy: user,
      })
      if (transition) {
        logActivity(`${ticketId} - marked Resolved by ${role}.`)
      }
    },
    [user, applyTransition, logActivity]
  )

  /*
   * ============================================================
   * ASK USER
   *
   * Skilling Support / WeConnect Support: uploads any attached files
   * to Frappe first, then calls the real Ask User transition.
   * Champion: unchanged local mutation.
   * ============================================================
   */

  const askUser = useCallback(
    async (ticketId, message, attachments = [], role) => {
      if (role === SKILLING_SUPPORT_ROLE) {
        const files = attachments.map((a) => a.file).filter(Boolean)
        const updated = await askSkillingTicketUser(ticketId, message, files, user)
        setSkillingTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      if (role === WECONNECT_SUPPORT_ROLE) {
        const files = attachments.map((a) => a.file).filter(Boolean)
        const updated = await askWeConnectTicketUser(ticketId, message, files, user)
        setWeConnectTickets((previous) =>
          previous.map((t) => (t.id === ticketId ? updated : t))
        )
        return
      }

      const transition = ROLE_TRANSITIONS[role]?.ASK_USER

      if (!transition) {
        console.error(`"ASK_USER" is not a defined transition for role "${role}".`)
        return
      }

      setOtherTickets((previous) =>
        previous.map((ticket) => {
          if (ticket.id !== ticketId) {
            return ticket
          }

          if (ticket.status !== transition.from) {
            console.error(
              `Cannot apply "Ask User" (${role}) to ${ticketId}: expected status "${transition.from}", found "${ticket.status}".`
            )
            return ticket
          }

          const newMessage = {
            id: Date.now(),
            sender: user,
            role,
            initials: initialsFor(user),
            type: 'support',
            time: formatNow(),
            timestamp: new Date().toISOString(),
            message,
            attachments,
          }

          return {
            ...ticket,
            status: transition.to,
            updatedDate: formatToday(),
            conversation: [
              ...(ticket.conversation || []),
              newMessage,
            ],
          }
        })
      )

      logActivity(`${ticketId} - ${role} asked the requester for more information.`)
    },
    [user, logActivity]
  )

  const getTicketById = useCallback(
    (ticketId) => tickets.find((ticket) => ticket.id === ticketId),
    [tickets]
  )

  const value = useMemo(
    () => ({
      tickets,
      activityLog,
      startWork,
      resumeWork,
      submitForApproval,
      requestApproval,
      forwardToWeConnect,
      escalateToL2,
      resolveFromL2,
      resolve,
      askUser,
      getTicketById,
      skillingTicketsLoading,
      skillingTicketsError,
      refreshSkillingTickets,
      fetchSkillingTicketDetails,
      weConnectTicketsLoading,
      weConnectTicketsError,
      refreshWeConnectTickets,
      fetchWeConnectTicketDetails,
    }),
    [
      tickets,
      activityLog,
      startWork,
      resumeWork,
      submitForApproval,
      requestApproval,
      forwardToWeConnect,
      escalateToL2,
      resolveFromL2,
      resolve,
      askUser,
      getTicketById,
      skillingTicketsLoading,
      skillingTicketsError,
      refreshSkillingTickets,
      fetchSkillingTicketDetails,
      weConnectTicketsLoading,
      weConnectTicketsError,
      refreshWeConnectTickets,
      fetchWeConnectTicketDetails,
    ]
  )

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  )
}
