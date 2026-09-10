export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 text-rose-700 dark:text-rose-300"
    >
      <span className="text-base mt-0.5 shrink-0" aria-hidden="true">⚠️</span>
      <p className="flex-1 text-sm leading-relaxed font-medium">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-xl leading-none transition-colors"
        >
          ×
        </button>
      )}
    </div>
  )
}
