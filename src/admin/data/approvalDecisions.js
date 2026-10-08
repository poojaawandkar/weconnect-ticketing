import { useSyncExternalStore } from 'react'

/*
 * ================================================================
 * PROGRAM HEAD APPROVAL DECISIONS  (session-only, mock)
 *
 * A tiny in-memory store for the approve / reject decisions a
 * Program Head makes. It is shared between the Approvals list
 * (/admin/approvals) and the ticket detail page
 * (/admin/tickets/:id) so a decision taken on one screen shows on
 * the other without a reload.
 *
 * Not persisted - it resets on a full page refresh, which is fine
 * for the mock. Swap `recordApprovalDecision` for the Frappe
 * approve/reject endpoint when the API lands.
 *
 *   decisions = { [ticketId]: { status: 'Approved' | 'Rejected',
 *                               remarks: string, decidedAt: number } }
 * ================================================================
 */

let decisions = {}
const listeners = new Set()

export function getApprovalDecisions() {
  return decisions
}

export function getApprovalDecision(ticketId) {
  return decisions[ticketId] || null
}

export function recordApprovalDecision(ticketId, { status, remarks }) {
  decisions = {
    ...decisions,
    [ticketId]: { status, remarks: remarks || '', decidedAt: Date.now() },
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useApprovalDecisions() {
  return useSyncExternalStore(subscribe, getApprovalDecisions)
}
