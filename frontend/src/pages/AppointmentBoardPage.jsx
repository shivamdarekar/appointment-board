import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import AppointmentBoard from '../components/appointments/AppointmentBoard'
import AppointmentFilters from '../components/appointments/AppointmentFilters'
import AppointmentForm from '../components/appointments/AppointmentForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import useAppointments from '../hooks/useAppointments'
import { STATUS } from '../constants/appointments'
import { formatDate, formatTimeRange } from '../utils/formatters'

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
    page,
    pageSize,
    total,
    totalPages,
    goToPrevPage,
    goToNextPage,
    goToPage,
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

  // ── Form modal state ──────────────────────────────────────────────────────
  const [modalMode, setModalMode]               = useState(MODAL_CLOSED)
  const [editingAppointment, setEditingAppointment] = useState(null)

  // ── Complete confirmation state ───────────────────────────────────────────
  const [completeTarget, setCompleteTarget] = useState(null)
  const [completing, setCompleting]         = useState(false)

  // ── Cancel confirmation state ─────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling]     = useState(false)

  // ── Open create when header button fires ─────────────────────────────────
  useEffect(() => {
    if (openCreateSignal > 0) openCreate()
  }, [openCreateSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats (current page only) ─────────────────────────────────────────────
  const stats = useMemo(() => ({
    scheduled: appointments.filter(a => a.status === STATUS.SCHEDULED).length,
    completed: appointments.filter(a => a.status === STATUS.COMPLETED).length,
    cancelled: appointments.filter(a => a.status === STATUS.CANCELLED).length,
  }), [appointments])

  const isFiltered = !!(dateFilter || statusFilter)

  // ─── Form modal ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditingAppointment(null)
    setModalMode(MODAL_CREATE)
  }

  function openEdit(appointment) {
    if (appointment.status !== STATUS.SCHEDULED) return
    setEditingAppointment(appointment)
    setModalMode(MODAL_EDIT)
  }

  function closeModal() {
    setModalMode(MODAL_CLOSED)
    setEditingAppointment(null)
  }

  async function onFormSubmit(formData) {
    if (modalMode === MODAL_CREATE) {
      const result = await handleCreate(formData)
      if (result.ok) {
        toast.success('Appointment created successfully.')
        closeModal()
      }
      return result
    }
    if (modalMode === MODAL_EDIT) {
      const result = await handleUpdate(editingAppointment.id, formData)
      if (result.ok) {
        toast.success('Appointment updated successfully.')
        closeModal()
      }
      return result
    }
  }

  // ─── Complete confirmation flow ───────────────────────────────────────────

  function requestComplete(appointment) {
    setCompleteTarget(appointment)
  }

  function dismissCompleteConfirm() {
    if (completing) return
    setCompleteTarget(null)
  }

  async function confirmCompleteAppointment() {
    if (completing) return
    setCompleting(true)
    const target = completeTarget
    try {
      const result = await handleComplete(target.id)
      if (result.ok) {
        toast.success('Appointment marked as completed.')
        setCompleteTarget(null)
      } else {
        toast.error(result.error)
        setCompleteTarget(null)
      }
    } finally {
      setCompleting(false)
    }
  }

  // ─── Cancel confirmation flow ─────────────────────────────────────────────

  function requestCancel(appointment) {
    setCancelTarget(appointment)
  }

  function dismissCancelConfirm() {
    if (cancelling) return
    setCancelTarget(null)
  }

  async function confirmCancelAppointment() {
    if (cancelling) return
    setCancelling(true)
    const target = cancelTarget
    try {
      const result = await handleCancel(target.id)
      if (result.ok) {
        toast.success('Appointment cancelled successfully.')
        setCancelTarget(null)
      } else {
        toast.error(result.error)
        setCancelTarget(null)
      }
    } finally {
      setCancelling(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const isModalOpen = modalMode !== MODAL_CLOSED

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">

      {/* ── Page header with summary stats ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appointments</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {loading ? 'Loading…' : `${total} total appointment${total !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Stat pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill
                label="Scheduled"
                count={stats.scheduled}
                color="bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700/40"
              />
              <StatPill
                label="Completed"
                count={stats.completed}
                color="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700/40"
              />
              <StatPill
                label="Cancelled"
                count={stats.cancelled}
                color="bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
              />
            </div>

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
        totalCount={total}
        loading={loading}
      />

      {/* ── Board: loading / error / list ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : loadError ? (
        <LoadError message={loadError} onRetry={retry} />
      ) : (
        <>
          <AppointmentBoard
            appointments={appointments}
            onEdit={openEdit}
            onComplete={requestComplete}
            onCancel={requestCancel}
            onAddAppointment={isFiltered ? handleClearFilters : openCreate}
            isBusy={isBusy}
            isFiltered={isFiltered}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPrev={goToPrevPage}
            onNext={goToNextPage}
            onPage={goToPage}
            loading={loading}
          />
        </>
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

      {/* ── Complete confirmation ── */}
      <ConfirmDialog
        isOpen={!!completeTarget}
        title="Mark appointment as completed?"
        message={completeTarget ? (
          <div className="space-y-2">
            <p className="font-medium text-slate-800 dark:text-slate-200">{completeTarget.title}</p>
            <p className="text-slate-500 dark:text-slate-400">
              {formatDate(completeTarget.appointment_date)}
              {' · '}
              {formatTimeRange(completeTarget.start_time, completeTarget.end_time)}
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              This appointment will become read-only after completion.
            </p>
          </div>
        ) : ''}
        confirmLabel={completing ? 'Completing…' : 'Mark as Completed'}
        cancelLabel="Cancel"
        danger={false}
        confirming={completing}
        onConfirm={confirmCompleteAppointment}
        onCancel={dismissCompleteConfirm}
      />

      {/* ── Cancel confirmation ── */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel this appointment?"
        message={cancelTarget ? (
          <div className="space-y-2">
            <p className="font-medium text-slate-800 dark:text-slate-200">{cancelTarget.title}</p>
            <p className="text-slate-500 dark:text-slate-400">
              {formatDate(cancelTarget.appointment_date)}
              {' · '}
              {formatTimeRange(cancelTarget.start_time, cancelTarget.end_time)}
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              The appointment will remain visible as cancelled. This cannot be undone.
            </p>
          </div>
        ) : ''}
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel Appointment'}
        cancelLabel="Keep Appointment"
        danger
        confirming={cancelling}
        onConfirm={confirmCancelAppointment}
        onCancel={dismissCancelConfirm}
      />

    </main>
  )
}

// ─── Load error state ─────────────────────────────────────────────────────────

function LoadError({ message, onRetry }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Unable to load appointments</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Retry
        </button>
      </div>
    </div>
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

// ─── Stat pill ───────────────────────────────────────────────────────────────

function StatPill({ label, count, color }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}>
      <span className="text-base font-bold">{count}</span>
      {label}
    </span>
  )
}
