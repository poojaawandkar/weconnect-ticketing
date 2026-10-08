/*
 * ================================================================
 * SUPPORT STAGE VIEW HELPERS
 *
 * The horizontal stage tabs on the CenterOps / Skilling / Champion
 * Assigned pages are built ONLY from the real Frappe workflow
 * states in src/data/ticketWorkflow.js (TICKET_STATUSES). No new
 * states are invented here.
 *
 * STAGE_DISPLAY is presentation only - a shorter label for a state
 * whose full name is long (e.g. "WeConnect Support In Progress" ->
 * "In Progress"). The underlying ticket.status is unchanged.
 * ================================================================
 */

import { TICKET_STATUSES } from './ticketWorkflow'

export const STAGE_DISPLAY = {
  Open: 'Open',
  'WeConnect Support In Progress': 'In Progress',
  'Skilling Support In Progress': 'In Progress',
  'Champion In Progress': 'Champion In Progress',
  'Awaiting User': 'Awaiting User',
  'Pending Approval': 'Sent for Approval',
  Resolved: 'Resolved',
  Reopened: 'Reopened',
  Closed: 'Closed',
  'Sent to L2': 'Sent to L2',
}

// Canonical left-to-right ordering for the tabs. Any status not
// listed falls to the end, but every current workflow state is
// covered.
const STAGE_ORDER = [
  'Open',
  'Reopened',
  'WeConnect Support In Progress',
  'Skilling Support In Progress',
  'Sent to L2',
  'Champion In Progress',
  'Awaiting User',
  'Pending Approval',
  'Resolved',
  'Closed',
]

export function stageLabel(status) {
  return STAGE_DISPLAY[status] || status
}

/*
 * Given the tickets currently in scope for a page, returns the
 * stage tabs to render: an "All" tab plus one tab per workflow
 * state that actually occurs in that set, in canonical order.
 */
export function buildStages(tickets) {
  const present = new Set(
    tickets
      .map((ticket) => ticket.status)
      .filter((status) => TICKET_STATUSES.includes(status))
  )

  const ordered = STAGE_ORDER.filter((status) => present.has(status))

  // Defensive: surface any present status the order list somehow
  // doesn't mention rather than hiding those tickets.
  present.forEach((status) => {
    if (!ordered.includes(status)) ordered.push(status)
  })

  return [
    { key: 'ALL', status: null, label: 'All', count: tickets.length },
    ...ordered.map((status) => ({
      key: status,
      status,
      label: stageLabel(status),
      count: tickets.filter((ticket) => ticket.status === status).length,
    })),
  ]
}
