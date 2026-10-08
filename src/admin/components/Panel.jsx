/*
 * Section card for the Admin workspace - same surface as the rest
 * of the app (rounded-2xl, border-slate-200, subtle shadow) with a
 * consistent title / subtitle / optional action header.
 */
function Panel({ title, subtitle, action, icon: Icon, children, className = '', bodyClass = 'mt-5' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-slate-300" />}
            <div>
              {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
              {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={title || action ? bodyClass : ''}>{children}</div>
    </section>
  )
}

export default Panel
