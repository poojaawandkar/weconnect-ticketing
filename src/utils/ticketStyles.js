/*
 * Shared status / priority badge styles for ticket tables, used
 * across both the User and Champion ticket views.
 *
 * Includes both:
 *  - the legacy placeholder statuses the User-side dummy data
 *    (src/data/tickets.js) already used before the real Frappe
 *    workflow was known: Open, In Progress, Replied, Resolved,
 *    Closed - kept as-is since the User workspace is unchanged.
 *  - the real Frappe workflow states from
 *    src/data/ticketWorkflow.js, used by the Champion workspace.
 *
 * Colors for shared names (Open, Resolved, Closed) and the real
 * workflow states mirror TicketDetails.jsx's original statusConfig,
 * which is now sourced from here instead of being duplicated.
 */

export const statusStyles = {
  // Legacy / User-side
  Open: {
    background: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
    border: 'border-rose-100',
  },
  'In Progress': {
    background: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    border: 'border-amber-100',
  },
  Replied: {
    background: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-100',
  },
  Resolved: {
    background: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  Closed: {
    background: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },

  // Real Frappe workflow states (Champion workspace)
  'Champion In Progress': {
    background: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    border: 'border-amber-100',
  },
  'Awaiting User': {
    background: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-100',
  },
  'Pending Approval': {
    background: 'bg-violet-50',
    text: 'text-violet-600',
    dot: 'bg-violet-500',
    border: 'border-violet-100',
  },
  Reopened: {
    background: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    border: 'border-orange-100',
  },
  'WeConnect Support In Progress': {
    background: 'bg-cyan-50',
    text: 'text-cyan-600',
    dot: 'bg-cyan-500',
    border: 'border-cyan-100',
  },
  'Skilling Support In Progress': {
    background: 'bg-teal-50',
    text: 'text-teal-600',
    dot: 'bg-teal-500',
    border: 'border-teal-100',
  },
  'Sent to L2': {
    background: 'bg-indigo-50',
    text: 'text-indigo-600',
    dot: 'bg-indigo-500',
    border: 'border-indigo-100',
  },
}

export const priorityStyles = {
  Urgent: 'text-red-600 bg-red-50',
  High: 'text-rose-600 bg-rose-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low: 'text-slate-500 bg-slate-100',
}
