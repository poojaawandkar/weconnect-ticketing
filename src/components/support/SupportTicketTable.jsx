import { ArrowUpRight, Search } from 'lucide-react'

import { statusStyles, priorityStyles } from '../../utils/ticketStyles'
import { stageLabel } from '../../data/supportStages'
import { getTicketActionsForRole } from '../../data/ticketWorkflow'
import { shortDate } from '../../utils/ticketDates'
import TicketWorkflowActions from '../Dashboard/TicketWorkflowActions'
import { usePagination } from '../common/usePagination'
import Pagination from '../common/Pagination'

/*
 * ================================================================
 * SUPPORT TICKET TABLE
 *
 * One operational table shared by the CenterOps / Skilling Tickets
 * and Approvals pages. Columns are chosen per page via the
 * `columns` prop so no page reproduces another page's full layout.
 *
 * The "action" column renders TicketWorkflowActions using the role
 * returned by actionRoleForTicket(ticket) - which is null (and so
 * renders nothing) whenever the current user isn't allowed to act
 * on that ticket per the Frappe workflow. Rows stay read-only in
 * that case; they are never given a fake button.
 * ================================================================
 */

const HEADERS = {
  ticket: 'Ticket',
  issue: 'Issue',
  subModule: 'Sub-module',
  module: 'Module',
  region: 'Region',
  center: 'Center',
  regionCenter: 'Region / Center',
  assignedTo: 'Assigned To',
  requester: 'Requester',
  priority: 'Priority',
  status: 'Current Status',
  stage: 'Current Stage',
  updated: 'Updated',
  created: 'Created',
  requiredAction: 'Required Action',
  approver: 'Approver',
  approvalType: 'Approval Type',
  approvalRecipient: 'Approval Recipient',
  approvalStatus: 'Approval Status',
  requestedOn: 'Requested On',
  action: 'Action',
}

function requiredActionLabel(ticket, role) {
  const actions = role ? getTicketActionsForRole(ticket, role) : []
  if (actions.length > 0) return actions.map((a) => a.label).join(' / ')

  if (ticket.status === 'Awaiting User') return 'Waiting on requester'
  if (ticket.status === 'Pending Approval') return 'Awaiting approver'
  if (ticket.status === 'Resolved') return 'Awaiting closure'
  if (ticket.status === 'Closed') return '—'
  return 'Monitor'
}

function Cell({ column, ticket, role, onOpen }) {
  switch (column) {
    case 'ticket':
      return (
        <button
          type="button"
          onClick={() => onOpen(ticket.id)}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900"
        >
          {ticket.id}
        </button>
      )

    case 'issue':
      return (
        <div className="max-w-[260px]">
          <p className="truncate text-xs font-medium text-slate-700">
            {ticket.issue}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {ticket.module} · {ticket.subModule}
            {ticket.requestType === 'Data Request' && ' · Data Request'}
          </p>
        </div>
      )

    case 'subModule':
      return <span className="text-xs text-slate-600">{ticket.subModule}</span>

    case 'module':
      return (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {ticket.module}
        </span>
      )

    case 'region':
      return <span className="text-xs text-slate-600">{ticket.region}</span>

    case 'center':
      return <span className="text-xs text-slate-600">{ticket.center}</span>

    case 'regionCenter':
      return (
        <span className="text-xs text-slate-500">
          {ticket.region} · {ticket.center}
        </span>
      )

    case 'assignedTo':
      return (
        <span className="text-xs text-slate-500">
          {ticket.supportTeam || 'Unrouted'}
        </span>
      )

    case 'requester':
      return <span className="text-xs text-slate-500">{ticket.requesterRole}</span>

    case 'priority':
      return (
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${priorityStyles[ticket.priority] || 'text-slate-500 bg-slate-100'}`}
        >
          {ticket.priority}
        </span>
      )

    case 'status':
    case 'stage': {
      const style = statusStyles[ticket.status] || statusStyles.Open
      return (
        <span
          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-medium ${style.background} ${style.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {stageLabel(ticket.status)}
        </span>
      )
    }

    case 'updated':
      return <span className="text-[10px] text-slate-400">{shortDate(ticket.updatedDate)}</span>

    case 'created':
      return <span className="text-[10px] text-slate-400">{shortDate(ticket.createdDate)}</span>

    case 'requiredAction':
      return (
        <span className="text-xs text-slate-500">
          {requiredActionLabel(ticket, role)}
        </span>
      )

    case 'approver':
      return (
        <span className="text-xs text-slate-600">
          {ticket.approvalRequest
            ? `${ticket.approvalRequest.approverType}${ticket.approvalRequest.approver ? ` · ${ticket.approvalRequest.approver}` : ''}`
            : '—'}
        </span>
      )

    case 'approvalType':
      return (
        <span className="text-xs text-slate-600">
          {ticket.approvalType || '—'}
        </span>
      )

    case 'approvalRecipient':
      return (
        <span className="text-xs text-slate-600">
          {ticket.approvalRecipient || '—'}
        </span>
      )

    case 'requestedOn':
      return (
        <span className="text-[10px] text-slate-400">
          {ticket.approvalRequestedOn ? shortDate(ticket.approvalRequestedOn) : '—'}
        </span>
      )

    case 'approvalStatus': {
      const value = ticket.approvalStatus && ticket.approvalStatus !== 'Not Required'
        ? ticket.approvalStatus
        : (ticket.status === 'Pending Approval' ? 'Pending' : '—')
      const tone =
        value === 'Approved'
          ? 'bg-emerald-50 text-emerald-600'
          : value === 'Rejected'
            ? 'bg-rose-50 text-rose-600'
            : value === 'Pending'
              ? 'bg-violet-50 text-violet-600'
              : 'bg-slate-100 text-slate-500'
      return (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${tone}`}>
          {value}
        </span>
      )
    }

    case 'action':
      return role ? (
        <TicketWorkflowActions ticket={ticket} role={role} />
      ) : (
        <button
          type="button"
          onClick={() => onOpen(ticket.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"
          aria-label={`Open ${ticket.id}`}
        >
          <ArrowUpRight size={15} />
        </button>
      )

    default:
      return null
  }
}

function SupportTicketTable({
  tickets,
  columns,
  onOpen,
  actionRoleForTicket = () => null,
  emptyText = 'No tickets in this view.',
  pageSize = 5,
}) {
  const pager = usePagination(tickets, pageSize)

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <Search size={24} className="text-slate-300" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">Nothing here</p>
        <p className="mt-1 max-w-sm text-xs text-slate-400">{emptyText}</p>
      </div>
    )
  }

  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {columns.map((column) => (
              <th
                key={column}
                className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${
                  column === 'action' ? 'text-right' : 'text-left'
                }`}
              >
                {HEADERS[column] || column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pager.pageItems.map((ticket) => {
            const role = actionRoleForTicket(ticket)

            return (
              <tr
                key={ticket.id}
                className="group border-b border-slate-50 transition hover:bg-slate-50/60"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`px-5 py-4 align-top ${
                      column === 'action' ? 'text-right' : ''
                    } ${column === 'issue' ? '' : 'whitespace-nowrap'}`}
                  >
                    <Cell
                      column={column}
                      ticket={ticket}
                      role={role}
                      onOpen={onOpen}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <Pagination {...pager} />
    </>
  )
}

export default SupportTicketTable
