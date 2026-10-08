import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  UserRound,
  X,
  AlertCircle,
} from 'lucide-react'

import { statusStyles } from '../../utils/ticketStyles'
import ActivityTimeline from '../common/ActivityTimeline'

function TicketDetails({
  ticket,
  /*
   * Real workflow actions, wired up by TicketDetailsPage to
   * weconnect_ticketing.api. Each resolves once the backend has
   * confirmed the change and returns the caller a fresh ticket -
   * TicketDetailsPage re-renders this component with that updated
   * `ticket` prop, which is the only source of truth here.
   */
  onReopen,
  onAcceptResolution,
  onSendComment,
  /*
   * 'requester' (default) is the ticket raiser's own view - the
   * "Resolution doesn't solve my issue" / "Mark as Closed" actions
   * are that person's satisfaction call, and map directly to the
   * real Ticket Workflow's "Reopen" / "Accept Resolution"
   * transitions, both restricted to the WeConnect User role.
   *
   * 'champion' is a read + respond view for support staff: they
   * can view full ticket state and add a reply (the same existing
   * comment mechanism), but the requester-only satisfaction
   * actions are hidden - marking a ticket In Progress/Resolved is
   * not an action this codebase (or the Frappe backend, as far as
   * this frontend can see) currently defines for a Champion, so no
   * button is fabricated for it here.
   */
  viewerRole = 'requester',
}) {
  /*
   * ============================================================
   * TICKET DATA
   *
   * `ticket` always comes fully populated from
   * weconnect_ticketing.api.get_ticket_details (via
   * TicketDetailsPage) - status and conversation are read directly
   * from it rather than mirrored into local state, so a refetch
   * after a real workflow action or comment is always what's shown.
   * ============================================================
   */

  const currentTicket = ticket

  const status = currentTicket.status || 'Open'
  const conversation = currentTicket.conversation || []

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [reply, setReply] = useState('')

  const [selectedFiles, setSelectedFiles] =
    useState([])

  const [openSection, setOpenSection] =
    useState('details')

  const [actionPending, setActionPending] = useState(false)
  const [sendError, setSendError] = useState(null)

  const fileInputRef = useRef(null)

  /*
   * Reset local (not-yet-sent) reply state if another ticket is
   * opened.
   */

  useEffect(() => {
    setReply('')

    setSelectedFiles([])

    setSendError(null)

    setOpenSection('details')
  }, [currentTicket.id])

  /*
   * ============================================================
   * STATUS HELPERS
   * ============================================================
   */

  /*
   * Status colors come from the shared statusStyles map (see
   * src/utils/ticketStyles.js) instead of a local copy, so every
   * real Frappe workflow state (Champion In Progress, Awaiting
   * User, Reopened, etc.) renders correctly here too, not just the
   * original 5 this component started with.
   */
  const currentStatus =
    statusStyles[status] ||
    statusStyles.Open

  const priorityConfig = {
    Urgent:
      'bg-red-50 text-red-600 border-red-100',

    High:
      'bg-rose-50 text-rose-600 border-rose-100',

    Medium:
      'bg-amber-50 text-amber-600 border-amber-100',

    Low:
      'bg-slate-100 text-slate-500 border-slate-200',
  }

  /*
   * ============================================================
   * BUSINESS RULES
   * ============================================================
   */

  const hasResolution =
    Boolean(
      currentTicket.resolution &&
        currentTicket.resolution.trim()
    )

  const isClosed = status === 'Closed'

  const isResolved = status === 'Resolved'

  /*
   * The reopen/close buttons below are the ticket raiser judging
   * whether they're satisfied with the resolution - that's not a
   * Champion action, so they're hidden outside the requester view.
   */
  const isRequesterView = viewerRole !== 'champion'

  /*
   * A ticket is considered validly resolved
   * only if a resolution exists.
   */

  const validResolvedState =
    isResolved && hasResolution

  /*
   * ============================================================
   * LAST RESPONSE
   * ============================================================
   */

  const latestConversation =
    conversation.length > 0
      ? [...conversation].sort(
          (a, b) => {
            const first = new Date(
              a.timestamp || 0
            ).getTime()

            const second = new Date(
              b.timestamp || 0
            ).getTime()

            return first - second
          }
        )[conversation.length - 1]
      : null

  const lastResponseTime =
    latestConversation?.time ||
    'No response yet'

  /*
   * ============================================================
   * AUTO CLOSE CALCULATION
   *
   * Resolved → 48 hours → Closed
   *
   * This is only UI simulation.
   * Frappe will perform the real auto-close later.
   * ============================================================
   */

  const autoCloseAt = useMemo(() => {
    if (
      !currentTicket.resolvedAt ||
      !hasResolution
    ) {
      return null
    }

    const resolvedDate = new Date(
      currentTicket.resolvedAt
    )

    if (Number.isNaN(resolvedDate.getTime())) {
      return null
    }

    return new Date(
      resolvedDate.getTime() +
        48 * 60 * 60 * 1000
    )
  }, [
    currentTicket.resolvedAt,
    hasResolution,
  ])

  /*
   * ============================================================
   * FORMAT DATE
   * ============================================================
   */

  const formatDateTime = (date) => {
    if (!date) return ''

    const parsed =
      date instanceof Date
        ? date
        : new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return ''
    }

    return parsed.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  /*
   * ============================================================
   * SECTION TOGGLE
   * ============================================================
   */

  const toggleSection = (section) => {
    setOpenSection(
      openSection === section
        ? ''
        : section
    )
  }

  /*
   * ============================================================
   * FILE SELECT
   * ============================================================
   */

  const handleFileSelect = (event) => {
    const files = Array.from(
      event.target.files || []
    )

    if (!files.length) return

    const formattedFiles =
      files.map((file, index) => ({
        id: `${Date.now()}-${index}`,

        name: file.name,

        size:
          file.size > 1024 * 1024
            ? `${(
                file.size /
                (1024 * 1024)
              ).toFixed(1)} MB`
            : `${Math.max(
                1,
                Math.round(
                  file.size / 1024
                )
              )} KB`,

        type: file.type.startsWith(
          'image/'
        )
          ? 'image'
          : file.type ===
            'application/pdf'
          ? 'pdf'
          : 'file',

        preview:
          file.type.startsWith(
            'image/'
          )
            ? URL.createObjectURL(file)
            : null,

        file,
      }))

    setSelectedFiles(
      (previous) => [
        ...previous,
        ...formattedFiles,
      ]
    )

    event.target.value = ''
  }

  /*
   * ============================================================
   * REMOVE FILE
   * ============================================================
   */

  const removeFile = (id) => {
    setSelectedFiles(
      (previous) =>
        previous.filter(
          (file) => file.id !== id
        )
    )
  }

  /*
   * ============================================================
   * SEND COMMENT
   *
   * Posts a real Frappe Comment against this Ticket, uploading any
   * attached files first. The requester-side "resolution wasn't
   * satisfactory -> reopen" business rule is not something the
   * real Ticket Workflow does automatically on a comment - only the
   * explicit "Resolution doesn't solve my issue" action below
   * reopens a ticket - so replying here never silently changes
   * status.
   * ============================================================
   */

  const handleSendComment = async (event) => {
    event.preventDefault()

    if (
      isClosed ||
      actionPending ||
      (!reply.trim() &&
        selectedFiles.length === 0)
    ) {
      return
    }

    setActionPending(true)
    setSendError(null)

    try {
      await onSendComment?.(
        reply.trim(),
        selectedFiles.map((file) => file.file)
      )

      setReply('')
      setSelectedFiles([])
    } catch (error) {
      console.error('TicketDetails: failed to send comment', error)
      setSendError(error.message || 'Unable to send your reply. Please try again.')
    } finally {
      setActionPending(false)
    }
  }

  /*
   * ============================================================
   * MARK RESOLVED TICKET AS OPEN
   *
   * The real Ticket Workflow's "Reopen" transition
   * (Resolved -> Reopened), restricted to the requester.
   * ============================================================
   */

  const handleReopenFromResolved = async () => {
    if (!isResolved || actionPending) return

    setActionPending(true)
    setSendError(null)

    try {
      await onReopen?.()
    } catch (error) {
      console.error('TicketDetails: failed to reopen ticket', error)
      setSendError(error.message || 'Unable to reopen this ticket. Please try again.')
    } finally {
      setActionPending(false)
    }
  }

  /*
   * ============================================================
   * CLOSE TICKET
   *
   * The real Ticket Workflow's "Accept Resolution" transition
   * (Resolved -> Closed), restricted to the requester. Only
   * Resolved tickets with a valid resolution can be closed.
   * ============================================================
   */

  const handleCloseTicket = async () => {
    if (!validResolvedState || actionPending) return

    setActionPending(true)
    setSendError(null)

    try {
      await onAcceptResolution?.()
    } catch (error) {
      console.error('TicketDetails: failed to close ticket', error)
      setSendError(error.message || 'Unable to close this ticket. Please try again.')
    } finally {
      setActionPending(false)
    }
  }

  /*
   * ============================================================
   * ACCORDION SECTION
   *
   * Each section is its own bordered, shadowed card (not a flush
   * row sharing one big box) with a colored icon badge in its
   * header - the visible "partitioning" between Details /
   * Attachments / Response / Resolution / Reference that a single
   * continuous card doesn't give you.
   * ============================================================
   */

  const AccordionSection = ({
    id,
    title,
    description,
    icon: Icon,
    children,
  }) => {
    const isOpen =
      openSection === id

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <button
          type="button"
          onClick={() =>
            toggleSection(id)
          }
          className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-7"
        >

          <div className="flex items-center gap-3">

            {Icon && (
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                  isOpen
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <Icon size={16} />
              </div>
            )}

            <div>

              <h2 className="text-sm font-semibold text-slate-800">
                {title}
              </h2>

              {description && (
                <p className="mt-1 text-xs text-slate-400">
                  {description}
                </p>
              )}

            </div>

          </div>

          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
              isOpen
                ? 'bg-teal-50 text-teal-700'
                : 'bg-slate-50 text-slate-400'
            }`}
          >

            <ChevronDown
              size={16}
              className={`transition-transform ${
                isOpen
                  ? 'rotate-180'
                  : ''
              }`}
            />

          </div>

        </button>

        {isOpen && (
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-6 sm:px-7">
            {children}
          </div>
        )}

      </section>
    )
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 sm:py-7">

        {/* No repeated "Back to My Tickets" link here - the shared
            Header already gives every page a Back control. */}

        {/* ====================================================
            MAIN TICKET CARD (header + quick info only - each
            section below is its own separated card)
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* ==================================================
              HEADER
          =================================================== */}

          <div className="px-5 py-6 sm:px-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-xs font-semibold text-teal-700">
                    {currentTicket.id}
                  </span>

                  <span className="text-slate-300">
                    /
                  </span>

                  <span className="text-xs text-slate-400">
                    {currentTicket.module}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${currentStatus.background} ${currentStatus.text} ${currentStatus.border}`}
                  >

                    <span
                      className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`}
                    />

                    {status}

                  </span>

                </div>

                <h1 className="mt-3 max-w-3xl text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {currentTicket.title}
                </h1>

                <p className="mt-2 text-xs text-slate-400">

                  Raised by{' '}

                  <span className="font-medium text-slate-600">
                    {currentTicket.raisedBy}
                  </span>

                  {' '}on{' '}

                  {currentTicket.raisedDate}

                  {' '}at{' '}

                  {currentTicket.raisedTime}

                </p>

              </div>

              {/* ==================================================
                  RESOLVED ACTIONS
              =================================================== */}

              {isResolved &&
                hasResolution &&
                isRequesterView && (

                  <div className="flex flex-col gap-2 sm:flex-row">

                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={
                        handleReopenFromResolved
                      }
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <AlertCircle
                        size={14}
                      />

                      Resolution doesn't solve my issue

                    </button>

                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={
                        handleCloseTicket
                      }
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-xs font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <Check
                        size={14}
                      />

                      Mark as Closed

                    </button>

                  </div>
                )}

            </div>

          </div>

          {/* ==================================================
              QUICK INFORMATION
          =================================================== */}

          <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/50 sm:grid-cols-4">

            <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Module
              </p>

              <p className="mt-1 text-xs font-medium text-slate-700">
                {currentTicket.module}
              </p>

            </div>

            <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Sub Module
              </p>

              <p className="mt-1 text-xs font-medium text-slate-700">
                {currentTicket.subModule}
              </p>

            </div>

            <div className="px-5 py-4 sm:border-r sm:border-slate-100">

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Priority
              </p>

              <span
                className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                  priorityConfig[
                    currentTicket.priority
                  ] ||
                  priorityConfig.Medium
                }`}
              >
                {currentTicket.priority}
              </span>

            </div>

            <div className="px-5 py-4">

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Assigned To
              </p>

              <p className="mt-1 text-xs font-medium text-slate-700">
                {currentTicket.assignedTo ||
                  'Awaiting Assignment'}
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            SUPPORT IS WAITING ON YOU

            Shown to the requester when a support team has moved
            the ticket to "Awaiting User" - i.e. they asked a
            question and need a reply. The message itself is in the
            Comments thread lower down; this just makes it
            unmissable and jumps straight to the reply box, so
            everything about the ticket still lives on one page.
        ===================================================== */}

        {isRequesterView && status === 'Awaiting User' && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 shadow-sm sm:px-7">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <MessageCircle size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  The support team is waiting for your reply
                </p>
                {latestConversation?.message && (
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">
                    “{latestConversation.message}”
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('ticket-reply')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white transition hover:bg-blue-700"
                >
                  <Send size={14} />
                  Reply now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TICKET SECTIONS - each its own card
        ===================================================== */}

        <div className="mt-4 space-y-4">

          {/* ==================================================
              DETAILS
          =================================================== */}

          <AccordionSection
            id="details"
            title="Details"
            description="Issue information provided when the ticket was raised."
            icon={FileText}
          >

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <div className="mt-2 rounded-lg bg-slate-50 px-4 py-4">

                  <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                    {currentTicket.description}
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-5">

                <div>

                  <p className="text-[10px] text-slate-400">
                    Raised By
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {currentTicket.raisedBy}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] text-slate-400">
                    User Role
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {currentTicket.raisedByRole}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] text-slate-400">
                    Issue Type
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {currentTicket.issueType ||
                      'Not classified yet'}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-400">
                    Set by support team
                  </p>

                </div>

                <div>

                  <p className="text-[10px] text-slate-400">
                    Assigned To
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">

                    <UserRound
                      size={12}
                      className="text-slate-400"
                    />

                    <p className="text-xs font-medium text-slate-700">
                      {currentTicket.assignedTo ||
                        'Awaiting Assignment'}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </AccordionSection>

          {/* ==================================================
              ATTACHMENTS

              Real files uploaded to Frappe when the ticket was
              raised (or added in a later reply) - stored in the
              Ticket's `attachments` child table, not in React
              state, so they're still here after a refresh, a
              logout/login, or opening the ticket elsewhere.
          =================================================== */}

          <AccordionSection
            id="attachments"
            title={`Attachments (${currentTicket.attachments?.length || 0})`}
            description="Files shared with this ticket."
            icon={Paperclip}
          >

            {currentTicket.attachments && currentTicket.attachments.length > 0 ? (

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {currentTicket.attachments.map((attachment) => (

                  <a
                    key={attachment.id || attachment.url}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-teal-200 hover:bg-teal-50/40"
                  >

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
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

              <p className="text-xs text-slate-400">
                No files were attached to this ticket.
              </p>

            )}

          </AccordionSection>

          {/* ==================================================
              RESPONSE DETAILS
          =================================================== */}

          <AccordionSection
            id="response"
            title="Response Details"
            description="Support response and ticket activity."
            icon={Clock3}
          >

            <div className="grid gap-5 sm:grid-cols-3">

              {/* Current Status */}

              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">

                <Clock3
                  size={16}
                  className="text-amber-500"
                />

                <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-400">
                  Current Status
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${currentStatus.dot}`}
                  />

                  <p
                    className={`text-xs font-semibold ${currentStatus.text}`}
                  >
                    {status}
                  </p>

                </div>

              </div>

              {/* Last Response */}

              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">

                <MessageCircle
                  size={16}
                  className="text-teal-600"
                />

                <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-400">
                  Last Response
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {lastResponseTime}
                </p>

              </div>

              {/* Support */}

              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">

                <ShieldCheck
                  size={16}
                  className="text-blue-600"
                />

                <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-400">
                  Support
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {currentTicket.assignedTo ||
                    'Awaiting Assignment'}
                </p>

              </div>

            </div>

          </AccordionSection>

          {/* ==================================================
              HISTORY

              The permanent, backend-persisted activity trail (see
              src/components/common/ActivityTimeline.jsx) - not the
              Comments thread below, which is only the requester's
              own conversation with support.
          =================================================== */}

          <AccordionSection
            id="history"
            title={`History (${currentTicket.activity?.length || 0})`}
            description="Everything that has happened to this ticket, including any time it went to L2 or through an approval."
            icon={History}
          >
            <ActivityTimeline entries={currentTicket.activity || []} />
          </AccordionSection>

          {/* ==================================================
              RESOLUTION DETAILS
          =================================================== */}

          <AccordionSection
            id="resolution"
            title="Resolution Details"
            description="Final solution provided by the support team."
            icon={CheckCircle2}
          >

            {hasResolution ? (

              <div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-5">

                  <div className="flex gap-3">

                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>

                      <p className="text-sm font-semibold text-slate-800">
                        Issue Resolved
                      </p>

                      <p className="mt-1 text-[11px] text-emerald-700">
                        Resolution provided by{' '}
                        {currentTicket.resolvedBy ||
                          currentTicket.assignedTo ||
                          'Support Team'}.
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-emerald-100 pt-4">

                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Resolution
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {currentTicket.resolution}
                    </p>

                    {/* RESOLUTION ATTACHMENTS */}

                    {currentTicket.resolutionAttachments &&
                      currentTicket.resolutionAttachments.length > 0 && (

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

                          {currentTicket.resolutionAttachments.map(
                            (attachment) => (

                              <div
                                key={attachment.id || attachment.name}
                                className="overflow-hidden rounded-lg border border-emerald-100 bg-white"
                              >

                                {attachment.preview ? (

                                  <img
                                    src={attachment.preview}
                                    alt={attachment.name}
                                    className="h-24 w-full object-cover"
                                  />

                                ) : (

                                  <div className="flex h-24 w-full items-center justify-center bg-slate-50">
                                    <ImageIcon
                                      size={20}
                                      className="text-slate-300"
                                    />
                                  </div>

                                )}

                                <p className="truncate border-t border-emerald-100 px-2 py-1.5 text-[9px] font-medium text-slate-600">
                                  {attachment.name}
                                </p>

                              </div>
                            )
                          )}

                        </div>
                      )}

                  </div>

                  {currentTicket.resolvedAt && (
                    <p className="mt-4 text-[10px] text-slate-400">
                      Resolved on{' '}
                      {formatDateTime(
                        currentTicket.resolvedAt
                      )}
                    </p>
                  )}

                </div>

                {/* ==================================================
                    AUTO CLOSE INFORMATION
                =================================================== */}

                {isResolved &&
                  autoCloseAt && (

                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-4">

                      <Clock3
                        size={17}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <div>

                        <p className="text-xs font-semibold text-slate-700">
                          Ticket will automatically close
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">

                          If you are satisfied with the
                          resolution, you can close the ticket
                          now. Otherwise, tell us that the
                          resolution did not solve your issue
                          before the automatic closure.

                        </p>

                        <p className="mt-2 text-[11px] font-semibold text-amber-700">

                          Scheduled closure:{' '}

                          {formatDateTime(
                            autoCloseAt
                          )}

                        </p>

                      </div>

                    </div>
                  )}

                {/* ==================================================
                    RESOLVED ACTIONS
                =================================================== */}

                {isResolved && isRequesterView && (

                  <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-xs font-semibold text-slate-700">
                        Is the resolution satisfactory?
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        If the issue still exists, reopen the
                        ticket instead of allowing it to auto-close.
                      </p>

                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">

                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={
                          handleReopenFromResolved
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <AlertCircle
                          size={14}
                        />

                        Resolution doesn't solve my issue

                      </button>

                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={
                          handleCloseTicket
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-xs font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <Check
                          size={14}
                        />

                        Mark as Closed

                      </button>

                    </div>

                  </div>
                )}

              </div>

            ) : (

              <div className="rounded-lg border border-dashed border-slate-200 px-5 py-8 text-center">

                <CheckCircle2
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No resolution provided yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  The support team will add the resolution
                  here once the issue is actually resolved.
                </p>

              </div>

            )}

          </AccordionSection>

          {/* ==================================================
              REFERENCE
          =================================================== */}

          <AccordionSection
            id="reference"
            title="Reference"
            description="Additional ticket references and supporting information."
            icon={BookOpen}
          >

            {currentTicket.reference ? (

              <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                {currentTicket.reference}
              </p>

            ) : (

              <p className="text-xs text-slate-400">
                No reference information has been added.
              </p>

            )}

          </AccordionSection>

        </div>

        {/* ====================================================
            CLOSED MESSAGE
        ===================================================== */}

        {isClosed && (

          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">

                <CheckCircle2
                  size={18}
                  className="text-slate-500"
                />

              </div>

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Ticket Closed
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  This ticket has been closed. You can no longer
                  add comments or attachments to this ticket.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ====================================================
            COMMENTS
        ===================================================== */}

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="px-5 py-6 sm:px-7">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <MessageCircle size={16} />
                </div>

                <div>

                  <h2 className="text-base font-semibold text-slate-900">
                    Comments
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Conversation and updates related to this ticket.
                  </p>

                </div>

              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                {conversation.length} updates
              </span>

            </div>

            {/* =================================================
                CONVERSATION
            ================================================== */}

            <div className="mt-6 space-y-5">

              {conversation.map(
                (message) => {

                  const isUser =
                    message.type ===
                    'user'

                  /*
                   * A real chat-style layout - your own replies
                   * anchored right in a solid teal bubble, the
                   * support side anchored left in a light card -
                   * so who said what is obvious at a glance instead
                   * of two lookalike rows telling them apart only
                   * by a faint tint.
                   */

                  return (

                    <div
                      key={message.id}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                    >

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isUser
                            ? 'bg-teal-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {message.initials}
                      </div>

                      <div
                        className={`flex min-w-0 max-w-[85%] flex-1 flex-col sm:max-w-[70%] ${
                          isUser ? 'items-end' : 'items-start'
                        }`}
                      >

                        <div
                          className={`flex flex-wrap items-center gap-2 ${
                            isUser ? 'flex-row-reverse' : ''
                          }`}
                        >

                          <p className="text-xs font-semibold text-slate-800">
                            {message.sender}
                          </p>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                              isUser
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {message.role}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {message.time}
                          </span>

                        </div>

                        <div
                          className={`mt-2 w-full rounded-2xl px-4 py-3 shadow-sm ${
                            isUser
                              ? 'rounded-tr-sm bg-teal-600'
                              : 'rounded-tl-sm border border-slate-200 bg-white'
                          }`}
                        >

                          {message.message && (

                            <p
                              className={`whitespace-pre-line text-sm leading-6 ${
                                isUser ? 'text-white' : 'text-slate-600'
                              }`}
                            >
                              {message.message}
                            </p>

                          )}

                          {/* MESSAGE ATTACHMENTS */}

                          {message.attachments &&
                            message.attachments.length >
                              0 && (

                              <div className="mt-4 space-y-3">

                                {message.attachments.map(
                                  (attachment) => (

                                    <div
                                      key={
                                        attachment.id ||
                                        attachment.name
                                      }
                                    >

                                      {attachment.type ===
                                        'image' &&
                                        attachment.preview ? (

                                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">

                                          <img
                                            src={
                                              attachment.preview
                                            }
                                            alt={
                                              attachment.name
                                            }
                                            className="max-h-[320px] max-w-full object-contain"
                                          />

                                          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">

                                            <ImageIcon
                                              size={14}
                                              className="text-teal-600"
                                            />

                                            <span className="text-[10px] font-medium text-slate-600">
                                              {
                                                attachment.name
                                              }
                                            </span>

                                          </div>

                                        </div>

                                      ) : (

                                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">

                                          {attachment.type ===
                                          'image' ? (

                                            <ImageIcon
                                              size={15}
                                              className="text-teal-600"
                                            />

                                          ) : (

                                            <FileText
                                              size={15}
                                              className="text-rose-500"
                                            />

                                          )}

                                          <div>

                                            <p className="max-w-[220px] truncate text-[10px] font-medium text-slate-600">
                                              {
                                                attachment.name
                                              }
                                            </p>

                                            <p className="text-[9px] text-slate-400">
                                              {
                                                attachment.size
                                              }
                                            </p>

                                          </div>

                                        </div>

                                      )}

                                    </div>

                                  )
                                )}

                              </div>
                            )}

                        </div>

                      </div>

                    </div>

                  )
                }
              )}

            </div>

            {/* =================================================
                REPLY AREA
            ================================================== */}

            {!isClosed && (

              <form
                id="ticket-reply"
                onSubmit={
                  handleSendComment
                }
                className="mt-6 scroll-mt-24 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >

                {sendError && (
                  <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                    {sendError}
                  </div>
                )}

                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Type a reply or provide additional information..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                />

                {/* SELECTED FILES */}

                {selectedFiles.length >
                  0 && (

                  <div className="mt-3 space-y-2">

                    {selectedFiles.map(
                      (file) => (

                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >

                          {file.type ===
                          'image' ? (

                            file.preview ? (

                              <img
                                src={
                                  file.preview
                                }
                                alt={
                                  file.name
                                }
                                className="h-10 w-10 rounded object-cover"
                              />

                            ) : (

                              <ImageIcon
                                size={15}
                                className="text-teal-600"
                              />

                            )

                          ) : (

                            <FileText
                              size={15}
                              className="text-rose-500"
                            />

                          )}

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-xs font-medium text-slate-600">
                              {file.name}
                            </p>

                            <p className="text-[9px] text-slate-400">
                              {file.size}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFile(
                                file.id
                              )
                            }
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X size={14} />
                          </button>

                        </div>

                      )
                    )}

                  </div>
                )}

                {/* COMMENT ACTIONS */}

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={
                        handleFileSelect
                      }
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-teal-700"
                    >

                      <Paperclip
                        size={15}
                      />

                      Attach photo / file

                    </button>

                    <span className="ml-2 text-[10px] text-slate-400">
                      JPG, PNG or PDF
                    </span>

                  </div>

                  <button
                    type="submit"
                    disabled={
                      actionPending ||
                      (!reply.trim() &&
                      selectedFiles.length ===
                        0)
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-xs font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >

                    {actionPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}

                    {actionPending ? 'Sending...' : 'Send Reply'}

                  </button>

                </div>

              </form>

            )}

          </div>

        </section>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <div className="px-2 py-4">

          <div className="flex items-start gap-2">

            <ShieldCheck
              size={14}
              className="mt-0.5 shrink-0 text-teal-600"
            />

            <p className="text-[10px] leading-5 text-slate-400">

              Keep all communication related to this issue
              within this ticket. Screenshots and supporting
              files shared here will be available to the
              support team.

            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default TicketDetails