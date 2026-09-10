import { useState, useEffect, useMemo } from 'react'
import AppointmentBoard from '../components/appointments/AppointmentBoard'
import AppointmentFilters from '../components/appointments/AppointmentFilters'
import AppointmentForm from '../components/appointments/AppointmentForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ErrorMessage from '../components/common/ErrorMessage'
import Modal from '../components/common/Modal'
import useAppointments from '../hooks/useAppointments'
import { STATUS } from '../constants/appointments'

// ─── Modal modes ──────────────────────────────────────────────────────────────
const MODAL_CLOSED = null
const MODAL_CREATE = 'create'
const MODAL_EDIT   = 'edit'

export default function AppointmentBoardPage({ openCreateSignal = 0 }) {
  const {
    appointments,
    loading,
    loadError,
    retry,
    dateFilter,
    statusFilter,
    handleDateChange,
    handleStatusChange,
    handleClearFilters,
    isBusy,
    handleCreate,
    handleUpdate,
    handleComplete,
    handleCancel,
  } = useAppointments()

  // ── Modal / form state ────────────────────────────────────────────────────
  const [modalMode, setModalMode]               = useState(MODAL_CLOSED)
  const [editingAppointment, setEditingAppointment] = useState(null)

  // ── Cancel confirmation dialog ────────────────────────────────────────────
  const [confirmTarget, setConfirmTarget] = useState(null) // appointment to cancel

  // ── Feedback banners ──────────────────────────────────────────────────────
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage]     = useState('')

  // ── Open create modal when the header button fires the signal ─────────────
  useEffect(() => {
    if (openCreateSignal > 0) openCreate()
  }, [openCreateSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived stats (computed from the current unfiltered list in the hook) ──
  // Note: when filters are active, `appointments` is the filtered result.
  // To keep stats accurate against the total, we compute them from the same
  // list the hook exposes — the backend handles filtering, so this always
  // reflects what the API returned for the current filter.
  const stats = useMemo(() => ({
    scheduled: appointments.filter(a => a.status === STATUS.SCHEDULED).length,
    completed: appointments.filter(a => a.status === STATUS.COMPLETED).length,
    cancelled: appointments.filter(a => a.status === STATUS.CANCELLED).length,
  }), [appointments])

  // ─── Modal helpers ─────────────────────────────────────────────────────────

  function clearFeedback() {
    setSuccessMessage('')
    setErrorMessage('')
  }

  function openCreate() {
    clearFeedback()
    setEditingAppointment(null)
    setModalMode(MODAL_CREATE)
  }

  function openEdit(appointment) {
    clearFeedback()
    setEditingAppointment(appointment)
    setModalMode(MODAL_EDIT)
  }

  function closeModal() {
    setModalMode(MODAL_CLOSED)
    setEditingAppointment(null)
  }

  // ─── Form submit handlers (async — delegate to hook) ──────────────────────

  async function onFormSubmit(formData) {
    if (modalMode === MODAL_CREATE) {
      const result = await handleCreate(formData)
      if (result.ok) {
        setSuccessMessage('Appointment created successfully.')
        closeModal()
      }
      // On failure, return the error so AppointmentForm can display it inline
      return result
    }

    if (modalMode === MODAL_EDIT) {
      const result = await handleUpdate(editingAppointment.id, formData)
      if (result.ok) {
        setSuccessMessage('Appointment updated successfully.')
        closeModal()
      }
      return result
    }
  }

  // ─── Complete handler ──────────────────────────────────────────────────────

  async function onComplete(id) {
    clearFeedback()
    const result = await handleComplete(id)
    if (result.ok) {
      setSuccessMessage('Appointment marked as completed.')
    } else {
      setErrorMessage(result.error)
    }
  }

  // ─── Cancel confirmation flow ──────────────────────────────────────────────

  function requestCancel(appointment) {
    clearFeedback()
    setConfirmTarget(appointment)
  }

  function dismissCancelConfirm() {
    setConfirmTarget(null)
  }

  async function confirmCancelAppointment() {
    const target = confirmTarget
    setConfirmTarget(null)
    const result = await handleCancel(target.id)
    if (result.ok) {
      setSuccessMessage('Appointment cancelled successfully.')
    } else {
      setErrorMessage(result.error)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const isModalOpen = modalMode !== MODAL_CLOSED

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">

      {/* ── Feedback banners ── */}
      {(successMessage || errorMessage) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50"
            >
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</p>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                aria-label="Dismiss success message"
                className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {errorMessage && (
            <ErrorMessage message={errorMessage} onDismiss={() => setErrorMessage('')} />
          )}
        </div>
      )}

      {/* ── Stats dashboard ── */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-lg font-bold mb-4 opacity-90">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Scheduled" count={stats.scheduled} iconBg="bg-blue-500/30"    icon={<CalendarIcon />} />
            <StatCard label="Completed" count={stats.completed} iconBg="bg-emerald-500/30" icon={<CheckCircleIcon />} />
            <StatCard label="Cancelled" count={stats.cancelled} iconBg="bg-rose-500/30"    icon={<XCircleIcon />} />
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <AppointmentFilters
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onDateChange={handleDateChange}
        onStatusChange={handleStatusChange}
        onClear={handleClearFilters}
        totalCount={appointments.length}
        filteredCount={appointments.length}
        loading={loading}
      />

      {/* ── Board: loading / error / list ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : loadError ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Unable to load appointments</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      ) : (
        <AppointmentBoard
          appointments={appointments}
          onEdit={openEdit}
          onComplete={onComplete}
          onCancel={requestCancel}
          onAddAppointment={openCreate}
          isBusy={isBusy}
        />
      )}

      {/* ── Add / Edit modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === MODAL_EDIT ? 'Edit Appointment' : 'Add Appointment'}
      >
        <AppointmentForm
          mode={modalMode === MODAL_EDIT ? 'edit' : 'create'}
          initialValues={editingAppointment}
          onSubmit={onFormSubmit}
          onCancel={closeModal}
        />
      </Modal>

      {/* ── Cancel confirmation dialog ── */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        title="Cancel this appointment?"
        message="This appointment will remain in your history as cancelled. This action cannot be undone."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        danger
        onConfirm={confirmCancelAppointment}
        onCancel={dismissCancelConfirm}
      />

    </main>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-6" aria-busy="true" aria-label="Loading appointments">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-slate-200 dark:border-l-slate-700 rounded-xl p-5 space-y-3 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
            <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="flex gap-3">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-28" />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2">
            <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-14" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-20" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, count, iconBg, icon }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
          <p className="text-3xl font-bold">{count}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Stat icons ───────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
