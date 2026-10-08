/*
 * ================================================================
 * SUPPORT STAGE TABS
 *
 * Horizontal status-tab navigation for the CenterOps Tickets,
 * Skilling Tickets and Approvals pages. Each caller passes a fixed
 * list of tabs ({ key, label, count }); selecting one filters the
 * list below - it never mutates anything.
 * ================================================================
 */

function SupportStageTabs({ stages, value, onChange }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 border-b border-slate-200">
        {stages.map((stage) => {
          const isActive = value === stage.key

          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onChange(stage.key)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-medium transition ${
                isActive
                  ? 'text-teal-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {stage.label}
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                  isActive
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {stage.count}
              </span>
              {isActive && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-teal-600" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SupportStageTabs
