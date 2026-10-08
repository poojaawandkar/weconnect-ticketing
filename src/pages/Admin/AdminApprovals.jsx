import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { useAdminFilters } from '../../admin/data/useAdminFilters'
import { useAdminTicketsStatus } from '../../admin/data/mockTickets'
import { useRegionScope } from '../../admin/data/regionScope'
import { approvalPipeline, fmtHours } from '../../admin/data/analytics'
import { APPROVAL_TYPES } from '../../admin/data/dimensions'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import Panel from '../../admin/components/Panel'
import KpiCard from '../../admin/components/KpiCard'
import DonutChart from '../../admin/charts/DonutChart'
import SupportStageTabs from '../../components/support/SupportStageTabs'
import { shortDate } from '../../utils/ticketDates'
import { usePagination } from '../../components/common/usePagination'
import Pagination from '../../components/common/Pagination'

/*
 * APPROVALS
 *
 * "WeConnect Admin" reads the pipeline. "Program Head" also acts on
 * it: each pending row has an Open button that goes to the ticket
 * detail page, where the request (and the Support team's remarks)
 * can be read in full before approving or rejecting. Decisions are
 * the real Ticket / Ticket Approval records (via
 * decide_program_head_approval / decide_regional_head_approval), so
 * the "Approved" tab below reads the same persisted data the
 * ticket detail page and the notification system do - never a
 * session-only store.
 */

const subjectFor = (t) => t.subject || `${t.subModule} · ${t.issueTheme}`

function StatusPill({ status }) {
  const style =
    status === 'Approved'
      ? 'bg-emerald-50 text-emerald-600'
      : status === 'Rejected'
        ? 'bg-rose-50 text-rose-600'
        : 'bg-amber-50 text-amber-600'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style}`}>{status}</span>
}

function AdminApprovals() {
  const navigate = useNavigate()
  const { isProgramHead } = useAuth()
  const scope = useRegionScope()
  const { error: ticketsError } = useAdminTicketsStatus()
  // No period filter - an approval pipeline is about current state,
  // not a date window; pending stays visible however old it is.
  const { filteredTickets, controls } = useAdminFilters({
    fields: scope.isRegionHead
      ? ['region', 'module', 'supportTeam']
      : ['region', 'module', 'supportTeam', 'approvalType'],
    regionScope: scope.regions,
  })

  // A Regional Head only ever handles "Regional Head" approval
  // requests, and only in their region (already scoped above).
  const inScope = useMemo(
    () =>
      scope.isRegionHead
        ? filteredTickets.filter((t) => t.approval?.type === 'Regional Head')
        : filteredTickets,
    [filteredTickets, scope.isRegionHead]
  )

  const canAct = isProgramHead || scope.isRegionHead
  const visibleTypes = useMemo(
    () => (scope.isRegionHead ? ['Regional Head'] : APPROVAL_TYPES),
    [scope.isRegionHead]
  )

  const p = useMemo(() => approvalPipeline(inScope), [inScope])

  const byType = useMemo(
    () =>
      visibleTypes.map((type) => {
        const rows = p.rows.filter((t) => t.approval.type === type)
        const count = (s) => rows.filter((t) => t.approval.status === s).length
        return { type, pending: count('Pending'), approved: count('Approved'), rejected: count('Rejected') }
      }),
    [p.rows, visibleTypes]
  )

  const pending = useMemo(
    () =>
      p.rows
        .filter((t) => t.approval.status === 'Pending')
        .sort((a, b) => a.approval.requestedAt - b.approval.requestedAt),
    [p.rows]
  )
  const pager = usePagination(pending, 8)

  // The real, persisted decision history (Approved + Rejected) for
  // every request in scope - straight from Ticket.approval_status /
  // approval_responded_on / approval_comments, the same fields the
  // ticket detail page writes via decide_program_head_approval /
  // decide_regional_head_approval and the notification system reads.
  const decided = useMemo(
    () =>
      p.rows
        .filter((t) => t.approval.status === 'Approved' || t.approval.status === 'Rejected')
        .sort((a, b) => (b.approval.decidedAt || 0) - (a.approval.decidedAt || 0)),
    [p.rows]
  )

  const [tab, setTab] = useState('pending')

  // 'YYYY-MM' from an <input type="month">, or '' for every month.
  const [decisionMonth, setDecisionMonth] = useState('')

  const monthKeyOf = (date) => {
    if (!date) return null
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(+d)) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const decidedInMonth = useMemo(
    () => (decisionMonth ? decided.filter((t) => monthKeyOf(t.approval.decidedAt) === decisionMonth) : decided),
    [decided, decisionMonth]
  )

  const decidedCounts = useMemo(
    () => ({
      approved: decidedInMonth.filter((t) => t.approval.status === 'Approved').length,
      rejected: decidedInMonth.filter((t) => t.approval.status === 'Rejected').length,
    }),
    [decidedInMonth]
  )

  const decidedPager = usePagination(decidedInMonth, 8)

  const stages = [
    { key: 'pending', label: 'Pending Approval', count: pending.length },
    { key: 'approved', label: 'Approved', count: decided.length },
  ]

  const cards = [
    { label: 'Sent for Approval', value: p.sent, emphasis: true },
    { label: 'Pending', value: p.pending, tone: p.pending ? 'pending' : undefined },
    { label: 'Approved', value: p.approved, tone: 'success' },
    { label: 'Rejected', value: p.rejected, tone: p.rejected ? 'warning' : undefined },
  ]

  const donut = [
    { label: 'Pending', value: p.pending, color: '#d97706' },
    { label: 'Approved', value: p.approved, color: '#10b981' },
    { label: 'Rejected', value: p.rejected, color: '#e11d48' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-7 lg:px-9">
      <AdminPageHeader
        title="Approvals"
        question={
          canAct
            ? 'Open a request to read it in full, then approve or reject.'
            : 'Where does the approval pipeline stand?'
        }
        controls={controls}
      />

      {ticketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{ticketsError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Approval Status" subtitle="Pending, approved and rejected">
          <DonutChart slices={donut} centerLabel="requests" />
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            Average time to a decision:{' '}
            <span className="font-semibold text-slate-700">{fmtHours(p.avgApprovalHours)}</span>
          </p>
        </Panel>

        <Panel
          title="By Approval Type"
          subtitle={scope.isRegionHead ? 'Requests routed to you' : 'Regional Head vs Program Head'}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Approval Type', 'Pending', 'Approved', 'Rejected'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.map((r) => (
                  <tr key={r.type} className="border-b border-slate-50">
                    <td className="px-2 py-3 text-xs font-semibold text-slate-700">{r.type}</td>
                    <td className={`px-2 py-3 text-xs font-medium ${r.pending ? 'text-amber-600' : 'text-slate-500'}`}>{r.pending}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">{r.approved}</td>
                    <td className={`px-2 py-3 text-xs font-medium ${r.rejected ? 'text-rose-600' : 'text-slate-500'}`}>{r.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Program Head / Region Head — read then decide */}
      {canAct && (
        <div className="mt-6">
          <SupportStageTabs stages={stages} value={tab} onChange={setTab} />

          {tab === 'pending' ? (
            <Panel
              title="Pending Approval Requests"
              subtitle={
                scope.isRegionHead
                  ? 'Requests waiting for you — open one to review and decide'
                  : 'Oldest first — open a request to review and decide'
              }
              className="mt-4"
              action={
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
                  {pending.length} pending
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Ticket', 'Subject', 'Module', 'Center', 'Requested By', 'Support Team', 'Requested On', 'Approval Type', ''].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pager.pageItems.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/admin/tickets/${t.id}`)}
                        className="group cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60"
                      >
                        <td className="px-2 py-3 text-xs font-semibold text-teal-700">{t.id}</td>
                        <td className="px-2 py-3 text-xs text-slate-600">{subjectFor(t)}</td>
                        <td className="px-2 py-3 text-xs text-slate-600">{t.module}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{t.center}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{t.approval.requestedBy || t.supportTeam}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{t.supportTeam}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-[11px] text-slate-400">{shortDate(t.approval.requestedAt)}</td>
                        <td className="px-2 py-3 text-xs text-slate-600">{t.approval.type}</td>
                        <td className="px-2 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1 text-[11px] font-medium text-white transition group-hover:bg-teal-800">
                            Open <ArrowRight size={12} />
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pending.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-2 py-10 text-center text-xs text-slate-400">
                          No pending approval requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...pager} />
            </Panel>
          ) : (
            <Panel
              title="Approved"
              subtitle="Every request you've decided — approved and rejected, with your remarks"
              className="mt-4"
              action={
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={decisionMonth}
                    onChange={(e) => setDecisionMonth(e.target.value)}
                    aria-label="Filter by month"
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                  {decisionMonth && (
                    <button
                      type="button"
                      onClick={() => setDecisionMonth('')}
                      className="text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              }
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                  {decidedCounts.approved} Approved
                </span>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600">
                  {decidedCounts.rejected} Rejected
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Ticket', 'Subject', 'Approval Type', 'Decision', 'Decided On', 'Comments'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {decidedPager.pageItems.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/admin/tickets/${t.id}`)}
                        className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60"
                      >
                        <td className="px-2 py-3 text-xs font-semibold text-teal-700">{t.id}</td>
                        <td className="px-2 py-3 text-xs text-slate-600">{subjectFor(t)}</td>
                        <td className="px-2 py-3 text-xs text-slate-600">{t.approval.type}</td>
                        <td className="px-2 py-3"><StatusPill status={t.approval.status} /></td>
                        <td className="whitespace-nowrap px-2 py-3 text-[11px] text-slate-400">{shortDate(t.approval.decidedAt)}</td>
                        <td className="px-2 py-3 text-xs text-slate-500">{t.approval.note || <span className="text-slate-300">—</span>}</td>
                      </tr>
                    ))}
                    {decidedInMonth.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-10 text-center text-xs text-slate-400">
                          No approved or rejected requests {decisionMonth ? 'in this month' : 'yet'}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...decidedPager} />
            </Panel>
          )}
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}

export default AdminApprovals
