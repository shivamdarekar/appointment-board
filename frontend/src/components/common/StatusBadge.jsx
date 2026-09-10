import { STATUS_LABELS } from '../../constants/appointments'

const CONFIG = {
  scheduled: {
    dot: 'bg-sky-500',
    pill: 'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  },
  completed: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  cancelled: {
    dot: 'bg-slate-400',
    pill: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
}

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status
  const cfg = CONFIG[status] ?? CONFIG.cancelled

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.pill}`} aria-label={`Status: ${label}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
