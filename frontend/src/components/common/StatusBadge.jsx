import { STATUS_LABELS } from '../../constants/appointments'

// Pulse only for scheduled (actively upcoming). Completed and cancelled are
// historical — they should not blink as if they are live.
const CONFIG = {
  scheduled: {
    dot:  'bg-blue-500 animate-pulse',
    pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:ring-blue-700/40',
  },
  completed: {
    dot:  'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-700/40',
  },
  cancelled: {
    dot:  'bg-slate-400',
    pill: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  },
}

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status
  const cfg   = CONFIG[status] ?? {
    dot:  'bg-slate-400',
    pill: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.pill}`}
      aria-label={`Status: ${label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
