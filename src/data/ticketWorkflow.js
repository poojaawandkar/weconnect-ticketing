/*
 * ================================================================
 * TICKET WORKFLOW (single source of truth)
 *
 * This mirrors the EXISTING Frappe Ticket Workflow exactly, as
 * given to us - this frontend has no way to read the live
 * DocType/Workflow definition itself, so these values must be
 * kept in sync by hand if the real workflow changes.
 *
 * Do not add, rename, or remove a status or transition here
 * without the change first existing in Frappe.
 *
 * Shared by every role-based workspace (Champion, WeConnect
 * Support, Skilling Support) via the generic getActionsForRole() /
 * roleRequiresAction() below - there is exactly one transition
 * table per role, and no page decides validity on its own.
 * ================================================================
 */

// All 10 states that exist in the workflow.
export const TICKET_STATUSES = [
  'Open',
  'Champion In Progress',
  'Awaiting User',
  'Resolved',
  'Pending Approval',
  'Closed',
  'Reopened',
  'WeConnect Support In Progress',
  'Skilling Support In Progress',
  'Sent to L2',
]

/*
 * The exact Frappe role strings that grant access to a role-based
 * workspace. These are the ONLY role names ever compared against
 * in this app - see src/auth/AuthContext.jsx.
 */
export const CHAMPION_ROLE = 'WeConnect Champion'
export const WECONNECT_SUPPORT_ROLE = 'WeConnect Support'
export const SKILLING_SUPPORT_ROLE = 'Skilling Support'
export const SUPPORT_ROLES = [WECONNECT_SUPPORT_ROLE, SKILLING_SUPPORT_ROLE]

/*
 * The analytical Admin workspace (dashboards / trend analysis /
 * reports). It performs no ticket transitions - it has no entry in
 * ROLE_TRANSITIONS - so it never appears in getActionsForRole().
 */
export const ADMIN_ROLE = 'WeConnect Admin'

/*
 * The Program Head. Same analytical workspace as Admin (no ticket
 * transitions - not in ROLE_TRANSITIONS), plus the ability to
 * approve / reject Pending Approval requests from the Approvals
 * tab. The approve/reject decision itself is recorded in Frappe;
 * the frontend just drives the action.
 */
export const PROGRAM_HEAD_ROLE = 'Program Head'

/*
 * The Regional Head. Same analytical workspace as Admin / Program
 * Head, but every screen is restricted to the region(s) assigned to
 * that Regional Head - never organization-wide. Can approve /
 * reject the "Regional Head" approval requests that fall in their
 * region.
 */
export const REGIONAL_HEAD_ROLE = 'Regional Head'

/*
 * Every transition already configured in Frappe, grouped by the
 * role allowed to perform it. This is the ONLY table any status
 * change may come from - every action button in the UI is
 * generated from this list for the role actually checking it, so a
 * transition that doesn't exist here, or that exists but for a
 * different role, cannot be triggered from the frontend.
 */
export const ROLE_TRANSITIONS = {
  [CHAMPION_ROLE]: {
    START_WORK: {
      from: 'Open',
      to: 'Champion In Progress',
      label: 'Start Work',
    },
    ASK_USER: {
      from: 'Champion In Progress',
      to: 'Awaiting User',
      label: 'Ask User',
    },
    RESOLVE: {
      from: 'Champion In Progress',
      to: 'Resolved',
      label: 'Resolve',
    },
    RESUME_WORK: {
      from: 'Reopened',
      to: 'Champion In Progress',
      label: 'Resume Work',
    },
  },

  [WECONNECT_SUPPORT_ROLE]: {
    START_WORK: {
      from: 'Open',
      to: 'WeConnect Support In Progress',
      label: 'Start Work',
    },
    ASK_USER: {
      from: 'WeConnect Support In Progress',
      to: 'Awaiting User',
      label: 'Ask User',
    },
    SUBMIT_FOR_APPROVAL: {
      from: 'WeConnect Support In Progress',
      to: 'Pending Approval',
      label: 'Submit for Approval',
    },
    RESOLVE: {
      from: 'WeConnect Support In Progress',
      to: 'Resolved',
      label: 'Resolve',
    },
    /*
     * Same real-workflow quirk as Skilling Support (see below):
     * Reopened -> WeConnect Support In Progress is the same "Start
     * Work" action/transition as Open -> ...In Progress, not a
     * separate "Resume Work" transition. Same key, same label, same
     * startWork() call as START_WORK above.
     */
    START_WORK_FROM_REOPENED: {
      from: 'Reopened',
      to: 'WeConnect Support In Progress',
      label: 'Start Work',
    },
    /*
     * The real Ticket Workflow's actual "Resume Work" transition:
     * WeConnect Support picking a ticket back up themselves while it
     * is Awaiting User, without waiting for the requester's reply.
     */
    RESUME_WORK: {
      from: 'Awaiting User',
      to: 'WeConnect Support In Progress',
      label: 'Resume Work',
    },
    /*
     * Escalation, not a hand-off: the ticket stays owned by WeConnect
     * Support (support_team is untouched) while a second, external L2
     * system works it. This transition now exists in the real Frappe
     * Ticket Workflow.
     */
    NEED_L2: {
      from: 'WeConnect Support In Progress',
      to: 'Sent to L2',
      label: 'Need L2',
    },
    /*
     * L2 hands it back to the SAME team that escalated it - the real
     * Ticket Workflow has a "Resolved by L2" transition per team, and
     * the backend's escalate/resolve-from-L2 methods are split the
     * same way (Skilling vs WeConnect) precisely so this always lands
     * back with the ticket's own support_team, never the other team's.
     */
    RESOLVED_BY_L2: {
      from: 'Sent to L2',
      to: 'WeConnect Support In Progress',
      label: 'Resolved by L2',
    },
  },

  [SKILLING_SUPPORT_ROLE]: {
    START_WORK: {
      from: 'Open',
      to: 'Skilling Support In Progress',
      label: 'Start Work',
    },
    ASK_USER: {
      from: 'Skilling Support In Progress',
      to: 'Awaiting User',
      label: 'Ask User',
    },
    RESOLVE: {
      from: 'Skilling Support In Progress',
      to: 'Resolved',
      label: 'Resolve',
    },
    /*
     * The real Ticket Workflow reuses the exact same "Start Work"
     * action for Reopened -> Skilling Support In Progress as it does
     * for Open -> Skilling Support In Progress - there is no separate
     * "Resume Work" transition from Reopened. This is a second entry
     * (rather than reusing the START_WORK key above) only because
     * this table holds one entry per starting status; it carries the
     * same label and is wired to the same startWork() call in
     * TicketWorkflowActions.jsx.
     */
    START_WORK_FROM_REOPENED: {
      from: 'Reopened',
      to: 'Skilling Support In Progress',
      label: 'Start Work',
    },
    /*
     * The real Ticket Workflow's actual "Resume Work" transition:
     * Skilling Support picking a ticket back up themselves while it
     * is Awaiting User, without waiting for the requester's reply
     * (which resumes the ticket automatically via a separate "Reply"
     * transition the WeConnect User holds).
     */
    RESUME_WORK: {
      from: 'Awaiting User',
      to: 'Skilling Support In Progress',
      label: 'Resume Work',
    },
    /*
     * Hand-off, not a new parallel workflow. When Skilling Support
     * cannot resolve a ticket they pass it to WeConnect Support -
     * this moves the ticket straight into WeConnect Support's
     * existing "In Progress" state (the backend also re-routes
     * supportTeam to WeConnect Support so it leaves the Skilling
     * queue). This transition now exists in the real Frappe Ticket
     * Workflow.
     */
    FORWARD_TO_WECONNECT: {
      from: 'Skilling Support In Progress',
      to: 'WeConnect Support In Progress',
      label: 'Forward to WeConnect Support',
    },
    /*
     * Escalation, not a hand-off: the ticket stays owned by Skilling
     * Support (support_team is untouched) while a second, external L2
     * system works it. This transition now exists in the real Frappe
     * Ticket Workflow.
     */
    NEED_L2: {
      from: 'Skilling Support In Progress',
      to: 'Sent to L2',
      label: 'Need L2',
    },
    /*
     * L2 hands it back to the SAME team that escalated it - see the
     * matching note on WECONNECT_SUPPORT_ROLE.RESOLVED_BY_L2 above.
     */
    RESOLVED_BY_L2: {
      from: 'Sent to L2',
      to: 'Skilling Support In Progress',
      label: 'Resolved by L2',
    },
  },
}

// Kept for the Champion workspace's existing call sites.
export const CHAMPION_TRANSITIONS = ROLE_TRANSITIONS[CHAMPION_ROLE]

/*
 * Which actions a given ROLE may take on a ticket currently in a
 * given STATUS. Drives every action button in every role-based
 * workspace - a status/role combination not covered by
 * ROLE_TRANSITIONS above simply returns no actions.
 */
export function getActionsForRole(status, role) {
  const transitions = ROLE_TRANSITIONS[role]

  if (!transitions) {
    return []
  }

  return Object.entries(transitions)
    .filter(([, transition]) => transition.from === status)
    .map(([key, transition]) => ({ key, ...transition }))
}

/*
 * True when at least one transition is available to `role` from
 * `status` - this is what "requires my action" means everywhere in
 * this app, never a hand-picked list of statuses or ticket IDs.
 */
export function roleRequiresAction(status, role) {
  return getActionsForRole(status, role).length > 0
}

/*
 * The two L2 escalation actions live on a status ("Sent to L2") that,
 * unlike every other status in this workflow, does not by itself say
 * which team owns the ticket - WeConnect Support In Progress and
 * Skilling Support In Progress both escalate into this exact same
 * state. Every other status only ever occurs for the team that
 * legitimately holds it (support_team is set at creation and never
 * changes except via an explicit hand-off), so no equivalent guard is
 * needed anywhere else.
 */
const L2_ACTION_KEYS = new Set(['NEED_L2', 'RESOLVED_BY_L2'])

/*
 * Same as getActionsForRole(), but for a real ticket rather than a
 * bare status string - required so the two L2 actions above are only
 * offered when the ticket's own support_team actually matches `role`.
 * WeConnect Support's broader "any routed ticket" scope
 * (useSupportScope.actionRoleForTicket) would otherwise also offer
 * "Resolved by L2" on a ticket Skilling Support escalated, and firing
 * it would send the ticket back to the wrong team's queue - the real
 * Ticket Workflow has a same-named "Resolved by L2" transition per
 * team precisely so each team's own action returns to its own queue.
 * Every other transition in ROLE_TRANSITIONS is unaffected: a role
 * only ever has a matching `from` status for tickets it legitimately
 * owns already, so this filter never changes their behaviour.
 */
export function getTicketActionsForRole(ticket, role) {
  const actions = getActionsForRole(ticket?.status, role)

  if (!ticket) return actions

  return actions.filter(
    (action) => !L2_ACTION_KEYS.has(action.key) || ticket.supportTeam === role
  )
}

export function ticketRequiresAction(ticket, role) {
  return getTicketActionsForRole(ticket, role).length > 0
}

/*
 * The "in progress" status for a role - derived from that role's
 * own START_WORK transition target rather than guessed by string
 * concatenation (e.g. "<role> In Progress"), so it stays correct
 * even if a role's in-progress status name doesn't follow that
 * pattern.
 */
export function getInProgressStatus(role) {
  return ROLE_TRANSITIONS[role]?.START_WORK?.to || null
}

// Backward-compatible Champion-specific wrappers (unchanged
// signatures) - implemented on top of the generic functions above
// so the Champion pages didn't need to change to support this.
export function getChampionActions(status) {
  return getActionsForRole(status, CHAMPION_ROLE)
}

export function requiresChampionAction(status) {
  return roleRequiresAction(status, CHAMPION_ROLE)
}

/*
 * Validates and resolves a transition for a role. Throws if the
 * transition isn't defined for that role, or isn't valid from the
 * ticket's current status - the guard that makes an invented or
 * out-of-order status change impossible via this function.
 */
export function resolveTransition(currentStatus, role, actionKey) {
  const transition = ROLE_TRANSITIONS[role]?.[actionKey]

  if (!transition || transition.from !== currentStatus) {
    throw new Error(
      `"${actionKey}" is not a valid transition for role "${role}" from status "${currentStatus}".`
    )
  }

  return transition
}
