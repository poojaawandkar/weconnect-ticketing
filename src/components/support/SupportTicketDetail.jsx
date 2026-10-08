import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  MessageCircle,
  MessageCircleQuestion,
  Paperclip,
  PlayCircle,
  Send,
} from 'lucide-react'

import TicketWorkflowActions from '../Dashboard/TicketWorkflowActions'
import { getTicketActionsForRole } from '../../data/ticketWorkflow'
import { statusStyles, priorityStyles } from '../../utils/ticketStyles'
import { stageLabel } from '../../data/supportStages'
import { shortDate } from '../../utils/ticketDates'
import { awaitingSupportReview, lastConversationMessage } from '../../data/ticketConversation'
import ActivityTimeline from '../common/ActivityTimeline'
import { DetailSection, InfoField } from './DetailSection'

/*
 * ================================================================
 * SUPPORT TICKET DETAIL  (shared)
 *
 * The ticket-detail layout for BOTH support workspaces - Skilling
 * Support and WeConnect Support render this so the two are visually
 * identical. Everything that matters is up top, one status-aware
 * ACTION AREA, and the rest folded into compact collapsible
 * sections.
 *
 * `actionRole` is whatever the calling workspace's scope hook says
 * this user may act AS on this ticket (or null for a read-only
 * view). The action buttons come from the shared
 * TicketWorkflowActions, so only real workflow transitions ever
 * appear.
 * ================================================================
 */

function SupportTicketDetail({ ticket, actionRole, backTo, backLabel = 'Back to tickets' }) {
  const navigate = useNavigate()
  const [openSection, setOpenSection] = useState('details')

  const actions = useMemo(
    () => (ticket && actionRole ? getTicketActionsForRole(ticket, actionRole) : []),
    [ticket, actionRole]
  )

  if (!ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle size={24} className="text-rose-500" />
        </div>
        <p className="max-w-sm text-sm font-medium text-slate-600">
          This ticket could not be found.
        </p>
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          {backLabel}
        </button>
      </div>
    )
  }

  const style = statusStyles[ticket.status] || statusStyles.Open
  const subject = ticket.title || ticket.issue
  const conversation = ticket.conversation || []
  const lastFromSupport = [...conversation].reverse().find((m) => m.type === 'support')
  const hasResolution = Boolean(ticket.resolution && ticket.resolution.trim())

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-6 sm:py-7">

        {/* Summary */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-teal-700">{ticket.id}</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-400">
              {ticket.module} · {ticket.subModule}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${style.background} ${style.text} ${style.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {stageLabel(ticket.status)}
            </span>
            {ticket.priority && (
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  priorityStyles[ticket.priority] || 'bg-slate-100 text-slate-500'
                }`}
              >
                {ticket.priority}
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {subject}
          </h1>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <InfoField label="Module" value={ticket.module} />
            <InfoField label="Sub-module" value={ticket.subModule} />
            <InfoField label="Raised By" value={ticket.requesterRole} />
            <InfoField label="Region" value={ticket.region} />
            <InfoField label="Center" value={ticket.center} />
            <InfoField label="Assigned To" value={ticket.supportTeam || 'Unassigned'} />
          </div>
        </div>

        {/* Action area */}

        <ActionArea ticket={ticket} actionRole={actionRole} actions={actions} lastFromSupport={lastFromSupport} />

        {/* Sections */}

        <div className="mt-4 space-y-4">

          <DetailSection
            id="details"
            title="Details"
            icon={FileText}
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Description
            </p>
            <div className="mt-2 rounded-lg bg-white px-4 py-3">
              <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                {ticket.description || subject}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoField label="Request Type" value={ticket.requestType} />
              <InfoField label="Priority" value={ticket.priority} />
              <InfoField label="Raised On" value={shortDate(ticket.createdDate)} />
            </div>

            {ticket.forwardReason && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
                <Send size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  Hand-off note between support teams — “{ticket.forwardReason}”
                </p>
              </div>
            )}

            {ticket.clarificationQuestion && (
              <div className="mt-5 rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-3">
                <p className="text-xs text-violet-800">
                  Approver asked — “{ticket.clarificationQuestion}”
                </p>
                {ticket.clarificationReply && (
                  <p className="mt-2 text-xs text-slate-600">
                    Reply — “{ticket.clarificationReply}”
                  </p>
                )}
              </div>
            )}
          </DetailSection>

          <DetailSection
            id="attachments"
            title="Attachments"
            icon={Paperclip}
            count={ticket.attachments?.length || 0}
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id || attachment.url || attachment.name}
                    href={attachment.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-teal-200 hover:bg-teal-50/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-teal-700">
                      <FileText size={16} />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                      {attachment.name}
                    </p>
                    <Download size={14} className="shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No files were attached to this ticket.</p>
            )}
          </DetailSection>

          <DetailSection
            id="resolution"
            title="Resolution"
            icon={CheckCircle2}
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            {hasResolution ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-800">
                    Resolution provided
                    {ticket.resolvedBy ? ` by ${ticket.resolvedBy}` : ''}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {ticket.resolution}
                </p>
                {ticket.confirmedIssueType && (
                  <p className="mt-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Issue type:</span>{' '}
                    {ticket.confirmedIssueType}
                  </p>
                )}
                {ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ticket.resolutionAttachments.map((attachment) => (
                      <div
                        key={attachment.id || attachment.name}
                        className="truncate rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-[10px] font-medium text-slate-600"
                      >
                        {attachment.name}
                      </div>
                    ))}
                  </div>
                )}
                {ticket.resolvedAt && (
                  <p className="mt-3 text-[10px] text-slate-400">
                    Resolved on {shortDate(ticket.resolvedAt)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No resolution has been provided yet. It will appear here once this
                ticket is resolved.
              </p>
            )}
          </DetailSection>

          <DetailSection
            id="history"
            title="History"
            icon={History}
            count={ticket.activity?.length || 0}
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            <ActivityTimeline entries={ticket.activity || []} />
          </DetailSection>

          <DetailSection
            id="activity"
            title="Response / Activity"
            icon={MessageCircle}
            count={conversation.length}
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            {conversation.length > 0 ? (
              <div className="space-y-4">
                {conversation.map((message) => {
                  const isUser = message.type === 'user'
                  return (
                    <div key={message.id} className="flex gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isUser ? 'bg-teal-600 text-white' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {message.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800">{message.sender}</p>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                            {message.role}
                          </span>
                          <span className="text-[10px] text-slate-400">{message.time}</span>
                        </div>
                        {message.message && (
                          <p className="mt-1.5 whitespace-pre-line rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                            {message.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No responses yet. Use “Ask User” from the action area to request more information.
              </p>
            )}
          </DetailSection>

        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}

/*
 * One status-aware area. Buttons are workflow-driven
 * (TicketWorkflowActions); the copy just names the current state so
 * the page never shows an empty box or an irrelevant action.
 */
function ActionArea({ ticket, actionRole, actions, lastFromSupport }) {
  const canAct = actionRole && actions.length > 0

  const requesterReply = awaitingSupportReview(ticket)
    ? lastConversationMessage(ticket)
    : null

  let heading = 'Current state'
  let Icon = Clock3
  let tone = 'border-slate-200 bg-white'
  let body = null

  if (canAct && ticket.status === 'Open') {
    heading = 'Ready to pick up'
    Icon = PlayCircle
    tone = 'border-teal-200 bg-teal-50/50'
    body = 'Start work to move this ticket into your queue.'
  } else if (canAct && requesterReply) {
    heading = 'The requester replied'
    Icon = MessageCircleQuestion
    tone = 'border-blue-200 bg-blue-50/50'
    body = requesterReply.message
      ? `“${requesterReply.message}” — review their answer, then choose the next step below.`
      : 'They answered your question. Review it, then choose the next step below.'
  } else if (canAct && ticket.status.includes('In Progress')) {
    heading = "You're working on this"
    Icon = Clock3
    tone = 'border-teal-200 bg-teal-50/50'
    body = 'Choose the next step below.'
  } else if (canAct && ticket.status === 'Reopened') {
    heading = 'Reopened by the requester'
    Icon = AlertTriangle
    tone = 'border-orange-200 bg-orange-50/60'
    body = 'The requester says the issue is still happening. Resume work to pick it back up.'
  } else if (ticket.status === 'Awaiting User') {
    heading = 'Waiting for the requester'
    Icon = MessageCircleQuestion
    tone = 'border-blue-200 bg-blue-50/50'
    body = lastFromSupport?.message
      ? `You asked: “${lastFromSupport.message}”. The ticket returns to your queue automatically when they reply.`
      : 'The ticket returns to your queue automatically when the requester replies.'
  } else if (ticket.status === 'Pending Approval') {
    heading = 'Awaiting approval'
    Icon = Send
    tone = 'border-violet-200 bg-violet-50/50'
    body = ticket.approvalType
      ? `Sent to ${ticket.approvalType}${
          ticket.approvalRecipient ? ` (${ticket.approvalRecipient})` : ''
        } · ${ticket.approvalStatus && ticket.approvalStatus !== 'Not Required' ? ticket.approvalStatus : 'Pending'}. The approver records their decision in Frappe.`
      : 'This ticket is waiting on an approver. The decision is recorded in Frappe.'
  } else if (ticket.status === 'Resolved') {
    heading = 'Resolved'
    Icon = CheckCircle2
    tone = 'border-emerald-200 bg-emerald-50/50'
    body =
      'Marked resolved — see the Resolution section below. It closes automatically if the requester does not reopen it.'
  } else if (ticket.status === 'Closed') {
    heading = 'Closed'
    Icon = CheckCircle2
    tone = 'border-slate-200 bg-slate-50'
    body = 'This ticket is closed. No further action is needed.'
  } else if (ticket.status === 'Sent to L2') {
    heading = canAct ? 'Sent to L2' : `Sent to L2 by ${ticket.supportTeam || 'the support team'}`
    Icon = ArrowUpRight
    tone = 'border-indigo-200 bg-indigo-50/50'
    body = ticket.l2TicketNumber
      ? `Escalated to L2 support (L2 Ticket ${ticket.l2TicketNumber}).${canAct ? ' Mark it resolved once L2 confirms a fix.' : ''}`
      : `Escalated to L2 support.${canAct ? ' Mark it resolved once L2 confirms a fix.' : ''}`
  } else if (ticket.status.includes('In Progress')) {
    // Read-only in-progress view: a ticket routed to a team this
    // user does not hold (e.g. a ticket forwarded to the other
    // support team, or a Skilling ticket opened by WeConnect Support).
    heading = `Being handled by ${ticket.supportTeam || 'the support team'}`
    Icon = Clock3
    tone = 'border-slate-200 bg-white'
    body = ticket.forwardReason
      ? `Hand-off note — “${ticket.forwardReason}”`
      : 'You have a read-only view of this ticket.'
  }

  return (
    <div className={`mt-4 rounded-xl border ${tone} p-5 shadow-sm sm:p-6`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{heading}</p>
          {body && <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>}

          {canAct && (
            <div className="mt-4">
              <TicketWorkflowActions ticket={ticket} role={actionRole} size="lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupportTicketDetail
