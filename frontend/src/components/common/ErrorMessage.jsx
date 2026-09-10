export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-100"
    >
      <span className="text-base mt-0.5 shrink-0" aria-hidden="true">⚠️</span>
      <p className="flex-1 text-sm leading-relaxed font-medium">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-rose-600 transition-colors hover:text-rose-900 text-xl leading-none dark:text-rose-300 dark:hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}
