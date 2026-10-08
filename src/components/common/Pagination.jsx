import { ChevronLeft, ChevronRight } from 'lucide-react'

/*
 * ================================================================
 * PAGINATION BAR
 *
 * The shared Prev / Next control, rendered under any paginated
 * list. Hidden when everything fits on one page. Pair it with
 * usePagination() - spread its return value straight in.
 * ================================================================
 */

function Pagination({ page, pageCount, from, to, total, prev, next }) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-[11px] text-slate-400">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={prev}
          disabled={page === 0}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        <span className="min-w-[54px] text-center text-[11px] font-medium text-slate-500">
          {page + 1} / {pageCount}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={page >= pageCount - 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
