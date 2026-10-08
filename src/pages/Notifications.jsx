import { useMemo } from 'react'
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckCircle2,
  HelpCircle,
  Inbox,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  ThumbsDown,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useNotifications } from '../notifications/useNotifications'
import { useAuth } from '../auth/useAuth'
import { displayNameFromUser } from '../auth/identity'

/*
 * ================================================================
 * NOTIFICATION EVENT -> PRESENTATION
 *
 * Every item comes from weconnect_ticketing.api.get_my_notifications
 * (see src/notifications/NotificationsProvider.jsx) - real, derived
 * events from Ticket / Comment / Ticket Approval data. Nothing here
 * is seed data.
 *
 * `comment` and `status-*` are the original requester-side events.
 * `new_ticket` / `forwarded` / `awaiting_reply` (WeConnect/Skilling
 * Support), `approval_request` (Regional Head/Program Head) and
 * `approval_decision` / `approval_clarification` (whichever support
 * agent requested the approval) are the role-aware events added on
 * top - same map/switch shape, nothing about the page's layout,
 * grouping or read tracking changes.
 * ================================================================
 */

const EVENT_CONFIG = {
  comment: {
    icon: MessageCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accent: 'bg-blue-500',
  },
  'status-Resolved': {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accent: 'bg-emerald-500',
  },
  'status-Closed': {
    icon: CheckCheck,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    accent: 'bg-slate-400',
  },
  'status-Awaiting User': {
    icon: AlertCircle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accent: 'bg-amber-500',
  },
  'status-Reopened': {
    icon: RotateCcw,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    accent: 'bg-orange-500',
  },
  new_ticket: {
    icon: Inbox,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accent: 'bg-blue-500',
  },
  forwarded: {
    icon: Send,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    accent: 'bg-indigo-500',
  },
  awaiting_reply: {
    icon: AlertCircle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accent: 'bg-amber-500',
  },
  approval_request: {
    icon: ShieldCheck,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-700',
    accent: 'bg-teal-600',
  },
  'approval_decision-Approved': {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accent: 'bg-emerald-500',
  },
  'approval_decision-Rejected': {
    icon: ThumbsDown,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    accent: 'bg-rose-500',
  },
  approval_clarification: {
    icon: HelpCircle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accent: 'bg-amber-500',
  },
}
const DEFAULT_EVENT_CONFIG = {
  icon: XCircle,
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-500',
  accent: 'bg-slate-400',
}

function configFor(notification) {
  const key =
    notification.type === 'status'
      ? `status-${notification.status}`
      : notification.type === 'approval_decision'
        ? `approval_decision-${notification.decision}`
        : notification.type
  return EVENT_CONFIG[key] || DEFAULT_EVENT_CONFIG
}

function titleFor(notification) {
  if (notification.type === 'comment') {
    return `${displayNameFromUser(notification.by)} replied on your ticket`
  }

  if (notification.type === 'new_ticket') {
    return `New ticket routed to ${notification.team}`
  }

  if (notification.type === 'forwarded') {
    return `Ticket forwarded to ${notification.team}`
  }

  if (notification.type === 'awaiting_reply') {
    return `${displayNameFromUser(notification.by)} replied - action needed`
  }

  if (notification.type === 'approval_request') {
    return `Awaiting your ${notification.approvalType} approval`
  }

  if (notification.type === 'approval_decision') {
    return notification.decision === 'Approved'
      ? 'Your approval request was approved'
      : 'Your approval request was rejected'
  }

  if (notification.type === 'approval_clarification') {
    return 'Clarification requested on your approval request'
  }

  switch (notification.status) {
    case 'Resolved':
      return 'Ticket resolved'
    case 'Closed':
      return 'Ticket closed'
    case 'Awaiting User':
      return 'Support needs more information'
    case 'Reopened':
      return 'Ticket reopened'
    default:
      return `Ticket ${notification.status || 'updated'}`
  }
}

function messageFor(notification) {
  if (notification.type === 'comment') {
    return notification.message
  }

  if (notification.type === 'new_ticket') {
    return `"${notification.subject}" needs to be picked up.`
  }

  if (notification.type === 'forwarded') {
    return notification.reason
      ? `"${notification.subject}" was forwarded: ${notification.reason}`
      : `"${notification.subject}" was forwarded to your team.`
  }

  if (notification.type === 'awaiting_reply') {
    return notification.message
  }

  if (notification.type === 'approval_request') {
    return `"${notification.subject}" is waiting on your decision.`
  }

  if (notification.type === 'approval_decision') {
    return notification.comments
      ? `"${notification.subject}": ${notification.comments}`
      : `"${notification.subject}" was ${String(notification.decision).toLowerCase()}.`
  }

  if (notification.type === 'approval_clarification') {
    return notification.question
  }

  switch (notification.status) {
    case 'Resolved':
      return `"${notification.subject}" has been marked resolved. Review the resolution and let us know if it solved your issue.`
    case 'Closed':
      return `"${notification.subject}" has been closed.`
    case 'Awaiting User':
      return `The support team is waiting on more details from you for "${notification.subject}".`
    case 'Reopened':
      return `"${notification.subject}" was reopened.`
    default:
      return notification.subject
  }
}

/*
 * ================================================================
 * NOTIFICATION -> TICKET ROUTE
 *
 * Each workspace has its own ticket detail route (WeConnect User:
 * /tickets/:id, WeConnect Support: /support/tickets/:id, Skilling
 * Support: /skilling-support/tickets/:id, Admin/Program Head/
 * Regional Head: /admin/tickets/:id) - which one is correct depends
 * on the notification's own event type (who it was generated for),
 * not just which roles the viewer happens to hold.
 * ================================================================
 */

function ticketPathFor(notification, auth) {
  switch (notification.type) {
    case 'approval_request':
      return `/admin/tickets/${notification.ticket}`
    case 'new_ticket':
    case 'forwarded':
    case 'awaiting_reply':
      return notification.team === 'Skilling Support'
        ? `/skilling-support/tickets/${notification.ticket}`
        : `/support/tickets/${notification.ticket}`
    case 'approval_decision':
    case 'approval_clarification':
      // The recipient here is always the individual support agent
      // who requested the approval - route by whichever support
      // workspace this viewer actually has.
      return auth.isSkillingSupport && !auth.isWeConnectSupport
        ? `/skilling-support/tickets/${notification.ticket}`
        : `/support/tickets/${notification.ticket}`
    default:
      return `/tickets/${notification.ticket}`
  }
}

/*
 * ================================================================
 * RELATIVE TIME + DAY GROUPING
 * ================================================================
 */

function formatRelativeTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dayBucketFor(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Earlier'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  return 'Earlier'
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'Earlier']

function Notifications() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { notifications, loading, error, unreadCount, isUnread, markRead, markAllRead } =
    useNotifications()

  // Read state and the 2-day retention rule (older items only kept
  // while unread) both come from the backend via get_my_notifications.
  const visibleNotifications = notifications

  const groups = useMemo(() => {
    const byBucket = { Today: [], Yesterday: [], Earlier: [] }

    visibleNotifications.forEach((notification) => {
      byBucket[dayBucketFor(notification.timestamp)].push(notification)
    })

    return BUCKET_ORDER
      .map((bucket) => ({ bucket, items: byBucket[bucket] }))
      .filter((group) => group.items.length > 0)
  }, [visibleNotifications])

  const openTicket = (notification) => {
    if (isUnread(notification)) markRead([notification.id])
    navigate(ticketPathFor(notification, auth))
  }

  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6">

        {/* No repeated "Notifications" title here - the shared
            Header already shows the page title and a back control. */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="max-w-xl text-sm text-slate-500">
            Updates on your tickets, and - if you handle or approve tickets -
            on the ones routed or submitted to you.
          </p>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700 sm:self-auto"
            >
              <CheckCheck size={15} />

              Mark all as read
            </button>
          )}

        </div>

        {/* Summary */}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">

            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Total
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {loading ? '—' : visibleNotifications.length}
            </p>

          </div>

          <div className={`rounded-xl border px-5 py-4 transition ${
            unreadCount > 0
              ? 'border-teal-100 bg-teal-50/40'
              : 'border-slate-200 bg-white'
          }`}>

            <p className={`text-[10px] uppercase tracking-wide ${unreadCount > 0 ? 'text-teal-600' : 'text-slate-400'}`}>
              Unread
            </p>

            <p className={`mt-1 text-xl font-semibold ${unreadCount > 0 ? 'text-teal-700' : 'text-slate-900'}`}>
              {loading ? '—' : unreadCount}
            </p>

          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-5 py-4 sm:block">

            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Source
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              Your tickets
            </p>

          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Notification feed */}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

            <div className="flex items-center gap-2">

              <Bell
                size={17}
                className="text-teal-700"
              />

              <h2 className="text-sm font-semibold text-slate-800">
                Recent activity
              </h2>

            </div>

          </div>

          {loading ? (

            <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
              <Loader2 size={22} className="animate-spin text-slate-300" />
              <p className="text-sm text-slate-400">Loading notifications...</p>
            </div>

          ) : groups.length === 0 ? (

            <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <Bell size={24} className="text-slate-300" />
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-700">
                You're all caught up
              </h3>

              <p className="max-w-sm text-xs leading-relaxed text-slate-400">
                Replies, status changes, and anything routed or submitted to you will show up here as they happen.
              </p>

            </div>

          ) : (

            groups.map((group) => (

              <div key={group.bucket}>

                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 sm:px-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.bucket}
                  </p>
                </div>

                <div>

                  {group.items.map((notification) => {

                    const config = configFor(notification)
                    const Icon = config.icon
                    const unread = isUnread(notification)

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => openTicket(notification)}
                        className={`group relative flex w-full gap-4 border-b border-slate-100 px-5 py-5 text-left transition last:border-b-0 hover:bg-slate-100/70 sm:px-6 ${
                          unread ? 'bg-teal-50/40' : 'bg-white'
                        }`}
                      >

                        {/* Unread accent bar - the clear, at-a-glance
                            "this one's new" signal */}

                        <span
                          className={`absolute left-0 top-0 h-full w-1 ${
                            unread ? config.accent : 'bg-transparent'
                          }`}
                        />

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
                        >
                          <Icon size={18} className={config.iconColor} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">

                              <h3 className={`text-sm ${unread ? 'font-bold text-slate-900' : 'font-normal text-slate-700'}`}>
                                {titleFor(notification)}
                              </h3>

                              {unread && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                              )}

                            </div>

                            <span className="shrink-0 text-[10px] text-slate-400">
                              {formatRelativeTime(notification.timestamp)}
                            </span>

                          </div>

                          <p className={`mt-1 max-w-3xl truncate text-xs leading-5 ${unread ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                            {messageFor(notification)}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                              {notification.ticket}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 opacity-0 transition group-hover:opacity-100">
                              View ticket →
                            </span>

                          </div>

                        </div>

                      </button>
                    )
                  })}

                </div>

              </div>
            ))

          )}

        </div>

      </div>

    </div>
  )
}

export default Notifications
