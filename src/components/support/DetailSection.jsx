import { ChevronDown } from 'lucide-react'

/*
 * ================================================================
 * DETAIL SECTION + INFO FIELD
 *
 * The collapsible section card and the small label/value pair used
 * on both support ticket-detail pages (Skilling Support and
 * WeConnect Support), so the two stay visually identical.
 * ================================================================
 */

export function DetailSection({
  id,
  title,
  icon: Icon,
  count,
  openSection,
  setOpenSection,
  children,
}) {
  const isOpen = openSection === id

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? '' : id)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
              isOpen ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-400'
            }`}
          >
            <Icon size={16} />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">
            {title}
            {count != null && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {count}
              </span>
            )}
          </h2>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5">{children}</div>
      )}
    </section>
  )
}

export function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}
