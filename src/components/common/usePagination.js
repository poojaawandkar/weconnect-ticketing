import { useMemo, useState } from 'react'

/*
 * ================================================================
 * usePagination
 *
 * Project-wide list pagination - a fixed page size (5 by default)
 * with Prev / Next navigation. Every ticket table and dashboard
 * queue runs through this so paging behaves the same everywhere.
 *
 *   const p = usePagination(rows)      // rows already filtered
 *   p.pageItems                         // the <= 5 rows to render
 *   <Pagination {...p} />               // the nav bar
 *
 * The current page is clamped in render, so shrinking the list
 * (switching to a smaller tab, applying a filter) never leaves the
 * view stranded on an empty page - no effect required.
 * ================================================================
 */

export function usePagination(items, pageSize = 5) {
  const [page, setPage] = useState(0)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(page, 0), pageCount - 1)

  const pageItems = useMemo(
    () => items.slice(current * pageSize, current * pageSize + pageSize),
    [items, current, pageSize]
  )

  return {
    page: current,
    pageCount,
    pageItems,
    pageSize,
    total,
    from: total === 0 ? 0 : current * pageSize + 1,
    to: Math.min(current * pageSize + pageSize, total),
    setPage: (next) => setPage(Math.min(Math.max(next, 0), pageCount - 1)),
    prev: () => setPage(Math.max(current - 1, 0)),
    next: () => setPage(Math.min(current + 1, pageCount - 1)),
  }
}
