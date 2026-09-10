export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" role="status">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 shadow-inner">
        <span className="text-4xl" aria-hidden="true">🗓️</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
