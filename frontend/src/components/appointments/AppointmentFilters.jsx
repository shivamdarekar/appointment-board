import { FILTER_STATUS_OPTIONS, STATUS_LABELS } from '../../constants/appointments'

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
  const inputClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/15'

  return (
    <section className="border-b border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950" aria-label="Appointment filters">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-48">
              <label htmlFor="filter-date" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Date</label>
              <input id="filter-date" type="date" value={dateFilter} onChange={(event) => onDateChange(event.target.value)} className={inputClass} aria-label="Filter by date" />
            </div>
            <div className="sm:w-44">
              <label htmlFor="filter-status" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</label>
              <select id="filter-status" value={statusFilter} onChange={(event) => onStatusChange(event.target.value)} className={inputClass} aria-label="Filter by status">
                {FILTER_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            {isFiltered && (
              <button type="button" onClick={onClear} className="h-10 self-end rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-slate-300">
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isFiltered && (
              <div className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:flex">
                <span>Showing:</span>
                {dateFilter && <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{dateFilter}</span>}
                {statusFilter && <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{STATUS_LABELS[statusFilter]}</span>}
              </div>
            )}
            <p className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
              {loading && <svg className="h-3.5 w-3.5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
              {loading ? 'Updating list…' : `${totalCount} appointment${totalCount === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
