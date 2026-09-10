import { useState, useEffect } from 'react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMPTY_FIELDS = {
  title: '',
  description: '',
  appointment_date: '',
  start_time: '',
  end_time: '',
}

/**
 * Backend stores times as HH:MM:SS.
 * HTML <input type="time"> works with HH:MM.
 * Strip the seconds suffix when pre-filling.
 */
function toTimeInput(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // "09:00:00" → "09:00"
}

/**
 * Produce HH:MM:SS from HH:MM for storage consistency with the backend shape.
 */
function toTimeStorage(timeStr) {
  if (!timeStr) return ''
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr
}

/**
 * Returns true when end is strictly after start (both HH:MM strings).
 */
function isEndAfterStart(start, end) {
  if (!start || !end) return true // skip — caught by required checks
  return end > start
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validate(fields) {
  const errors = {}

  if (!fields.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!fields.appointment_date) {
    errors.appointment_date = 'Please select a date.'
  }

  if (!fields.start_time) {
    errors.start_time = 'Start time is required.'
  }

  if (!fields.end_time) {
    errors.end_time = 'End time is required.'
  } else if (fields.start_time && !isEndAfterStart(fields.start_time, fields.end_time)) {
    errors.end_time = 'End time must be later than start time.'
  }

  return errors
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  )
}

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-rose-500" aria-hidden="true"> *</span>}
    </label>
  )
}

const INPUT_BASE =
  'w-full rounded-lg border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white ' +
  'px-3 py-2.5 transition-shadow duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const INPUT_NORMAL = `${INPUT_BASE} border-slate-300 dark:border-slate-600`
const INPUT_ERROR  = `${INPUT_BASE} border-rose-400 dark:border-rose-500 focus:ring-rose-500 focus:border-rose-500`

function inputClass(hasError) {
  return hasError ? INPUT_ERROR : INPUT_NORMAL
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * AppointmentForm
 *
 * Props:
 *   mode         — 'create' | 'edit'
 *   initialValues — appointment object (required when mode = 'edit')
 *   onSubmit(data) — called with the validated appointment data
 *   onCancel()    — called when the user cancels
 */
export default function AppointmentForm({ mode = 'create', initialValues = null, onSubmit, onCancel }) {
  const isEdit = mode === 'edit'

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fields, setFields] = useState(() => {
    if (isEdit && initialValues) {
      return {
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
        appointment_date: initialValues.appointment_date ?? '',
        start_time: toTimeInput(initialValues.start_time),
        end_time: toTimeInput(initialValues.end_time),
      }
    }
    return EMPTY_FIELDS
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Re-populate when switching between different appointments to edit
  useEffect(() => {
    if (isEdit && initialValues) {
      setFields({
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
        appointment_date: initialValues.appointment_date ?? '',
        start_time: toTimeInput(initialValues.start_time),
        end_time: toTimeInput(initialValues.end_time),
      })
      setErrors({})
      setTouched({})
      setSubmitting(false)
    }
  }, [initialValues?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))

    // Re-validate the changed field once it has been touched
    if (touched[name]) {
      const next = { ...fields, [name]: value }
      const nextErrors = validate(next)
      setErrors((prev) => ({
        ...prev,
        [name]: nextErrors[name] ?? undefined,
        // Also re-evaluate end_time when start_time changes (and vice-versa)
        ...(name === 'start_time' ? { end_time: nextErrors.end_time ?? undefined } : {}),
      }))
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const nextErrors = validate(fields)
    setErrors((prev) => ({ ...prev, [name]: nextErrors[name] ?? undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Mark all fields touched so errors show
    setTouched({ title: true, appointment_date: true, start_time: true, end_time: true })

    const validationErrors = validate(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (submitting) return // prevent duplicate submission
    setSubmitting(true)

    const data = {
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      appointment_date: fields.appointment_date,
      start_time: toTimeStorage(fields.start_time),
      end_time: toTimeStorage(fields.end_time),
    }

    onSubmit(data)
    // Parent is responsible for closing modal. Reset submitting if parent keeps
    // modal open (e.g. on API error in a future phase).
    setSubmitting(false)
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasErrors = Object.values(errors).some(Boolean)
  const submitLabel = isEdit ? 'Save Changes' : 'Create Appointment'
  const submitDisabled = submitting

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit appointment' : 'Add appointment'}>
      <div className="space-y-5">

        {/* Title */}
        <div>
          <FieldLabel htmlFor="appt-title" required>Title</FieldLabel>
          <input
            id="appt-title"
            name="title"
            type="text"
            value={fields.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Product strategy review"
            maxLength={200}
            autoFocus
            disabled={submitting}
            className={inputClass(!!errors.title)}
            aria-describedby={errors.title ? 'appt-title-error' : undefined}
            aria-invalid={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        {/* Description */}
        <div>
          <FieldLabel htmlFor="appt-description">Description</FieldLabel>
          <textarea
            id="appt-description"
            name="description"
            value={fields.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Optional — add any relevant details"
            rows={3}
            maxLength={1000}
            disabled={submitting}
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        {/* Date */}
        <div>
          <FieldLabel htmlFor="appt-date" required>Date</FieldLabel>
          <input
            id="appt-date"
            name="appointment_date"
            type="date"
            value={fields.appointment_date}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={submitting}
            className={inputClass(!!errors.appointment_date)}
            aria-describedby={errors.appointment_date ? 'appt-date-error' : undefined}
            aria-invalid={!!errors.appointment_date}
          />
          <FieldError message={errors.appointment_date} />
        </div>

        {/* Start / End time — side by side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Start time */}
          <div>
            <FieldLabel htmlFor="appt-start" required>Start Time</FieldLabel>
            <input
              id="appt-start"
              name="start_time"
              type="time"
              value={fields.start_time}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={inputClass(!!errors.start_time)}
              aria-describedby={errors.start_time ? 'appt-start-error' : undefined}
              aria-invalid={!!errors.start_time}
            />
            <FieldError message={errors.start_time} />
          </div>

          {/* End time */}
          <div>
            <FieldLabel htmlFor="appt-end" required>End Time</FieldLabel>
            <input
              id="appt-end"
              name="end_time"
              type="time"
              value={fields.end_time}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              className={inputClass(!!errors.end_time)}
              aria-describedby={errors.end_time ? 'appt-end-error' : undefined}
              aria-invalid={!!errors.end_time}
            />
            <FieldError message={errors.end_time} />
          </div>

        </div>

        {/* Summary error hint (shown only if submit attempted + errors remain) */}
        {hasErrors && Object.keys(touched).length > 0 && (
          <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Please fix the errors above before submitting.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : submitLabel}
          </button>
        </div>

      </div>
    </form>
  )
}
