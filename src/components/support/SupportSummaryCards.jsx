/*
 * ================================================================
 * SUPPORT SUMMARY CARDS
 *
 * The compact summary cards used at the top of the Support
 * dashboards and the Approvals page. Same visual treatment as the
 * rest of the app's dashboards (white card, subtle border,
 * rounded-2xl, soft decorative circle, icon chip).
 * ================================================================
 */

function SupportSummaryCards({ cards, columnsClassName = 'sm:grid-cols-3 xl:grid-cols-6' }) {
  return (
    <section className={`grid grid-cols-2 gap-4 ${columnsClassName}`}>
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-110" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                </div>
                {Icon && (
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon size={19} />
                  </div>
                )}
              </div>

              {card.hint && (
                <p className="mt-4 text-[10px] text-slate-400">
                  {card.hint}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default SupportSummaryCards
