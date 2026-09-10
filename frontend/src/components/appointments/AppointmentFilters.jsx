import { FILTER_STATUS_OPTIONS } from '../../constants/appointments'

export default function AppointmentFilters({ dateFilter, statusFilter, onDateChange, onStatusChange, onClear, totalCount, filteredCount }) {
  const isFiltered = dateFilter || statusFilter

  return (
    <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
            
            {/* Date filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-date" className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Date
              </label>
              <input
                id="filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => onDateChange(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-status" className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="h-9 pl-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem]"
              >
                {FILTER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Clear button */}
            {isFiltered && (
              <button
                type="button"
                onClick={onClear}
                className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          {/* Count */}
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap" aria-live="polite">
            {isFiltered
              ? `${filteredCount} of ${totalCount} appointment${totalCount !== 1 ? 's' : ''}`
              : `${totalCount} appointment${totalCount !== 1 ? 's' : ''}`}
          </p>

        </div>
      </div>
    </div>
  )
}
