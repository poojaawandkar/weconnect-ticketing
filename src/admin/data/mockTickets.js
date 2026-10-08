import { useEffect, useSyncExternalStore } from 'react'

import { callMethod } from '../../api/frappe'
import { displayNameFromUser } from '../../auth/identity'
import { statusGroupOf } from './dimensions'

/*
 * ================================================================
 * ADMIN WORKSPACE - REAL FRAPPE BACKED
 *
 * Was a synthetic mock dataset; now fetches every ticket from
 * weconnect_ticketing.api.get_admin_tickets and maps it onto the
 * EXACT same ticket shape the mock produced, so analytics.js and
 * useAdminFilters.jsx keep working unchanged:
 *
 *   id, module, subModule, region, center, supportTeam, priority,
 *   status, statusGroup, issueTheme,
 *   subject, description, raisedBy,
 *   createdAt, startedAt|null, firstResponseAt|null,
 *   resolvedAt|null, closedAt|null,
 *   reopened (int), awaitingUserHours, approval|null,
 *   timeToStart, timeToFirstResponse, timeToResolution,
 *   activeHandling, approvalWaitHours, ageDays
 *
 * Kept at this file path/name so nothing importing from it
 * (AdminTicketDetails.jsx, Reports.jsx, useAdminFilters.jsx, ...)
 * needs its import path changed.
 *
 * A network fetch can't be synchronous the way the old in-memory
 * generator was, so this is a small shared store (the same
 * useSyncExternalStore pattern already used by
 * admin/data/approvalDecisions.js in this same folder):
 * getAdminTickets() keeps returning a plain array instantly (empty
 * until the first fetch resolves, then the real one); a component
 * that needs to re-render once real data arrives calls
 * useAdminTicketsSync() instead (see useAdminFilters.jsx).
 *
 * NOT YET AVAILABLE FROM FRAPPE (left null, never fabricated):
 * `startedAt`/`firstResponseAt`/`activeHandling`/`awaitingUserHours`
 * have no discrete backing timestamp on the real Ticket DocType
 * today (only `creation`, `resolved_on`, `closed_on` and the
 * approval timestamps are tracked) - the Support Performance metrics
 * built from them will read as no-data until Frappe tracks those
 * moments explicitly.
 * ================================================================
 */

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

// Real Frappe Ticket Module docname for CenterOps is "Center Ops"
// (with a space) - translated here at the mapper boundary, same as
// the Skilling/WeConnect Support mappers in src/api/tickets.js. The
// real Frappe module itself is never renamed.
const MODULE_DISPLAY = { 'Center Ops': 'CenterOps', Skilling: 'Skilling' }
function displayModule(rawModule) {
  return MODULE_DISPLAY[rawModule] || rawModule
}

function toDate(value) {
  return value ? new Date(value) : null
}

function mapAdminTicket(raw) {
  const now = new Date()
  const createdAt = toDate(raw.creation) || now
  const resolvedAt = toDate(raw.resolved_on)
  const closedAt = toDate(raw.closed_on)

  const hasApproval =
    Boolean(raw.approval_type) &&
    Boolean(raw.approval_status) &&
    raw.approval_status !== 'Not Required'

  const approvalRequestedAt = toDate(raw.approval_requested_on)
  const approvalDecidedAt = toDate(raw.approval_responded_on)

  return {
    id: raw.name,
    module: displayModule(raw.module),
    subModule: raw.sub_module,
    region: raw.region,
    center: raw.center,
    supportTeam: raw.support_team,
    priority: raw.priority,
    status: raw.status,
    statusGroup: statusGroupOf(raw.status),
    // Real Ticket has no separate "issue theme" dimension - the real
    // Issue Type fills that role instead of an invented taxonomy.
    issueTheme: raw.issue_type || '',
    subject: raw.subject,
    description: raw.description,
    raisedBy: displayNameFromUser(raw.raised_by),
    // Not part of the original mock shape, but real fields the Admin
    // API already returns - harmless additions for later use.
    currentHandler: raw.current_handler || null,
    assignedSupportUser: raw.assigned_support_user || null,

    createdAt,
    startedAt: null,
    firstResponseAt: null,
    resolvedAt,
    closedAt,
    reopened: raw.reopen_count || 0,
    awaitingUserHours: null,

    approval: hasApproval
      ? {
          type: raw.approval_type,
          status: raw.approval_status,
          requestedAt: approvalRequestedAt,
          decidedAt: approvalDecidedAt,
          // No discrete "requested by" user field on the real
          // Ticket - the existing UI already falls back to
          // supportTeam when this is empty.
          requestedBy: null,
          note: raw.approval_comments || '',
        }
      : null,

    timeToStart: null,
    timeToFirstResponse: null,
    timeToResolution: resolvedAt ? (resolvedAt.getTime() - createdAt.getTime()) / HOUR : null,
    activeHandling: null,
    approvalWaitHours: hasApproval
      ? approvalDecidedAt && approvalRequestedAt
        ? (approvalDecidedAt.getTime() - approvalRequestedAt.getTime()) / HOUR
        : approvalRequestedAt
          ? (now.getTime() - approvalRequestedAt.getTime()) / HOUR
          : null
      : null,
    ageDays: ((resolvedAt || closedAt || now).getTime() - createdAt.getTime()) / DAY,
  }
}

/* ---------------------------------------------------------------
 * Shared store - one fetch, shared by every Admin page.
 * ------------------------------------------------------------- */

let tickets = []
let fetchStarted = false
const listeners = new Set()

// useSyncExternalStore requires getSnapshot to return a STABLE
// reference when nothing has changed (returning a fresh `{loading,
// error}` object literal on every call is exactly the "getSnapshot
// should be cached" infinite-loop footgun) - so status is one
// module-level object, only ever replaced (never mutated in place)
// when loading/error actually change.
let status = { loading: true, error: null }

function setStatus(next) {
  status = { ...status, ...next }
}

function notify() {
  listeners.forEach((fn) => fn())
}

async function fetchAdminTickets() {
  if (fetchStarted) return
  fetchStarted = true

  try {
    const data = await callMethod('weconnect_ticketing.api.get_admin_tickets', {
      method: 'GET',
    })
    tickets = (data || []).map(mapAdminTicket)
    setStatus({ loading: false, error: null })
  } catch (err) {
    console.error('Admin workspace: failed to load tickets', err)
    setStatus({ loading: false, error: err.message || 'Unable to load tickets right now.' })
  } finally {
    notify()
  }
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Instant, synchronous read - unchanged call sites (AdminTicketDetails.jsx,
// Reports.jsx, useAdminFilters.jsx) keep working exactly as before, just
// against real data once the fetch (triggered by useAdminTicketsSync()
// below) has resolved.
export function getAdminTickets() {
  return tickets
}

// Forces a fresh fetch - call after a real write (e.g. a Program
// Head approval decision) so the shared store reflects it, including
// after a full page refresh (the next mount just fetches again).
export async function refreshAdminTickets() {
  fetchStarted = false
  await fetchAdminTickets()
}

/*
 * Program Head's real Approve / Reject decision - the real Ticket
 * Workflow ("Approval Granted" / "Approval Rejected"), never a
 * manually-set status. See
 * weconnect_ticketing.api.decide_program_head_approval.
 */
export async function decideProgramHeadApproval(ticketId, decision, remarks) {
  const result = await callMethod('weconnect_ticketing.api.decide_program_head_approval', {
    params: { ticket_id: ticketId, decision, remarks: remarks || undefined },
  })
  await refreshAdminTickets()
  return result
}

/*
 * Regional Head's real Approve / Reject decision - the exact mirror
 * of decideProgramHeadApproval() above, backed by
 * weconnect_ticketing.api.decide_regional_head_approval (the same
 * real Ticket Workflow transitions, gated by the Regional Head
 * DocType-resolved approval_recipient). Replaces the old session-
 * only recordApprovalDecision() mock - a Regional Head's decision is
 * now written to the real Ticket / Ticket Approval records, the
 * same as Program Head's always has been.
 */
export async function decideRegionalHeadApproval(ticketId, decision, remarks) {
  const result = await callMethod('weconnect_ticketing.api.decide_regional_head_approval', {
    params: { ticket_id: ticketId, decision, remarks: remarks || undefined },
  })
  await refreshAdminTickets()
  return result
}

// Starts the fetch (once) and keeps the calling component in sync -
// call this from any Admin page/hook that renders before another
// page has already triggered the fetch.
export function useAdminTicketsSync() {
  useEffect(() => {
    fetchAdminTickets()
  }, [])
  return useSyncExternalStore(subscribe, () => tickets)
}

export function useAdminTicketsStatus() {
  return useSyncExternalStore(subscribe, () => status)
}

export { MODULES } from './dimensions'
