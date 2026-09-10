import { useEffect } from 'react'

/**
 * ConfirmDialog
 *
 * Reusable accessible confirmation dialog built with Tailwind.
 * Supports a loading/confirming state so the confirm button can be disabled
 * while an async operation is in flight.
 *
 * Props:
 *   isOpen        — boolean
 *   title         — string
 *   message       — string | ReactNode
 *   confirmLabel  — string  (default "Confirm")
 *   cancelLabel   — string  (default "Go Back")
 *   onConfirm     — () => void
 *   onCancel      — () => void
 *   danger        — boolean  (styles confirm button as destructive, default false)
 *   confirming    — boolean  (disables both buttons + shows spinner, default false)
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Go Back',
  onConfirm,
  onCancel,
  danger      = false,
  confirming  = false,
}) {
  // Close on Escape (only when not mid-request)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape' && !confirming) onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onCancel, confirming])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const confirmBase = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const confirmColor = danger
    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500'
    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop — blocked during confirming */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={confirming ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">

        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
            {danger ? (
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white pt-1.5">
            {title}
          </h2>
        </div>

        <div id="confirm-dialog-desc" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {message}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className={`${confirmBase} ${confirmColor}`}
          >
            {confirming && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
