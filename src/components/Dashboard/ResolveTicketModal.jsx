import { useRef, useState } from 'react'
import { CheckCircle2, ImagePlus, X } from 'lucide-react'

import { useTickets } from '../../tickets/useTickets'
import { filesToAttachments } from '../../utils/attachments'
import { SUPPORT_ROLES } from '../../data/ticketWorkflow'

/*
 * <role's In Progress state> -> Resolve -> Resolved.
 * Resolution is mandatory - this is the only place a ticket is
 * marked Resolved. Screenshots are optional and saved as
 * resolutionAttachments on the ticket. `role` decides which
 * workflow transition table this applies (Champion, WeConnect
 * Support, or Skilling Support).
 *
 * Issue Type: not asked here. For the two support roles (never
 * Champion), TicketWorkflowActions.jsx already requires it to be
 * picked - in the box next to its Actions control - before this
 * modal can even open, and passes the chosen value in as `issueType`.
 * It's still checked again below as a safety net, and it still
 * ends up on the Ticket's own `resolution_issue_type` field
 * (separate from `issue_type`, which the raiser still sets and
 * which still drives auto-routing - unchanged).
 */

function ResolveTicketModal({ ticket, role, issueType, onClose }) {
  const { resolve } = useTickets()
  const requiresIssueType = SUPPORT_ROLES.includes(role)

  const [resolution, setResolution] = useState('')
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const newImages = filesToAttachments(event.target.files)

    if (newImages.length > 0) {
      setImages((previous) => [...previous, ...newImages])
    }

    event.target.value = ''
  }

  const removeImage = (id) => {
    setImages((previous) => previous.filter((image) => image.id !== id))
  }

  const handleConfirm = async () => {
    if (!resolution.trim()) {
      setError('A resolution is required before this ticket can be marked Resolved.')
      return
    }

    if (requiresIssueType && !issueType) {
      setError('Issue type is missing - close this and pick one next to Actions first.')
      return
    }

    setSubmitting(true)
    try {
      await resolve(ticket.id, resolution.trim(), images, role, issueType || undefined)
      onClose()
    } catch (err) {
      setError(err.message || 'This ticket could not be marked Resolved. Try again.')
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
              Resolve Ticket
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Resolution <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={resolution}
              onChange={(event) => {
                setResolution(event.target.value)
                setError('')
              }}
              placeholder="Describe how this issue was resolved..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
            />
            {error && (
              <p className="mt-2 text-xs text-rose-600">
                {error}
              </p>
            )}
          </div>

          {/* =============================================
              IMAGE ATTACHMENTS
          ============================================== */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Attach Images
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-500 transition hover:border-teal-400 hover:bg-teal-50/40 hover:text-teal-700"
            >
              <ImagePlus size={15} />
              Add screenshot
            </button>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="h-20 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white transition hover:bg-rose-600"
                      aria-label={`Remove ${image.name}`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
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
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            {submitting ? 'Saving…' : 'Mark Resolved'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ResolveTicketModal
