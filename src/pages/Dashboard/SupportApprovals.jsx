import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock3, Send, XCircle } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { useSupportScope } from '../../support/useSupportScope'
import SupportStageTabs from '../../components/support/SupportStageTabs'
import SupportTicketTable from '../../components/support/SupportTicketTable'
import StatCard from '../../components/support/StatCard'
import DonutChart from '../../components/charts/DonutChart'

/*
 * ================================================================
 * APPROVALS  (WeConnect Support only)
 *
 * The whole approval pipeline in one page. It answers, at a glance:
 *   how many sent · how many pending · how many approved · how many
 *   rejected · how many waiting with the Regional Head vs the
 *   Program Head.
 *
 * Every row is a real ticket, read straight off the real, flat
 * Frappe Ticket approval fields (approvalType / approvalStatus /
 * approvalRecipient / approvalRequestedOn / approvalRespondedOn /
 * approvalComments - see mapWeConnectTicketSummary in
 * src/api/tickets.js) - never the old client-only approvalRequest
 * object. The approver's decision itself is recorded in Frappe (via
 * the real Regional Head / Program Head workflow actions, not yet
 * built in this app) - this page just reads it.
 * ================================================================
 */

const STATUS_TABS = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'Pending', label: 'Pending', match: (s) => s === 'Pending' },
  { key: 'Approved', label: 'Approved', match: (s) => s === 'Approved' },
  { key: 'Rejected', label: 'Rejected', match: (s) => s === 'Rejected' },
]

const APPROVER_FILTERS = ['All', 'Regional Head', 'Program Head']

const TABLE_COLUMNS = [
  'ticket',
  'issue',
  'approvalType',
  'approvalRecipient',
  'approvalStatus',
  'requestedOn',
  'updated',
]

const DIST = [
  { key: 'Pending', color: '#7c3aed' }, // violet-600
  { key: 'Approved', color: '#059669' }, // emerald-600
  { key: 'Rejected', color: '#e11d48' }, // rose-600
]

function SupportApprovals() {
  const navigate = useNavigate()
  const { tickets, weConnectTicketsError } = useTickets()
  const { scopeTickets } = useSupportScope()

  const [tab, setTab] = useState('ALL')
  const [approverFilter, setApproverFilter] = useState('All')

  const approvals = useMemo(
    () => scopeTickets(tickets).filter((t) => Boolean(t.approvalType)),
    [tickets, scopeTickets]
  )

  const stats = useMemo(() => {
    const pending = approvals.filter((t) => t.approvalStatus === 'Pending')
    return {
      sent: approvals.length,
      pending: pending.length,
      approved: approvals.filter((t) => t.approvalStatus === 'Approved').length,
      rejected: approvals.filter((t) => t.approvalStatus === 'Rejected').length,
      pendingRegionalHead: pending.filter((t) => t.approvalType === 'Regional Head').length,
      pendingProgramHead: pending.filter((t) => t.approvalType === 'Program Head').length,
    }
  }, [approvals])

  const distSlices = DIST.map((d) => ({
    name: d.key,
    value: approvals.filter((t) => t.approvalStatus === d.key).length,
    color: d.color,
  })).filter((s) => s.value > 0)

  const pendingMax = Math.max(stats.pendingRegionalHead, stats.pendingProgramHead, 1)

  // Approver filter narrows everything below the summary.
  const filteredByApprover = useMemo(
    () =>
      approverFilter === 'All'
        ? approvals
        : approvals.filter((t) => t.approvalType === approverFilter),
    [approvals, approverFilter]
  )

  const stages = useMemo(
    () =>
      STATUS_TABS.map((entry) => ({
        key: entry.key,
        label: entry.label,
        count: filteredByApprover.filter((t) => entry.match(t.approvalStatus)).length,
      })),
    [filteredByApprover]
  )

  const visible = useMemo(() => {
    const activeTab = STATUS_TABS.find((e) => e.key === tab) || STATUS_TABS[0]
    return filteredByApprover.filter((t) => activeTab.match(t.approvalStatus))
  }, [filteredByApprover, tab])

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-9">

      <p className="mb-5 text-sm text-slate-500">
        The full approval pipeline across CenterOps &amp; Skilling.
      </p>

      {weConnectTicketsError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{weConnectTicketsError}</span>
        </div>
      )}

      {/* 2x2 cards + distribution panel, equal height */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">

        <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
          <StatCard label="Sent for Approval" value={stats.sent} icon={Send} iconBg="bg-teal-50" iconColor="text-teal-700" />
          <StatCard
            label="Pending Approval"
            value={stats.pending}
            hint={`Regional Head ${stats.pendingRegionalHead} · Program Head ${stats.pendingProgramHead}`}
            icon={Clock3}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Pending, by approver</p>

          <div className="mt-4 space-y-3">
            {[
              { label: 'Regional Head', value: stats.pendingRegionalHead },
              { label: 'Program Head', value: stats.pendingProgramHead },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-slate-600">{row.label}</span>
                  <span className="text-xs font-semibold text-slate-800">{row.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${(row.value / pendingMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold text-slate-900">Approval status</p>
            {distSlices.length > 0 ? (
              <DonutChart slices={distSlices} size={124} thickness={22} unitLabel="Requests" />
            ) : (
              <p className="text-xs text-slate-400">Nothing sent for approval yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Approval table */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">
            {visible.length} request{visible.length === 1 ? '' : 's'}
          </p>

          <div className="inline-flex rounded-xl border border-slate-200 p-1">
            {APPROVER_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setApproverFilter(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  approverFilter === option
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pt-1">
          <SupportStageTabs stages={stages} value={tab} onChange={setTab} />
        </div>

        <SupportTicketTable
          tickets={visible}
          columns={TABLE_COLUMNS}
          onOpen={(id) => navigate(`/support/tickets/${id}`)}
          emptyText="No approval requests in this view."
        />
      </div>

      <div className="h-8" />
    </div>
  )
}

export default SupportApprovals
