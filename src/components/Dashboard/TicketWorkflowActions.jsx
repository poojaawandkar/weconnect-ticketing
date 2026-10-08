import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Forward,
  MessageCircleQuestion,
  PlayCircle,
  RotateCcw,
  Send,
  Tag,
  Undo2,
} from 'lucide-react'

import {
  getTicketActionsForRole,
  SUPPORT_ROLES,
  WECONNECT_SUPPORT_ROLE,
} from '../../data/ticketWorkflow'
import { useTickets } from '../../tickets/useTickets'
import { getTicketFormOptions } from '../../api/tickets'
import ResolveTicketModal from './ResolveTicketModal'
import AskUserModal from './AskUserModal'
import RequestApprovalModal from './RequestApprovalModal'
import ForwardToWeConnectModal from './ForwardToWeConnectModal'
import EscalateToL2Modal from './EscalateToL2Modal'

/*
 * ================================================================
 * TICKET WORKFLOW ACTIONS
 *
 * Renders exactly the transitions valid for a ticket's CURRENT
 * status AND the given role (getActionsForRole - never a hardcoded
 * per-page list). Reused by every role-based workspace (Champion,
 * WeConnect Support, Skilling Support).
 *
 * Presentation:
 *   - one available transition  -> a single primary button
 *     (Start Work / Resume Work)
 *   - two or more               -> one fixed-width "Actions" button
 *     that opens a dropdown, so a table row or the ticket-detail
 *     action area stays clean
 *
 * WeConnect Support's single "Submit for Approval" transition is
 * split into two menu items - "Regional Head Approval" and "Program
 * Head Approval" - each opening the approval modal with that
 * approver preselected.
 *
 * The menu is portalled to <body> and fixed-positioned so a table's
 * horizontal-scroll container can never clip it.
 *
 * Issue Type: the requester's own pick at raise time isn't reliable,
 * so the support agent confirms the real one here - on the ticket
 * detail page, next to the Actions control (size="lg" only; a table
 * row has no room for it) - and Resolve is blocked until it's set.
 * Stored on the Ticket's `resolution_issue_type` field, separate
 * from `issue_type` (still the raiser's own value, still driving
 * auto-routing, untouched).
 * ================================================================
 */

function TicketWorkflowActions({ ticket, role, size = 'sm' }) {
  const { startWork, resumeWork, submitForApproval, escalateToL2, resolveFromL2 } = useTickets()

  const [modal, setModal] = useState(null) // 'ask-user' | 'resolve' | 'forward' | 'approval' | 'escalate-l2' | null
  const [approvalType, setApprovalType] = useState('Regional Head')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState('')
  const [issueType, setIssueType] = useState('')
  const [issueTypeOptions, setIssueTypeOptions] = useState([])
  const [issueTypeError, setIssueTypeError] = useState('')
  const [issueTypeMenuOpen, setIssueTypeMenuOpen] = useState(false)
  const [issueTypeMenuPos, setIssueTypeMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const issueTypeTriggerRef = useRef(null)
  const issueTypeListRef = useRef(null)

  const actions = getTicketActionsForRole(ticket, role)
  const showIssueTypePicker =
    size === 'lg' &&
    SUPPORT_ROLES.includes(role) &&
    actions.some((action) => action.key === 'RESOLVE')

  useEffect(() => {
    if (!showIssueTypePicker) return

    let cancelled = false
    getTicketFormOptions()
      .then(({ issueTypes }) => {
        if (!cancelled) setIssueTypeOptions(issueTypes)
      })
      .catch(() => {
        // Left empty on failure - Resolve stays blocked (no option
        // to pick) until a reload succeeds.
      })

    return () => {
      cancelled = true
    }
  }, [showIssueTypePicker, ticket.id])

  // Start Work / Resume Work call the real Frappe backend directly
  // (no modal) - this is what shows the actual backend error instead
  // of pretending the transition succeeded.
  const runDirectTransition = async (run) => {
    setActionError('')
    setPending(true)
    try {
      await run()
    } catch (error) {
      setActionError(error.message || 'That action could not be completed.')
    } finally {
      setPending(false)
    }
  }

  // Close either menu when the PAGE scrolls (or resizes) - both are
  // fixed-positioned and would otherwise drift from their trigger.
  // `scroll` doesn't bubble, but a capturing listener on window still
  // fires for it regardless of where it happened - including a
  // scroll of the Issue Type list's own internal overflow, which
  // must NOT close it (that's the whole point of scrolling it), so
  // that one target is explicitly excluded.
  useEffect(() => {
    if (!menuOpen && !issueTypeMenuOpen) return undefined

    const closeOnScroll = (event) => {
      if (issueTypeListRef.current?.contains(event.target)) return
      setMenuOpen(false)
      setIssueTypeMenuOpen(false)
    }
    const closeOnResize = () => {
      setMenuOpen(false)
      setIssueTypeMenuOpen(false)
    }
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnResize)

    return () => {
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnResize)
    }
  }, [menuOpen, issueTypeMenuOpen])

  if (!role || actions.length === 0) {
    return null
  }

  const openApproval = (type) => {
    setApprovalType(type)
    setModal('approval')
  }

  // Always opens downward, straight under the trigger - unlike the
  // Actions menu below, this one never flips up.
  const openIssueTypeMenu = () => {
    const rect = issueTypeTriggerRef.current?.getBoundingClientRect()

    if (rect) {
      const menuWidth = 208 // w-52
      setIssueTypeMenuPos({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - menuWidth - 8),
      })
    }

    setIssueTypeMenuOpen(true)
  }

  const chooseIssueType = (option) => {
    setIssueType(option)
    setIssueTypeError('')
    setIssueTypeMenuOpen(false)
  }

  // Resolve is blocked - the modal never opens - until an Issue Type
  // is picked from the box next to Actions. Not relevant to Champion
  // (showIssueTypePicker is only ever true for the two support
  // roles), so this is a no-op there.
  const openResolve = () => {
    if (showIssueTypePicker && !issueType) {
      setIssueTypeError('Select the issue type before resolving this ticket.')
      return
    }
    setIssueTypeError('')
    setModal('resolve')
  }

  /*
   * The flat list of dropdown items - one per available transition,
   * except Submit for Approval which becomes two.
   */
  const menuItems = actions.flatMap((action) => {
    if (action.key === 'SUBMIT_FOR_APPROVAL') {
      if (role !== WECONNECT_SUPPORT_ROLE) {
        return [{
          key: 'SUBMIT_FOR_APPROVAL',
          label: action.label,
          Icon: Send,
          accent: 'text-violet-600',
          run: () => submitForApproval(ticket.id, role),
        }]
      }
      return [
        {
          key: 'APPROVAL_RH',
          label: 'Regional Head Approval',
          Icon: Building2,
          accent: 'text-violet-600',
          run: () => openApproval('Regional Head'),
        },
        {
          key: 'APPROVAL_PH',
          label: 'Program Head Approval',
          Icon: Send,
          accent: 'text-violet-600',
          run: () => openApproval('Program Head'),
        },
      ]
    }

    const map = {
      START_WORK: { Icon: PlayCircle, accent: 'text-teal-700', run: () => startWork(ticket.id, role) },
      // Reopened -> Skilling Support In Progress is the same real
      // "Start Work" transition/action as Open -> ...In Progress
      // (see ticketWorkflow.js) - same button, same startWork() call.
      START_WORK_FROM_REOPENED: { Icon: PlayCircle, accent: 'text-teal-700', run: () => startWork(ticket.id, role) },
      RESUME_WORK: { Icon: RotateCcw, accent: 'text-teal-700', run: () => resumeWork(ticket.id, role) },
      ASK_USER: { Icon: MessageCircleQuestion, accent: 'text-blue-600', run: () => setModal('ask-user') },
      RESOLVE: { Icon: CheckCircle2, accent: 'text-emerald-600', run: openResolve },
      FORWARD_TO_WECONNECT: { Icon: Forward, accent: 'text-amber-700', run: () => setModal('forward') },
      NEED_L2: { Icon: ArrowUpRight, accent: 'text-indigo-600', run: () => setModal('escalate-l2') },
      RESOLVED_BY_L2: { Icon: Undo2, accent: 'text-teal-700', run: () => resolveFromL2(ticket.id, role) },
    }[action.key] || { Icon: CheckCircle2, accent: 'text-slate-400', run: () => undefined }

    return [{ key: action.key, label: action.label, ...map }]
  })

  const runItem = (item) => {
    setMenuOpen(false)
    item.run()
  }

  // Fixed width + centred content so Start Work, Resume Work and the
  // "Actions" trigger all render at the same size.
  const buttonClass =
    size === 'sm'
      ? 'inline-flex w-32 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition'
      : 'inline-flex w-36 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition'

  const modals = (
    <>
      {modal === 'resolve' && (
        <ResolveTicketModal
          ticket={ticket}
          role={role}
          issueType={issueType}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'ask-user' && (
        <AskUserModal ticket={ticket} role={role} onClose={() => setModal(null)} />
      )}
      {modal === 'approval' && (
        <RequestApprovalModal
          ticket={ticket}
          approverType={approvalType}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'forward' && (
        <ForwardToWeConnectModal ticket={ticket} onClose={() => setModal(null)} />
      )}
      {modal === 'escalate-l2' && (
        <EscalateToL2Modal ticket={ticket} role={role} onClose={() => setModal(null)} />
      )}
    </>
  )

  // The Issue Type control shown next to Actions on the ticket detail
  // page (size="lg", support roles, only while Resolve is on offer).
  // A custom dropdown, not a native <select> - and unlike the
  // Actions menu, always opens downward, never flipped up.
  const issueTypePicker = showIssueTypePicker && (
    <div className="relative shrink-0">
      <button
        ref={issueTypeTriggerRef}
        type="button"
        onClick={() => (issueTypeMenuOpen ? setIssueTypeMenuOpen(false) : openIssueTypeMenu())}
        aria-haspopup="listbox"
        aria-expanded={issueTypeMenuOpen}
        className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
          issueTypeError
            ? 'border-rose-300 bg-rose-50/60 text-rose-600'
            : issueType
              ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
              : 'border-dashed border-slate-300 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700'
        }`}
      >
        <Tag size={13} className={issueType ? 'text-teal-600' : 'text-slate-400'} />
        <span className="max-w-[120px] truncate">{issueType || 'Issue Type'}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${issueTypeMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {issueTypeError && (
        <p className="absolute left-0 top-full z-10 mt-1 w-max max-w-[200px] text-[10px] text-rose-600">
          {issueTypeError}
        </p>
      )}

      {issueTypeMenuOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setIssueTypeMenuOpen(false)} />
            <div
              ref={issueTypeListRef}
              role="listbox"
              className="fixed z-[56] max-h-72 w-52 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              style={{ top: issueTypeMenuPos.top, left: issueTypeMenuPos.left }}
            >
              {issueTypeOptions.length === 0 && (
                <p className="px-3 py-2.5 text-xs text-slate-400">No issue types configured</p>
              )}
              {issueTypeOptions.map((option) => {
                const selected = option === issueType
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => chooseIssueType(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                      selected ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                    {selected && <Check size={14} className="shrink-0 text-teal-600" />}
                  </button>
                )
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  )

  /*
   * One transition available (Start Work / Resume Work) - a single
   * primary button, no dropdown. These run straight against the
   * real backend (no modal), so the click is awaited and any
   * backend error is shown inline instead of the button silently
   * "succeeding".
   */
  if (actions.length === 1) {
    const only = menuItems[0]

    return (
      <>
        <div className="inline-flex flex-col items-end gap-1">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => runDirectTransition(only.run)}
              className={`${buttonClass} bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <only.Icon size={14} />
              {pending ? 'Please wait…' : only.label}
            </button>
            {issueTypePicker}
          </div>
          {actionError && (
            <span className="flex max-w-[220px] items-start gap-1 text-right text-[10px] leading-snug text-rose-600">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {actionError}
            </span>
          )}
        </div>
        {modals}
      </>
    )
  }

  /*
   * Two or more - one "Actions" button opening a dropdown.
   */
  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()

    if (rect) {
      const estHeight = menuItems.length * 42 + 8
      const opensUp = rect.bottom + 6 + estHeight > window.innerHeight

      setMenuPos({
        top: opensUp ? Math.max(8, rect.top - 6 - estHeight) : rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      })
    }

    setMenuOpen(true)
  }

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={`${buttonClass} bg-teal-700 text-white hover:bg-teal-800`}
        >
          Actions
          <ChevronDown
            size={14}
            className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {issueTypePicker}
      </div>

      {menuOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} />
            <div
              role="menu"
              className="fixed z-[56] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={() => runItem(item)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <item.Icon size={15} className={item.accent} />
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}

      {modals}
    </>
  )
}

export default TicketWorkflowActions
