import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ShieldCheck, X } from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { getAdminTickets, decideProgramHeadApproval, decideRegionalHeadApproval } from '../../admin/data/mockTickets'
import { useRegionScope } from '../../admin/data/regionScope'
import { useApprovalDecisions } from '../../admin/data/approvalDecisions'
import { fmtHours } from '../../admin/data/analytics'
import AdminPageHeader from '../../admin/components/AdminPageHeader'
import Panel from '../../admin/components/Panel'
import { statusStyles } from '../../utils/ticketStyles'
import { stageLabel } from '../../data/supportStages'

const subjectFor = (t) => t.subject || `${t.subModule} · ${t.issueTheme}`

function dateTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(+d)) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700">{value ?? '—'}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const style =
    status === 'Approved'
      ? 'bg-emerald-50 text-emerald-600'
      : status === 'Rejected'
        ? 'bg-rose-50 text-rose-600'
        : 'bg-amber-50 text-amber-600'
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}>{status}</span>
}

function AdminTicketDetails() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { isProgramHead } = useAuth()
  const scope = useRegionScope()
  const decisions = useApprovalDecisions()

  const ticket = useMemo(() => getAdminTickets().find((t) => t.id === ticketId), [ticketId])
  const [remarks, setRemarks] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [decisionError, setDecisionError] = useState('')

  // A Regional Head may only open tickets inside their region(s).
  const outOfScope = ticket && scope.isRegionHead && !scope.regions.includes(ticket.region)

  if (!ticket || outOfScope) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-5 py-6 sm:px-7 lg:px-9">
        <AdminPageHeader title={outOfScope ? 'Not available' : 'Ticket not found'} />
        {outOfScope && (
          <p className="mb-3 text-sm text-slate-500">This ticket is outside your assigned region.</p>
        )}
        <Link to="/admin/approvals" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to Approvals
        </Link>
      </div>
    )
  }

  const decision = decisions[ticket.id] || null
  const approval = ticket.approval
  const approvalStatus = decision?.status || approval?.status
  // Program Head decides any pending request; a Regional Head only
  // the "Regional Head" requests in their region.
  const roleCanDecide = isProgramHead || (scope.isRegionHead && approval?.type === 'Regional Head')
  const canDecide = roleCanDecide && approval && approvalStatus === 'Pending'
  const style = statusStyles[ticket.status] || statusStyles.Open

  // Both real Frappe workflow decisions now - Program Head via
  // weconnect_ticketing.api.decide_program_head_approval, Regional
  // Head via the exact mirror decide_regional_head_approval. Neither
  // path uses the old session-only decision store anymore - a
  // decision is written to the real Ticket / Ticket Approval records
  // either way, so it survives a refresh and is what the
  // notification system reads from.
  const decide = async (status) => {
    if (status === 'Rejected' && !remarks.trim()) {
      setTouched(true)
      return
    }

    setDecisionError('')
    setSubmitting(true)
    try {
      if (isProgramHead) {
        await decideProgramHeadApproval(ticket.id, status, remarks.trim())
      } else {
        await decideRegionalHeadApproval(ticket.id, status, remarks.trim())
      }
      navigate('/admin/approvals')
    } catch (err) {
      setDecisionError(err.message || 'This decision could not be recorded. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 sm:px-7 lg:px-9">
      <button
        type="button"
        onClick={() => navigate('/admin/approvals')}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-teal-700"
      >
        <ArrowLeft size={14} /> Back to Approvals
      </button>

      <AdminPageHeader title={`Ticket ${ticket.id}`} question={subjectFor(ticket)} />

      {/* The issue exactly as the user / Champion raised it */}
      <Panel title="Reported Issue" subtitle="Raised by the user — full context for this request">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          <Field label="Raised By" value={ticket.raisedBy} />
          <Field label="Raised On" value={dateTime(ticket.createdAt)} />
          <Field label="Priority" value={ticket.priority} />
          <Field
            label="Ticket Status"
            value={
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.background} ${style.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {stageLabel(ticket.status)}
              </span>
            }
          />
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">{subjectFor(ticket)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{ticket.description}</p>
        </div>
      </Panel>

      <Panel title="Ticket Details" className="mt-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <Field label="Module" value={ticket.module} />
          <Field label="Sub-module" value={ticket.subModule} />
          <Field label="Issue Theme" value={ticket.issueTheme} />
          <Field label="Region" value={ticket.region} />
          <Field label="Center" value={ticket.center} />
          <Field label="Support Team" value={ticket.supportTeam} />
          <Field label="First Response" value={ticket.firstResponseAt ? fmtHours(ticket.timeToFirstResponse) : 'Not yet'} />
          <Field label="Resolution Time" value={ticket.resolvedAt ? fmtHours(ticket.timeToResolution) : 'Open'} />
          <Field label="Reopened" value={ticket.reopened ? `${ticket.reopened}×` : 'No'} />
        </div>
      </Panel>

      {approval && (
        <Panel title="Approval Request" className="mt-6 border-teal-100" bodyClass="mt-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
            <Field label="Requested By" value={approval.requestedBy || ticket.supportTeam} />
            <Field label="Approval Type" value={approval.type} />
            <Field label="Requested On" value={dateTime(approval.requestedAt)} />
            <Field label="Current Status" value={<StatusPill status={approvalStatus} />} />
            {approval.decidedAt && !decision && (
              <Field label="Decided On" value={dateTime(approval.decidedAt)} />
            )}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Remarks from {approval.requestedBy || ticket.supportTeam}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{approval.note || '—'}</p>
          </div>

          {canDecide ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-teal-50/60 px-4 py-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-700" />
                <p className="text-xs leading-5 text-slate-500">
                  Review the request above, then record your decision. Remarks are required to reject.
                </p>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Your remarks
                <span className="ml-1 text-xs font-normal text-slate-400">(required to reject)</span>
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Add a note for the record…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
              />
              {touched && !remarks.trim() && (
                <p className="mt-1.5 text-xs text-slate-400">A remark is optional to approve, required to reject.</p>
              )}

              {decisionError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-600" />
                  <p className="text-xs text-rose-700">{decisionError}</p>
                </div>
              )}

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => decide('Rejected')}
                  disabled={!remarks.trim() || submitting}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={15} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => decide('Approved')}
                  disabled={submitting}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={15} /> {submitting ? 'Saving…' : 'Approve'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 border-t border-slate-100 pt-4">
              {decision ? (
                <>
                  <p className="text-xs text-slate-500">
                    You <span className="font-semibold text-slate-700">{decision.status.toLowerCase()}</span> this request.
                  </p>
                  {decision.remarks && (
                    <div className="mt-2 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Your remarks</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{decision.remarks}</p>
                    </div>
                  )}
                </>
              ) : approvalStatus === 'Pending' ? (
                <p className="text-xs text-slate-500">
                  This request is pending. Approval actions are available to the Program Head.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  This request has been{' '}
                  <span className="font-semibold text-slate-700">{String(approvalStatus).toLowerCase()}</span>.
                </p>
              )}
            </div>
          )}
        </Panel>
      )}

      <div className="h-8" />
    </div>
  )
}

export default AdminTicketDetails
