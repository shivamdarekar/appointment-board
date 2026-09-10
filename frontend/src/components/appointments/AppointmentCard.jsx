import StatusBadge from '../common/StatusBadge'
import { formatDate, formatTimeRange } from '../../utils/formatters'

const ACCENT = {
  scheduled: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-slate-300 dark:border-l-slate-600',
}

/**
 * AppointmentCard
 *
 * Action visibility by status:
 *   scheduled  → Edit | Complete | Cancel
 *   completed  → read-only indicator
 *   cancelled  → read-only indicator
 */
export default function AppointmentCard({ appointment, onEdit, onComplete, onCancel, isBusy }) {
  const { id, title, description, appointment_date, start_time, end_time, status } = appointment
  const isScheduled = status === 'scheduled'
  const isCancelled = status === 'cancelled'
  const isReadOnly  = !isScheduled
  const busy        = isBusy ? isBusy(id) : false

  return (
    <article
      className={[
        'relative flex flex-col',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'border-l-[3px]', ACCENT[status] ?? 'border-l-slate-300',
        'rounded-xl overflow-hidden',
        'shadow-sm hover:shadow-md hover:-translate-y-px',
        'transition-all duration-150',
        isReadOnly ? 'opacity-80' : '',
        busy ? 'pointer-events-none' : '',
      ].join(' ')}
      aria-label={`Appointment: ${title}`}
    >

      {/* Busy overlay */}
      {busy && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center z-10 rounded-xl">
          <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 px-5 pt-5 pb-4 space-y-3">

        {/* Title + badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={[
            'text-sm font-semibold leading-snug flex-1 min-w-0',
            isCancelled
              ? 'line-through text-slate-400 dark:text-slate-600'
              : 'text-slate-900 dark:text-white',
          ].join(' ')}>
            {title}
          </h3>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Date + time */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={appointment_date} className="font-medium text-slate-700 dark:text-slate-300">
              {formatDate(appointment_date)}
            </time>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <time dateTime={`${appointment_date}T${start_time}`} className="font-medium text-slate-700 dark:text-slate-300">
              {formatTimeRange(start_time, end_time)}
            </time>
          </span>
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-800 mx-5" />

      {/* Actions footer */}
      <div className="flex items-center gap-2 px-5 py-3">
        {isScheduled ? (
          <>
            {/* Edit — neutral */}
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              disabled={busy}
              aria-label={`Edit ${title}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit
            </button>

            {/* Complete — positive */}
            <button
              type="button"
              onClick={() => onComplete(appointment)}
              disabled={busy}
              aria-label={`Mark ${title} as completed`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Complete
            </button>

            {/* Cancel — destructive secondary */}
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              disabled={busy}
              aria-label={`Cancel appointment: ${title}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </>
        ) : (
          /* Historical record — no actions */
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 select-none">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Read-only
          </span>
        )}
      </div>

    </article>
  )
}
