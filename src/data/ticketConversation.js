/*
 * ================================================================
 * TICKET CONVERSATION HELPERS
 *
 * Small shared reads over a ticket's `conversation` array (the same
 * shape TicketDetails renders and AskUserModal appends to). Kept
 * here so the Skilling Support dashboard, the Skilling Tickets tab
 * bar and the ticket detail page all agree on what "the requester
 * has replied" means.
 * ================================================================
 */

export function lastConversationMessage(ticket) {
  const conversation = ticket?.conversation || []
  return conversation.length > 0 ? conversation[conversation.length - 1] : null
}

const SUPPORT_IN_PROGRESS = [
  'Skilling Support In Progress',
  'WeConnect Support In Progress',
]

/*
 * True when a support agent asked the requester something (the
 * ticket went to "Awaiting User"), the requester answered, and the
 * ticket is back with support - i.e. it is in a support team's
 * "In Progress" state and the newest message is from the requester.
 * This is what the "Replied" tab and the dashboard's reply
 * indicator surface, in both the Skilling Support and WeConnect
 * Support workspaces.
 */
export function awaitingSupportReview(ticket) {
  if (!SUPPORT_IN_PROGRESS.includes(ticket?.status)) return false
  return lastConversationMessage(ticket)?.type === 'user'
}
