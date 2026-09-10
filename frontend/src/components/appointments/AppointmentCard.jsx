import StatusBadge from '../common/StatusBadge'
import { formatDate, formatTimeRange } from '../../utils/formatters'

const ACCENT = {
  scheduled: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-rose-400',
}

export default function AppointmentCard({ appointment, onEdit, onComplete, onCancel }) {
  const { title, description, appointment_date, start_time, end_time, status } = appointment
  const isScheduled = status === 'scheduled'
  const isCancelled = status === 'cancelled'

  return (
    <article
      className={`
        group relative bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        border-l-4 ${ACCENT[status] ?? 'border-l-slate-400'}
        rounded-xl overflow-hidden
        shadow-sm hover:shadow-md
        transition-all duration-200 hover:-translate-y-0.5
        flex flex-col
        ${isCancelled ? 'opacity-70' : ''}
      `}
      aria-label={`Appointment: ${title}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold leading-snug truncate ${isCancelled ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pb-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Date */}
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <time dateTime={appointment_date} className="font-medium text-slate-600 dark:text-slate-300">
            {formatDate(appointment_date)}
          </time>
        </span>

        {/* Time */}
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          <time dateTime={`${appointment_date}T${start_time}`} className="font-medium text-slate-600 dark:text-slate-300">
            {formatTimeRange(start_time, end_time)}
          </time>
        </span>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50/60 dark:bg-slate-800/40">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          aria-label={`Edit ${title}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Edit
        </button>

        {isScheduled && (
          <>
            <button
              type="button"
              onClick={() => onComplete(appointment.id)}
              aria-label={`Complete ${title}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Complete
            </button>

            <button
              type="button"
              onClick={() => onCancel(appointment.id)}
              aria-label={`Cancel ${title}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </>
        )}
      </div>
    </article>
  )
}
