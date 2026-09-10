import { FILTER_STATUS_OPTIONS } from '../../constants/appointments'

export default function AppointmentFilters({
  dateFilter,
  statusFilter,
  onDateChange,
  onStatusChange,
  onClear,
  totalCount,
  loading = false,
}) {
  const isFiltered = !!(dateFilter || statusFilter)

  const inputClass =
    'h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ' +
    'text-sm text-slate-900 dark:text-white px-3 ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow'

  return (
    <div className="sticky top-16 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Filter label */}
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
            Filter
          </span>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 flex-1">

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-date" className="sr-only">Filter by date</label>
              <input
                id="filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => onDateChange(e.target.value)}
                className={[
                  inputClass,
                  dateFilter ? 'border-indigo-400 ring-1 ring-indigo-200 dark:border-indigo-600 dark:ring-indigo-700/40' : '',
                ].join(' ')}
                aria-label="Filter by date"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-status" className="sr-only">Filter by status</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className={[
                  inputClass,
                  'pr-8 appearance-none cursor-pointer',
                  statusFilter ? 'border-indigo-400 ring-1 ring-indigo-200 dark:border-indigo-600 dark:ring-indigo-700/40' : '',
                ].join(' ')}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {FILTER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {isFiltered && (
              <div className="flex items-center gap-2">
                {dateFilter && (
                  <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-700/40">
                    {dateFilter}
                    <button
                      type="button"
                      onClick={() => onDateChange('')}
                      aria-label="Remove date filter"
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-700/40 capitalize">
                    {statusFilter}
                    <button
                      type="button"
                      onClick={() => onStatusChange('')}
                      aria-label="Remove status filter"
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-2 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

          </div>

          {/* Count */}
          <p
            className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0"
            aria-live="polite"
          >
            {loading ? (
              <>
                <svg className="w-3 h-3 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Loading…
              </>
            ) : (
              `${totalCount} result${totalCount !== 1 ? 's' : ''}`
            )}
          </p>

        </div>
      </div>
    </div>
  )
}
