import { useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'

/*
 * WeConnect Support In Progress -> Need L2 -> Sent to L2, or
 * Skilling Support In Progress -> Need L2 -> Sent to L2 (same modal,
 * `role` decides which real Frappe transition fires - see
 * TicketsProvider.escalateToL2()).
 *
 * An escalation, not a hand-off: the ticket stays owned by the same
 * team (support_team is untouched) while the external L2 system
 * works it - see the note on ROLE_TRANSITIONS[...].NEED_L2 in
 * ticketWorkflow.js. Small modal, never a page, same shell as
 * ForwardToWeConnectModal.
 */

function EscalateToL2Modal({ ticket, role, onClose }) {
  const { escalateToL2 } = useTickets()

  const [l2TicketNumber, setL2TicketNumber] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!l2TicketNumber.trim()) {
      setError('Enter the L2 ticket number before sending this ticket to L2.')
      return
    }

    setSubmitting(true)
    try {
      await escalateToL2(ticket.id, l2TicketNumber.trim(), role)
      onClose()
    } catch (err) {
      setError(err.message || 'This ticket could not be sent to L2. Try again.')
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {ticket.id}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-slate-900">
              Send to L2
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

          <p className="text-xs leading-relaxed text-slate-500">
            This ticket will be sent to L2 support. It stays in your
            queue as "Sent to L2" until you mark it resolved by L2.
          </p>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Issue
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {ticket.issue}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              L2 Ticket Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={l2TicketNumber}
              onChange={(event) => {
                setL2TicketNumber(event.target.value)
                setError('')
              }}
              placeholder="e.g. L2-10234"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
            {error && (
              <p className="mt-2 text-xs text-rose-600">
                {error}
              </p>
            )}
          </div>

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
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowUpRight size={16} />
            {submitting ? 'Sending…' : 'Send to L2'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default EscalateToL2Modal
