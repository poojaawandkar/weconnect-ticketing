import { useState } from 'react'
import { AlertTriangle, Send, ShieldCheck, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'

/*
 * The two real values of the Ticket.approval_type Select field -
 * not a lookup of any kind, just the valid choices themselves (see
 * weconnect_ticketing.api.submit_weconnect_ticket_for_approval,
 * which validates against this same real backend Select field).
 */
const APPROVER_TYPES = [
  { key: 'Regional Head', label: 'Regional Head' },
  { key: 'Program Head', label: 'Program Head' },
]

/*
 * ================================================================
 * REQUEST APPROVAL MODAL
 *
 * WeConnect Support only. Submits the real Frappe "Submit for
 * Approval" transition (WeConnect Support In Progress -> Pending
 * Approval) via useTickets().requestApproval(), sending only
 * approvalType (+ an optional note, stored as Approval Comments).
 *
 * The actual approver is resolved server-side by the existing
 * "Ticket Approval Creation" Server Script - not by this frontend,
 * so there is no directory of names to look up or preview here
 * anymore:
 *   - Regional Head : resolved from the ticket's region by the
 *                     backend's own "Regional Head" records.
 *   - Program Head  : NOT resolved anywhere in the backend yet - the
 *                     transition still goes through, but no approver
 *                     is notified until that routing is built.
 * ================================================================
 */

function RequestApprovalModal({ ticket, onClose, approverType: presetApproverType }) {
  const { requestApproval } = useTickets()

  const [approverType, setApproverType] = useState(presetApproverType || 'Regional Head')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await requestApproval(ticket.id, {
        approverType,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'This request could not be submitted. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {ticket.id}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-slate-900">
              Submit for Approval
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Issue
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {ticket.issue}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {ticket.module} · {ticket.subModule} · {ticket.region} · {ticket.center}
            </p>
          </div>

          {presetApproverType ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-teal-700">
                Requesting approval from
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {approverType}
              </p>
            </div>
          ) : (
          <div>
            <p className="mb-2 block text-sm font-medium text-slate-700">
              Request approval from
            </p>

            <div className="space-y-2">
              {APPROVER_TYPES.map((type) => {
                const isActive = approverType === type.key

                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setApproverType(type.key)
                      setError('')
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-teal-300 bg-teal-50/60'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        isActive
                          ? 'border-teal-600 bg-teal-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">
                        {type.label}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          )}

          {approverType === 'Regional Head' ? (
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-700" />
              <p className="text-xs leading-5 text-slate-500">
                The Regional Head mapped to{' '}
                <span className="font-medium text-slate-600">{ticket.region || 'this region'}</span>{' '}
                in Frappe will be notified once submitted.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-5 text-amber-800">
                Your request will be routed to the configured Program Head for approval.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Note for approver
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for the approval request..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-700" />
            <p className="text-xs leading-5 text-slate-500">
              This moves the ticket to{' '}
              <span className="font-medium text-slate-600">Pending Approval</span>{' '}
              using the existing ticket workflow.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600">
              {error}
            </p>
          )}

        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={15} />
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default RequestApprovalModal

