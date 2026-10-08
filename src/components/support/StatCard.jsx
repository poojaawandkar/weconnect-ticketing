/*
 * ================================================================
 * STAT CARD
 *
 * One summary metric - same visual treatment as SupportSummaryCards
 * (white card, subtle border, rounded-2xl, soft decorative circle,
 * icon chip, 3xl number), but built to fill its grid cell (h-full)
 * so a grid of these can be matched to the height of a chart card
 * beside it. Used on the WeConnect Support dashboard and the
 * Approvals page.
 * ================================================================
 */

function StatCard({ label, value, hint, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
            <Icon size={19} />
          </div>
        )}
      </div>

      {hint && <p className="relative mt-auto pt-4 text-[10px] text-slate-400">{hint}</p>}
    </div>
  )
}

export default StatCard
