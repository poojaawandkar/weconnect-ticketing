import { useState } from 'react'
import { ArrowRight, Forward, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'

/*
 * Skilling Support In Progress -> Forward to WeConnect Support ->
 * WeConnect Support In Progress.
 *
 * A hand-off, not an escalation ladder: the ticket leaves the
 * Skilling queue and lands in WeConnect Support's normal In Progress
 * state (TicketsProvider.forwardToWeConnect also re-routes
 * ticket.supportTeam). The short reason is saved on the ticket so
 * WeConnect Support has the context. Small modal, never a page.
 */

function ForwardToWeConnectModal({ ticket, onClose }) {
  const { forwardToWeConnect } = useTickets()

  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Add a short note so WeConnect Support knows why this is coming to them.')
      return
    }

    setSubmitting(true)
    try {
      await forwardToWeConnect(ticket.id, reason.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'This ticket could not be forwarded. Try again.')
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
              Forward to WeConnect Support
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

          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
            <span className="text-xs font-semibold text-slate-600">Skilling Support</span>
            <ArrowRight size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-slate-600">WeConnect Support</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            This ticket will be handed over to WeConnect Support and will
            no longer appear in your Skilling queue.
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
              Reason / comment <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setError('')
              }}
              placeholder="What have you already tried, and why does this need WeConnect Support?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
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
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Forward size={16} />
            {submitting ? 'Forwarding…' : 'Forward Ticket'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ForwardToWeConnectModal
