import { useState, useEffect, forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import { format, parse, isValid } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'


// Convert YYYY-MM-DD string to Date object
function dateStrToDate(str) {
  if (!str) return null
  const d = parse(str, 'yyyy-MM-dd', new Date())
  return isValid(d) ? d : null
}


// Convert Date object to YYYY-MM-DD string
function dateToStr(d) {
  if (!d || !isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}


// Convert HH:MM string to Date object
function timeStrToDate(str) {
  if (!str) return null
  const hhmm = str.slice(0, 5)
  const d = parse(hhmm, 'HH:mm', new Date())
  return isValid(d) ? d : null
}


// Convert Date object to HH:MM:SS for backend
function dateToTimeStorage(d) {
  if (!d || !isValid(d)) return ''
  return format(d, 'HH:mm:ss')
}


// Convert Date object to HH:MM for comparison
function dateToHHMM(d) {
  if (!d || !isValid(d)) return ''
  return format(d, 'HH:mm')
}


// Validate appointment form fields
function validate(fields) {
  const errors = {}
  if (!fields.title.trim())          errors.title            = 'Title is required.'
  if (!fields.appointment_date)      errors.appointment_date = 'Please select a date.'
  if (!fields.start_time)            errors.start_time       = 'Start time is required.'
  if (!fields.end_time) {
    errors.end_time = 'End time is required.'
  } else if (fields.start_time && fields.end_time <= fields.start_time) {
    errors.end_time = 'End time must be later than start time.'
  }
  return errors
}


function FieldError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-300">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  )
}

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-rose-500" aria-hidden="true"> *</span>}
    </label>
  )
}

const INPUT_BASE =
  'w-full rounded-lg border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white ' +
  'px-3 py-2.5 transition-shadow duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const INPUT_NORMAL = `${INPUT_BASE} border-slate-300 dark:border-slate-600`
const INPUT_ERROR  = `${INPUT_BASE} border-rose-400 dark:border-rose-500 focus:ring-rose-500 focus:border-rose-500`

function inputClass(hasError) {
  return hasError ? INPUT_ERROR : INPUT_NORMAL
}


const DateInput = forwardRef(function DateInput({ value, onClick, placeholder, disabled, hasError, id }, ref) {
  return (
    <div className="relative">
      <input
        id={id}
        ref={ref}
        readOnly
        value={value}
        onClick={onClick}
        placeholder={placeholder ?? 'Select date'}
        disabled={disabled}
        className={`${inputClass(hasError)} cursor-pointer pr-10`}
      />
      <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${hasError ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
    </div>
  )
})

const TimeInput = forwardRef(function TimeInput({ value, onClick, placeholder, disabled, hasError, id }, ref) {
  return (
    <div className="relative">
      <input
        id={id}
        ref={ref}
        readOnly
        value={value}
        onClick={onClick}
        placeholder={placeholder ?? 'Select time'}
        disabled={disabled}
        className={`${inputClass(hasError)} cursor-pointer pr-10`}
      />
      <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${hasError ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </span>
    </div>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function AppointmentForm({ mode = 'create', initialValues = null, onSubmit, onCancel }) {
  const isEdit = mode === 'edit'

  // Store dates as Date objects for the pickers; strings for validation/submission
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [dateValue, setDateValue]     = useState(null)   // Date | null
  const [startValue, setStartValue]   = useState(null)   // Date | null
  const [endValue, setEndValue]       = useState(null)   // Date | null

  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError]       = useState('')
  const [touched, setTouched]         = useState({})
  const [submitting, setSubmitting]   = useState(false)

  // ── Populate fields ────────────────────────────────────────────────────────

  function populateFromValues(values) {
    setTitle(values?.title ?? '')
    setDescription(values?.description ?? '')
    setDateValue(dateStrToDate(values?.appointment_date))
    setStartValue(timeStrToDate(values?.start_time))
    setEndValue(timeStrToDate(values?.end_time))
    setFieldErrors({})
    setApiError('')
    setTouched({})
    setSubmitting(false)
  }

  useEffect(() => {
    populateFromValues(isEdit ? initialValues : null)
  }, [initialValues?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived field strings (for validation) ────────────────────────────────

  const appointment_date = dateToStr(dateValue)
  const start_time       = dateToHHMM(startValue)
  const end_time         = dateToHHMM(endValue)

  // ── Field change handlers ─────────────────────────────────────────────────

  function onDateChange(d) {
    setDateValue(d)
    setApiError('')
    if (touched.appointment_date) {
      const errs = validate({ title, appointment_date: dateToStr(d), start_time, end_time })
      setFieldErrors(prev => ({ ...prev, appointment_date: errs.appointment_date ?? undefined }))
    }
  }

  function onStartChange(d) {
    setStartValue(d)
    setApiError('')
    if (touched.start_time || touched.end_time) {
      const errs = validate({ title, appointment_date, start_time: dateToHHMM(d), end_time })
      setFieldErrors(prev => ({ ...prev, start_time: errs.start_time ?? undefined, end_time: errs.end_time ?? undefined }))
    }
  }

  function onEndChange(d) {
    setEndValue(d)
    setApiError('')
    if (touched.end_time) {
      const errs = validate({ title, appointment_date, start_time, end_time: dateToHHMM(d) })
      setFieldErrors(prev => ({ ...prev, end_time: errs.end_time ?? undefined }))
    }
  }

  function onTitleChange(e) {
    setTitle(e.target.value)
    setApiError('')
    if (touched.title) {
      const errs = validate({ title: e.target.value, appointment_date, start_time, end_time })
      setFieldErrors(prev => ({ ...prev, title: errs.title ?? undefined }))
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()

    const allTouched = { title: true, appointment_date: true, start_time: true, end_time: true }
    setTouched(allTouched)

    const currentFields = { title, appointment_date, start_time, end_time }
    const validationErrors = validate(currentFields)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    if (submitting) return
    setSubmitting(true)
    setApiError('')

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      appointment_date,
      start_time: dateToTimeStorage(startValue),
      end_time: dateToTimeStorage(endValue),
    }

    try {
      const result = await onSubmit(data)
      if (result && !result.ok) {
        setApiError(result.error ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean)
  const submitLabel    = isEdit ? 'Save Changes' : 'Create Appointment'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit appointment' : 'Add appointment'}>
      <div className="space-y-5">

        {/* API error banner */}
        {apiError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-300 bg-rose-50 p-3.5 text-rose-900 shadow-sm dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-100">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm leading-snug">{apiError}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <FieldLabel htmlFor="appt-title" required>Title</FieldLabel>
          <input
            id="appt-title"
            type="text"
            value={title}
            onChange={onTitleChange}
            onBlur={() => setTouched(p => ({ ...p, title: true }))}
            placeholder="e.g. Product strategy review"
            maxLength={200}
            autoFocus
            disabled={submitting}
            className={inputClass(!!fieldErrors.title)}
            aria-invalid={!!fieldErrors.title}
          />
          <FieldError message={fieldErrors.title} />
        </div>

        {/* Description */}
        <div>
          <FieldLabel htmlFor="appt-description">Description</FieldLabel>
          <textarea
            id="appt-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional — add any relevant details"
            rows={3}
            maxLength={1000}
            disabled={submitting}
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        {/* Date picker */}
        <div>
          <FieldLabel htmlFor="appt-date" required>Date</FieldLabel>
          <DatePicker
            id="appt-date"
            selected={dateValue}
            onChange={onDateChange}
            onBlur={() => setTouched(p => ({ ...p, appointment_date: true }))}
            dateFormat="dd MMM yyyy"
            placeholderText="Select appointment date"
            disabled={submitting}
            customInput={
              <DateInput
                id="appt-date"
                hasError={!!fieldErrors.appointment_date}
                disabled={submitting}
              />
            }
            popperClassName="appt-datepicker-popper"
            calendarClassName="appt-datepicker-calendar"
            showPopperArrow={false}
            todayButton="Today"
          />
          <FieldError message={fieldErrors.appointment_date} />
        </div>

        {/* Start / End time pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Start time */}
          <div>
            <FieldLabel htmlFor="appt-start" required>Start Time</FieldLabel>
            <DatePicker
              id="appt-start"
              selected={startValue}
              onChange={onStartChange}
              onBlur={() => setTouched(p => ({ ...p, start_time: true }))}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Start"
              dateFormat="h:mm aa"
              placeholderText="Select start time"
              disabled={submitting}
              customInput={
                <TimeInput
                  id="appt-start"
                  hasError={!!fieldErrors.start_time}
                  disabled={submitting}
                />
              }
              popperClassName="appt-datepicker-popper"
              showPopperArrow={false}
            />
            <FieldError message={fieldErrors.start_time} />
          </div>

          {/* End time */}
          <div>
            <FieldLabel htmlFor="appt-end" required>End Time</FieldLabel>
            <DatePicker
              id="appt-end"
              selected={endValue}
              onChange={onEndChange}
              onBlur={() => setTouched(p => ({ ...p, end_time: true }))}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="End"
              dateFormat="h:mm aa"
              placeholderText="Select end time"
              disabled={submitting}
              customInput={
                <TimeInput
                  id="appt-end"
                  hasError={!!fieldErrors.end_time}
                  disabled={submitting}
                />
              }
              popperClassName="appt-datepicker-popper"
              showPopperArrow={false}
            />
            <FieldError message={fieldErrors.end_time} />
          </div>

        </div>

        {/* Field summary hint */}
        {hasFieldErrors && Object.keys(touched).length > 0 && (
          <p className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
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
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-900"
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
