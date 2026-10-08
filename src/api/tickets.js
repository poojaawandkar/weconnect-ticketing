import { callMethod, uploadFile, FrappeApiError } from './frappe'
import { displayNameFromUser, initialsFromUser } from '../auth/identity'

/*
 * ================================================================
 * SHARED TICKET DATA - REAL FRAPPE BACKED
 *
 * Replaces src/data/tickets.js for the WeConnect User workspace.
 * Every function here talks to weconnect_ticketing.api and maps
 * the real Frappe field names onto the same ticket shape the
 * existing Dashboard/My Tickets/Ticket Details UI already expects
 * (id, module, subModule, issue, status, priority, date, time...),
 * so the presentational components didn't need to be redesigned.
 * ================================================================
 */

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/*
 * ================================================================
 * TICKET FORM OPTIONS (Raise Ticket dropdowns)
 * ================================================================
 */

export async function getTicketFormOptions() {
  const data = await callMethod(
    'weconnect_ticketing.api.get_ticket_form_options',
    { method: 'GET' }
  )

  return {
    modules: (data?.modules || []).map((row) => row.name),
    subModulesByModule: (data?.sub_modules || []).reduce((acc, row) => {
      if (!acc[row.module]) acc[row.module] = []
      acc[row.module].push(row.name)
      return acc
    }, {}),
    issueTypes: (data?.issue_types || []).map((row) => row.name),
    regions: (data?.regions || []).map((row) => row.name),
    centersByRegion: (data?.centers || []).reduce((acc, row) => {
      if (!acc[row.region]) acc[row.region] = []
      acc[row.region].push(row.name)
      return acc
    }, {}),
    priorities: data?.priorities || [],
  }
}

/*
 * ================================================================
 * CREATE TICKET
 *
 * Uploads every selected file first. If any upload fails, the
 * ticket is NOT created - the caller sees exactly which file
 * failed instead of ending up with a ticket silently missing an
 * attachment.
 * ================================================================
 */

export async function createTicket({
  subject,
  description,
  module,
  subModule,
  priority,
  region,
  center,
  raisedBy,
  raisedAsLighthouseRole,
  files = [],
}) {
  const attachments = []

  for (const file of files) {
    try {
      const uploaded = await uploadFile(file)
      attachments.push({
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
      })
    } catch (error) {
      throw new FrappeApiError(
        `Failed to upload "${file.name}": ${error.message}. The ticket was not created - remove or retry the attachment and submit again.`,
        { status: error.status }
      )
    }
  }

  return callMethod('weconnect_ticketing.api.create_ticket', {
    params: {
      subject,
      description,
      module,
      sub_module: subModule,
      // issue_type is no longer collected from the raiser - support
      // sets the confirmed classification at resolution time (see
      // resolution_issue_type / TicketWorkflowActions.jsx's Issue
      // Type picker). The backend leaves this optional now.
      priority,
      region,
      center,
      // The requesting user. The backend also derives this from the
      // session, so this is only an explicit echo - kept because the
      // Lighthouse Role options are the ones assigned to this user.
      raised_by: raisedBy,
      // Exact mandatory Frappe Ticket fieldname - the Lighthouse Role
      // the requester is raising this ticket under.
      raised_as_lighthouse_role: raisedAsLighthouseRole,
      attachments,
    },
  })
}

/*
 * ================================================================
 * MAP: RAW TICKET (list row) -> UI SHAPE
 * ================================================================
 */

function mapTicketSummary(raw) {
  return {
    id: raw.name,
    module: raw.module,
    subModule: raw.sub_module,
    issueType: raw.issue_type,
    issue: raw.subject,
    title: raw.subject,
    description: raw.description,
    status: raw.status,
    workflowState: raw.workflow_state,
    priority: raw.priority,
    assignedTo: raw.current_handler || null,
    region: raw.region,
    center: raw.center,
    resolutionAccepted: raw.resolution_accepted,
    approvalStatus: raw.approval_status,
    resolvedOn: raw.resolved_on,
    closedOn: raw.closed_on,
    lastResponseOn: raw.last_response_on,
    creation: raw.creation,
    date: formatDate(raw.creation),
    time: formatTime(raw.creation),
  }
}

/*
 * ================================================================
 * MY TICKETS
 * ================================================================
 */

export async function getMyTickets({ status } = {}) {
  const data = await callMethod('weconnect_ticketing.api.get_my_tickets', {
    method: 'GET',
    params: status ? { status } : undefined,
  })

  return {
    tickets: (data?.tickets || []).map(mapTicketSummary),
    totalCount: data?.total_count || 0,
    statusCounts: data?.status_counts || {},
  }
}

/*
 * ================================================================
 * MAP: RAW TICKET DETAILS -> UI SHAPE
 *
 * `currentUser` is the real logged-in Frappe user, used only to
 * label which comments were written by "You" vs. the support side
 * - never to decide what data is fetched.
 * ================================================================
 */

/*
 * ================================================================
 * MAP: ACTIVITY HISTORY (Ticket Activity child table)
 *
 * Shared by the WeConnect User / Skilling Support / WeConnect
 * Support detail mappers below - the same permanent, backend-
 * persisted audit trail regardless of which workspace is viewing
 * it. Rows come back oldest-first (child table insertion order);
 * reversed here so the UI always renders newest-first without
 * every caller having to remember to do it.
 * ================================================================
 */

function mapActivityEntry(entry) {
  return {
    id: entry.name,
    action: entry.action,
    previousStatus: entry.previous_status || null,
    newStatus: entry.new_status || null,
    performedBy: entry.performed_by ? displayNameFromUser(entry.performed_by) : null,
    performedOn: formatDateTime(entry.performed_on),
    timestamp: entry.performed_on,
    details: entry.details || null,
    reference: entry.reference || null,
  }
}

function mapActivityHistory(raw) {
  return [...(raw.activity_history || [])].reverse().map(mapActivityEntry)
}

/*
 * Two source shapes merge here: Frappe's core Comment doctype (the
 * requester's own replies - comment_by/content/creation, no
 * message_type) and the Ticket Communication child table (support's
 * own asks/replies - sender/message/sent_on/message_type). Identity
 * ('You' vs a support name) is always "is this the viewer's own
 * message" - never the raw message_type string, which is a label
 * ("Support Reply") not a side marker, and would otherwise never
 * equal the 'user'/'support' values the UI actually checks.
 */
function mapComment(entry, currentUser) {
  const senderId = entry.sender || entry.comment_by
  const isSelf = senderId === currentUser
  const timestamp = entry.sent_on || entry.creation

  return {
    id: entry.name,
    sender: isSelf ? 'You' : displayNameFromUser(senderId),
    role: entry.sender_role || (isSelf ? 'WeConnect User' : 'Support'),
    initials: initialsFromUser(senderId),
    type: isSelf ? 'user' : 'support',
    time: formatDateTime(timestamp),
    timestamp,
    message: entry.message || entry.content,
    attachments: [],
  }
}

/*
 * Merges the requester's own replies (raw.comments) with support's
 * own asks/replies (raw.communications) into one chronological
 * thread - both are real, permanent Frappe data (Comment doctype /
 * Ticket Communication child table respectively); neither is ever
 * dropped in favour of the other the way an `a || b` fallback would.
 */
function mapConversation(raw, currentUser, mapper = mapComment) {
  return [...(raw.communications || []), ...(raw.comments || [])]
    .sort((a, b) => new Date(a.sent_on || a.creation || 0) - new Date(b.sent_on || b.creation || 0))
    .map((entry) => mapper(entry, currentUser))
}

function mapTicketDetails(raw, currentUser) {
  return {
    id: raw.name,
    title: raw.subject,
    module: raw.module,
    subModule: raw.sub_module,
    issueType: raw.issue_type,
    priority: raw.priority,
    status: raw.status,
    workflowState: raw.workflow_state,
    raisedBy: displayNameFromUser(raw.raised_by),
    raisedByEmail: raw.raised_by,
    raisedDate: formatDate(raw.creation),
    raisedTime: formatTime(raw.creation),
    assignedTo: raw.current_handler || null,
    region: raw.region,
    center: raw.center,
    description: raw.description,
    resolution: raw.resolution,
    resolvedAt: raw.resolved_on,
    resolvedBy: raw.resolution_provided_by
      ? displayNameFromUser(raw.resolution_provided_by)
      : null,
    resolutionAccepted: raw.resolution_accepted,
    approvalStatus: raw.approval_status,
    closedOn: raw.closed_on,
    attachments: (raw.attachments || []).map((attachment) => ({
      id: attachment.name,
      name: attachment.file_name || attachment.file_url,
      url: attachment.file_url,
      description: attachment.description,
    })),
    conversation: mapConversation(raw, currentUser),
    activity: mapActivityHistory(raw),
    reference: '',
  }
}

/*
 * ================================================================
 * TICKET DETAILS
 * ================================================================
 */

export async function getTicketDetails(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.get_ticket_details', {
    method: 'GET',
    params: { ticket_id: ticketId },
  })

  return mapTicketDetails(data, currentUser)
}

/*
 * ================================================================
 * WORKFLOW ACTIONS - "Accept Resolution" / "Reopen"
 *
 * The only two Ticket Workflow transitions a WeConnect User
 * performs themselves, on their own ticket.
 * ================================================================
 */

export async function applyTicketAction(ticketId, action, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.apply_ticket_action', {
    params: { ticket_id: ticketId, action },
  })

  return mapTicketDetails(data, currentUser)
}

/*
 * ================================================================
 * ADD COMMENT (with optional attachments)
 * ================================================================
 */

export async function addTicketComment(ticketId, content, files = [], currentUser) {
  const attachments = []

  for (const file of files) {
    try {
      const uploaded = await uploadFile(file)
      attachments.push({
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
      })
    } catch (error) {
      throw new FrappeApiError(
        `Failed to upload "${file.name}": ${error.message}. Your reply was not sent.`,
        { status: error.status }
      )
    }
  }

  const data = await callMethod('weconnect_ticketing.api.add_ticket_comment', {
    params: { ticket_id: ticketId, content, attachments },
  })

  return mapTicketDetails(data, currentUser)
}

/*
 * ================================================================
 * SKILLING SUPPORT WORKSPACE - REAL FRAPPE BACKED
 *
 * Backs src/tickets/TicketsProvider.jsx for the Skilling Support
 * role only (see src/skilling/useSkillingSupport.js). Every list and
 * detail call is scoped SERVER-SIDE to Module = "Skilling",
 * Support Team = "Skilling Support" and the logged-in user's actual
 * Skilling Support coverage - nothing here filters by user, region
 * or center on the frontend, and no user/region/center is ever
 * hardcoded.
 * ================================================================
 */

async function uploadTicketAttachments(files, failureContext) {
  const attachments = []

  for (const file of files) {
    try {
      const uploaded = await uploadFile(file)
      attachments.push({
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
      })
    } catch (error) {
      throw new FrappeApiError(
        `Failed to upload "${file.name}": ${error.message}. ${failureContext}`,
        { status: error.status }
      )
    }
  }

  return attachments
}

function mapSupportAttachment(attachment) {
  return {
    id: attachment.name,
    name: attachment.file_name || attachment.file_url,
    url: attachment.file_url,
    description: attachment.description,
  }
}

/*
 * List rows carry only the last message's direction/preview (not the
 * full thread) so the ticket list stays light - this is exactly what
 * awaitingSupportReview() / lastConversationMessage()
 * (src/data/ticketConversation.js) need to drive the dashboard's
 * "Requires Attention" queue and the ticket list's "Replied" tab.
 * The full communication history is fetched on the ticket detail
 * page (see mapSkillingTicketDetails below).
 */
function mapLastResponse(raw) {
  if (!raw.last_response_by) return []

  return [{
    id: 'last-response',
    type: raw.last_response_by, // 'user' | 'support'
    sender: raw.last_response_by === 'user' ? 'Requester' : (raw.support_team || 'Skilling Support'),
    role: raw.last_response_by === 'user' ? 'Requester' : (raw.support_team || 'Skilling Support'),
    initials: raw.last_response_by === 'user' ? 'RQ' : 'SS',
    time: formatDateTime(raw.last_response_on),
    timestamp: raw.last_response_on,
    message: raw.last_response_message || '',
    attachments: [],
  }]
}

function mapSkillingTicketSummary(raw) {
  return {
    id: raw.name,
    module: raw.module,
    subModule: raw.sub_module,
    issueType: raw.issue_type,
    issue: raw.subject,
    title: raw.subject,
    description: raw.description,
    status: raw.status,
    workflowState: raw.workflow_state,
    priority: raw.priority,
    requestType: raw.request_type,
    requesterRole: raw.raised_as_role || raw.requester_role || null,
    raisedBy: displayNameFromUser(raw.raised_by),
    region: raw.region,
    center: raw.center,
    supportTeam: raw.support_team,
    currentHandler: raw.current_handler || null,
    assignedSupportUser: raw.assigned_support_user || raw.current_handler || null,
    forwardReason: raw.forward_reason || null,
    forwardedFrom: raw.forwarded_from || null,
    createdDate: raw.creation,
    updatedDate: raw.modified,
    lastResponseOn: raw.last_response_on,
    resolutionDue: raw.resolution_due,
    resolvedOn: raw.resolved_on,
    l2Required: Boolean(raw.l2_required),
    l2Status: raw.l2_status || null,
    l2TicketNumber: raw.l2_ticket_number || null,
    l2SentOn: raw.l2_sent_on || null,
    l2MarkedBy: raw.l2_marked_by ? displayNameFromUser(raw.l2_marked_by) : null,
    l2ResolutionReceivedOn: raw.l2_resolution_received_on || null,
    l2ResolutionReceivedBy: raw.l2_resolution_received_by
      ? displayNameFromUser(raw.l2_resolution_received_by)
      : null,
    l2Duration: raw.l2_duration || null,
    conversation: mapLastResponse(raw),
  }
}

function mapSkillingComment(entry, currentUser) {
  const senderId = entry.sender || entry.comment_by
  const isSelf = senderId === currentUser

  return {
    id: entry.name,
    sender: isSelf ? 'You' : displayNameFromUser(senderId),
    role: entry.sender_role || (isSelf ? 'Skilling Support' : 'Requester'),
    initials: initialsFromUser(senderId),
    // Side marker for the UI's left/right bubble layout - always
    // "is this the viewer's own message", never the raw message_type
    // label (e.g. "Support Reply"), which never equals 'user'/'support'.
    type: isSelf ? 'support' : 'user',
    time: formatDateTime(entry.creation || entry.sent_on),
    timestamp: entry.creation || entry.sent_on,
    message: entry.content || entry.message,
    attachments: (entry.attachments || []).map(mapSupportAttachment),
  }
}

function mapSkillingTicketDetails(raw, currentUser) {
  return {
    ...mapSkillingTicketSummary(raw),
    raisedByEmail: raw.raised_by,
    resolution: raw.resolution,
    // The support agent's own confirmed classification, set when
    // resolving - separate from `issueType` above (the reporter's
    // guess at raise time, still used for auto-routing).
    confirmedIssueType: raw.resolution_issue_type || null,
    resolvedAt: raw.resolved_on,
    resolvedBy: raw.resolution_provided_by
      ? displayNameFromUser(raw.resolution_provided_by)
      : null,
    resolutionAttachments: (raw.resolution_attachments || []).map(mapSupportAttachment),
    attachments: (raw.attachments || []).map(mapSupportAttachment),
    conversation: mapConversation(raw, currentUser, mapSkillingComment),
    activity: mapActivityHistory(raw),
  }
}

/*
 * LIST - every Skilling Support ticket the logged-in user actually
 * covers (module, team and coverage are all decided by Frappe).
 */
export async function getSkillingSupportTickets({ status } = {}) {
  const data = await callMethod('weconnect_ticketing.api.get_skilling_support_tickets', {
    method: 'GET',
    params: status ? { status } : undefined,
  })

  return {
    tickets: (data?.tickets || []).map(mapSkillingTicketSummary),
    totalCount: data?.total_count || 0,
    statusCounts: data?.status_counts || {},
  }
}

/*
 * DETAILS - full ticket incl. communication history and
 * attachments, permission-checked server-side the same way as the
 * list above.
 */
export async function getSkillingSupportTicketDetails(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.get_skilling_support_ticket', {
    method: 'GET',
    params: { ticket_id: ticketId },
  })

  return mapSkillingTicketDetails(data, currentUser)
}

/*
 * WORKFLOW ACTIONS
 *
 * Each calls the real Frappe Skilling Support workflow transition
 * and returns the updated ticket - TicketsProvider merges this
 * straight back into state, it never guesses the new status itself.
 */

export async function startSkillingTicketWork(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.start_skilling_ticket_work', {
    params: { ticket_id: ticketId },
  })
  return mapSkillingTicketDetails(data, currentUser)
}

export async function resumeSkillingTicketWork(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.resume_skilling_ticket_work', {
    params: { ticket_id: ticketId },
  })
  return mapSkillingTicketDetails(data, currentUser)
}

export async function askSkillingTicketUser(ticketId, message, files = [], currentUser) {
  const attachments = await uploadTicketAttachments(files, 'Your message was not sent.')

  const data = await callMethod('weconnect_ticketing.api.ask_skilling_ticket_user', {
    params: { ticket_id: ticketId, message, attachments },
  })
  return mapSkillingTicketDetails(data, currentUser)
}

export async function resolveSkillingTicket(ticketId, resolution, issueType, files = [], currentUser) {
  const attachments = await uploadTicketAttachments(files, 'The ticket was not marked Resolved.')

  const data = await callMethod('weconnect_ticketing.api.resolve_skilling_ticket', {
    params: { ticket_id: ticketId, resolution, issue_type: issueType, attachments },
  })
  return mapSkillingTicketDetails(data, currentUser)
}

export async function forwardSkillingTicketToWeConnect(ticketId, reason, currentUser) {
  const data = await callMethod(
    'weconnect_ticketing.api.forward_skilling_ticket_to_weconnect',
    { params: { ticket_id: ticketId, reason } }
  )
  return mapSkillingTicketDetails(data, currentUser)
}

/*
 * NEED L2 / RESOLVED BY L2
 *
 * Skilling Support In Progress -> Need L2 -> Sent to L2, and back:
 * Sent to L2 -> Resolved by L2 -> Skilling Support In Progress. Real
 * Frappe Ticket Workflow transitions, same "call the transition,
 * replace with whatever Frappe returns" pattern as every other
 * action in this file.
 */
export async function escalateSkillingTicketToL2(ticketId, l2TicketNumber, currentUser) {
  const data = await callMethod(
    'weconnect_ticketing.api.escalate_skilling_ticket_to_l2',
    { params: { ticket_id: ticketId, l2_ticket_number: l2TicketNumber } }
  )
  return mapSkillingTicketDetails(data, currentUser)
}

export async function resolveSkillingTicketFromL2(ticketId, currentUser) {
  const data = await callMethod(
    'weconnect_ticketing.api.resolve_skilling_ticket_from_l2',
    { params: { ticket_id: ticketId } }
  )
  return mapSkillingTicketDetails(data, currentUser)
}

/*
 * ================================================================
 * WECONNECT SUPPORT WORKSPACE - REAL FRAPPE BACKED
 *
 * Same proven pattern as the Skilling Support section above, kept
 * independent (own mapper functions, nothing imported/shared) so
 * nothing here can ever change Skilling Support's behaviour.
 *
 * Module name reconciliation: the real Frappe Ticket Module docname
 * for CenterOps is "Center Ops" (with a space). The rest of this
 * frontend (ticketModules.js, useSupportScope.js, SupportAnalytics,
 * ModuleTicketsWorkspace, ...) already uses "CenterOps" - translated
 * right here at the mapper boundary so none of that has to change.
 * The real Frappe module itself is never renamed.
 * ================================================================
 */

const WECONNECT_MODULE_DISPLAY = {
  'Center Ops': 'CenterOps',
  Skilling: 'Skilling',
}

function displayModule(rawModule) {
  return WECONNECT_MODULE_DISPLAY[rawModule] || rawModule
}

function mapWeConnectLastResponse(raw) {
  if (!raw.last_response_by) return []

  return [{
    id: 'last-response',
    type: raw.last_response_by, // 'user' | 'support'
    sender: raw.last_response_by === 'user' ? 'Requester' : (raw.support_team || 'WeConnect Support'),
    role: raw.last_response_by === 'user' ? 'Requester' : (raw.support_team || 'WeConnect Support'),
    initials: raw.last_response_by === 'user' ? 'RQ' : 'WS',
    time: formatDateTime(raw.last_response_on),
    timestamp: raw.last_response_on,
    message: raw.last_response_message || '',
    attachments: [],
  }]
}

function mapWeConnectTicketSummary(raw) {
  return {
    id: raw.name,
    module: displayModule(raw.module),
    subModule: raw.sub_module,
    issueType: raw.issue_type,
    issue: raw.subject,
    title: raw.subject,
    description: raw.description,
    status: raw.status,
    workflowState: raw.workflow_state,
    priority: raw.priority,
    requestType: raw.request_type,
    requesterRole: raw.raised_as_lighthouse_role || null,
    raisedBy: displayNameFromUser(raw.raised_by),
    region: raw.region,
    center: raw.center,
    supportTeam: raw.support_team,
    currentHandler: raw.current_handler || null,
    assignedSupportUser: raw.assigned_support_user || null,
    forwardReason: raw.forward_reason || null,
    createdDate: raw.creation,
    updatedDate: raw.modified,
    lastResponseOn: raw.last_response_on,
    resolutionDue: raw.resolution_due_by,
    resolvedOn: raw.resolved_on,
    approvalRequired: Boolean(raw.approval_required),
    approvalRecipient: raw.approval_recipient || null,
    approvalType: raw.approval_type || null,
    approvalStatus: raw.approval_status || null,
    approvalRequestedOn: raw.approval_requested_on || null,
    approvalRespondedOn: raw.approval_responded_on || null,
    approvalComments: raw.approval_comments || null,
    clarificationQuestion: raw.approval_clarification_question || null,
    clarificationReply: raw.approval_clarification_reply || null,
    clarificationAskedBy: raw.approval_clarification_asked_by || null,
    clarificationAskedOn: raw.approval_clarification_asked_on || null,
    l2Required: Boolean(raw.l2_required),
    l2Status: raw.l2_status || null,
    l2TicketNumber: raw.l2_ticket_number || null,
    l2SentOn: raw.l2_sent_on || null,
    l2MarkedBy: raw.l2_marked_by ? displayNameFromUser(raw.l2_marked_by) : null,
    l2ResolutionReceivedOn: raw.l2_resolution_received_on || null,
    l2ResolutionReceivedBy: raw.l2_resolution_received_by
      ? displayNameFromUser(raw.l2_resolution_received_by)
      : null,
    l2Duration: raw.l2_duration || null,
    conversation: mapWeConnectLastResponse(raw),
  }
}

function mapWeConnectComment(entry, currentUser) {
  const senderId = entry.sender || entry.comment_by
  const isSelf = senderId === currentUser

  return {
    id: entry.name,
    sender: isSelf ? 'You' : displayNameFromUser(senderId),
    role: entry.sender_role || (isSelf ? 'WeConnect Support' : 'Requester'),
    initials: initialsFromUser(senderId),
    // Side marker for the UI's left/right bubble layout - always
    // "is this the viewer's own message", never the raw message_type
    // label (e.g. "Support Reply"), which never equals 'user'/'support'.
    type: isSelf ? 'support' : 'user',
    time: formatDateTime(entry.creation || entry.sent_on),
    timestamp: entry.creation || entry.sent_on,
    message: entry.content || entry.message,
    attachments: (entry.attachments || []).map(mapSupportAttachment),
  }
}

function mapWeConnectTicketDetails(raw, currentUser) {
  return {
    ...mapWeConnectTicketSummary(raw),
    raisedByEmail: raw.raised_by,
    resolution: raw.resolution,
    // The support agent's own confirmed classification, set when
    // resolving - separate from `issueType` above (the reporter's
    // guess at raise time, still used for auto-routing).
    confirmedIssueType: raw.resolution_issue_type || null,
    resolvedAt: raw.resolved_on,
    resolvedBy: raw.resolution_provided_by
      ? displayNameFromUser(raw.resolution_provided_by)
      : null,
    resolutionAttachments: [],
    attachments: (raw.attachments || []).map(mapSupportAttachment),
    conversation: mapConversation(raw, currentUser, mapWeConnectComment),
    activity: mapActivityHistory(raw),
  }
}

/*
 * LIST - every ticket routed to a support team across Center Ops
 * and Skilling, team-wide (never filtered to "assigned to me" - the
 * backend does not filter by assigned_support_user or Skilling
 * Support Coverage for this workspace).
 */
export async function getWeConnectSupportTickets({ status } = {}) {
  const data = await callMethod('weconnect_ticketing.api.get_weconnect_support_tickets', {
    method: 'GET',
    params: status ? { status } : undefined,
  })

  return {
    tickets: (data?.tickets || []).map(mapWeConnectTicketSummary),
    totalCount: data?.total_count || 0,
    statusCounts: data?.status_counts || {},
  }
}

/*
 * DETAILS - full ticket incl. communication history, attachments,
 * resolution, approval and clarification fields.
 */
export async function getWeConnectSupportTicketDetails(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.get_weconnect_support_ticket', {
    method: 'GET',
    params: { ticket_id: ticketId },
  })

  return mapWeConnectTicketDetails(data, currentUser)
}

/*
 * WORKFLOW ACTIONS
 */

export async function startWeConnectTicketWork(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.start_weconnect_ticket_work', {
    params: { ticket_id: ticketId },
  })
  return mapWeConnectTicketDetails(data, currentUser)
}

export async function resumeWeConnectTicketWork(ticketId, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.resume_weconnect_ticket_work', {
    params: { ticket_id: ticketId },
  })
  return mapWeConnectTicketDetails(data, currentUser)
}

export async function askWeConnectTicketUser(ticketId, message, files = [], currentUser) {
  const attachments = await uploadTicketAttachments(files, 'Your message was not sent.')

  const data = await callMethod('weconnect_ticketing.api.ask_weconnect_ticket_user', {
    params: { ticket_id: ticketId, message, attachments },
  })
  return mapWeConnectTicketDetails(data, currentUser)
}

export async function resolveWeConnectTicket(ticketId, resolution, issueType, files = [], currentUser) {
  const attachments = await uploadTicketAttachments(files, 'The ticket was not marked Resolved.')

  const data = await callMethod('weconnect_ticketing.api.resolve_weconnect_ticket', {
    params: { ticket_id: ticketId, resolution, issue_type: issueType, attachments },
  })
  return mapWeConnectTicketDetails(data, currentUser)
}

/*
 * SUBMIT FOR APPROVAL
 *
 * approvalType is exactly the real Ticket.approval_type Select value
 * ("Regional Head" | "Program Head"). The backend resolves the
 * actual recipient via the existing "Ticket Approval Creation"
 * Server Script - Program Head routing is not configured there yet,
 * so submitting as Program Head performs the real transition but may
 * not yet reach an approver (see the frontend modal's note).
 */
export async function submitWeConnectTicketForApproval(ticketId, approvalType, comments, currentUser) {
  const data = await callMethod('weconnect_ticketing.api.submit_weconnect_ticket_for_approval', {
    params: { ticket_id: ticketId, approval_type: approvalType, comments: comments || undefined },
  })
  return mapWeConnectTicketDetails(data, currentUser)
}

/*
 * NEED L2 / RESOLVED BY L2
 *
 * WeConnect Support In Progress -> Need L2 -> Sent to L2, and back:
 * Sent to L2 -> Resolved by L2 -> WeConnect Support In Progress. Same
 * real Ticket Workflow transitions as the Skilling Support section,
 * kept independent here for the same reason as the rest of this
 * section.
 */
export async function escalateWeConnectTicketToL2(ticketId, l2TicketNumber, currentUser) {
  const data = await callMethod(
    'weconnect_ticketing.api.escalate_weconnect_ticket_to_l2',
    { params: { ticket_id: ticketId, l2_ticket_number: l2TicketNumber } }
  )
  return mapWeConnectTicketDetails(data, currentUser)
}

export async function resolveWeConnectTicketFromL2(ticketId, currentUser) {
  const data = await callMethod(
    'weconnect_ticketing.api.resolve_weconnect_ticket_from_l2',
    { params: { ticket_id: ticketId } }
  )
  return mapWeConnectTicketDetails(data, currentUser)
}
