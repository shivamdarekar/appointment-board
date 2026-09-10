import StatusBadge from '../common/StatusBadge'
import { formatDate, formatTimeRange } from '../../utils/formatters'

export default function AppointmentCard({ appointment, onEdit, onComplete, onCancel, isBusy }) {
  const { id, title, description, appointment_date, start_time, end_time, status } = appointment
  const isScheduled = status === 'scheduled'
  const isCancelled = status === 'cancelled'
  const busy = isBusy ? isBusy(id) : false

  return (
    <article
      role="listitem"
      aria-label={`Appointment: ${title}`}
      className={`relative grid gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)_8rem_17rem] lg:items-center lg:gap-5 ${busy ? 'pointer-events-none' : ''}`}
    >
      {busy && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/75 backdrop-blur-[1px] dark:bg-slate-950/75">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-sky-400 dark:text-slate-950">
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Updating
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 lg:block">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 lg:mb-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4.75 9.25h14.5M5.5 5.5h13A1.5 1.5 0 0120 7v11.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5V7a1.5 1.5 0 011.5-1.5z" />
          </svg>
        </div>
        <div>
          <time dateTime={appointment_date} className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(appointment_date)}</time>
          <time dateTime={`${appointment_date}T${start_time}`} className="mt-0.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{formatTimeRange(start_time, end_time)}</time>
        </div>
      </div>

      <div className="min-w-0 lg:py-1">
        <h3 className={`truncate text-sm font-semibold ${isCancelled ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-950 dark:text-white'}`}>{title}</h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p>
        ) : (
          <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">No additional details</p>
        )}
      </div>

      <div className="flex items-center lg:block">
        <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300 lg:sr-only">Status</span>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {isScheduled ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              disabled={busy}
              aria-label={`Edit ${title}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-300"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
              Edit
            </button>
            <button
              type="button"
              onClick={() => onComplete(appointment)}
              disabled={busy}
              aria-label={`Mark ${title} as completed`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-900"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Complete
            </button>
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              disabled={busy}
              aria-label={`Cancel appointment: ${title}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-950 dark:focus-visible:ring-rose-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            Finalised record
          </span>
        )}
      </div>
    </article>
  )
}
