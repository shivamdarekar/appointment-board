const CONFIG = {
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/50',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-rose-400',
    pill: 'bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-700/50',
  },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
