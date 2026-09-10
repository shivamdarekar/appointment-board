/**
 * Pagination
 *
 * Professional pagination control: previous, numbered pages, next.
 * Shows up to 7 page buttons; collapses to ellipsis for large page counts.
 *
 * Props:
 *   page        — current page (1-based)
 *   totalPages  — total number of pages
 *   total       — total record count (for display)
 *   pageSize    — records per page (for display)
 *   onPrev      — () => void
 *   onNext      — () => void
 *   onPage      — (page: number) => void
 *   loading     — boolean (disables controls while fetching)
 */
export default function Pagination({ page, totalPages, total, pageSize, onPrev, onNext, onPage, loading = false }) {
  if (totalPages <= 1 && total === 0) return null

  const isFirst = page <= 1
  const isLast  = page >= totalPages
  const disabled = loading

  // Build the page number list with ellipsis compression
  const pages = buildPageList(page, totalPages)

  // Range display: "1–10 of 37"
  const rangeStart = Math.min((page - 1) * pageSize + 1, total)
  const rangeEnd   = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">

      {/* Range label */}
      <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {total === 0 ? 'No results' : (
          <>
            <span className="font-medium text-slate-700 dark:text-slate-300">{rangeStart}–{rangeEnd}</span>
            {' of '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
            {total === 1 ? ' appointment' : ' appointments'}
          </>
        )}
      </p>

      {/* Controls */}
      <nav aria-label="Pagination" className="flex items-center gap-1">

        {/* Previous */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst || disabled}
          aria-label="Previous page"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                disabled={disabled}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed ${
                  p === page
                    ? 'bg-slate-950 text-white shadow-sm shadow-slate-300'
                    : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={onNext}
          disabled={isLast || disabled}
          aria-label="Next page"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

      </nav>
    </div>
  )
}

/**
 * Build the list of page numbers to show, with '…' where pages are collapsed.
 * Always shows: first, last, current ±1, and fills to a max of 7 slots.
 */
function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set([1, total, current])
  if (current > 1) pages.add(current - 1)
  if (current < total) pages.add(current + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const result = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }

  return result
}
