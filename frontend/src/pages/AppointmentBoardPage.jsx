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

// Modal modes
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

  const [modalMode, setModalMode] = useState(MODAL_CLOSED)
  const [editingAppointment, setEditingAppointment] = useState(null)

  const [completeTarget, setCompleteTarget] = useState(null)
  const [completing, setCompleting] = useState(false)

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Open create modal when header button is clicked
  useEffect(() => {
    if (openCreateSignal > 0) openCreate()
  }, [openCreateSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate stats for current page appointments
  const stats = useMemo(() => ({
    scheduled: appointments.filter(a => a.status === STATUS.SCHEDULED).length,
    completed: appointments.filter(a => a.status === STATUS.COMPLETED).length,
    cancelled: appointments.filter(a => a.status === STATUS.CANCELLED).length,
  }), [appointments])

  const isFiltered = !!(dateFilter || statusFilter)

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

  // Complete appointment confirmation handlers
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

  // Cancel appointment confirmation handlers
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

  const isModalOpen = modalMode !== MODAL_CLOSED

  return (
    <main className="flex-1 bg-[#f7f8fa] transition-colors dark:bg-slate-950">

      <div className="border-b border-slate-200 bg-[#f7f8fa] dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Title */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Schedule overview</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Appointments</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loading ? 'Loading your schedule…' : `${total} appointment${total !== 1 ? 's' : ''} in the current view`}
              </p>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatPill
                label="Scheduled"
                count={stats.scheduled}
                color="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200"
              />
              <StatPill
                label="Completed"
                count={stats.completed}
                color="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
              />
              <StatPill
                label="Cancelled"
                count={stats.cancelled}
                color="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

          </div>
        </div>
      </div>

      <AppointmentFilters
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onDateChange={handleDateChange}
        onStatusChange={handleStatusChange}
        onClear={handleClearFilters}
        totalCount={total}
        loading={loading}
      />

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


// Loading error state component
function LoadError({ message, onRetry }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50">
        <svg className="h-10 w-10 text-rose-600 dark:text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Unable to load appointments</p>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 dark:focus-visible:ring-sky-300"
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


// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading appointments">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden h-11 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 lg:block" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 dark:border-slate-800 lg:grid-cols-[12rem_minmax(0,1fr)_8rem_17rem] lg:items-center lg:gap-5 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-2"><div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" /><div className="h-2.5 w-32 rounded bg-slate-50 dark:bg-slate-700" /></div>
            </div>
            <div className="space-y-2"><div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" /><div className="h-2.5 w-1/2 rounded bg-slate-50 dark:bg-slate-700" /></div>
            <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="flex gap-2 lg:justify-end"><div className="h-8 w-14 rounded-lg bg-slate-50 dark:bg-slate-700" /><div className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" /><div className="h-8 w-14 rounded-lg bg-slate-50 dark:bg-slate-700" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}


// Stat pill component for displaying appointment counts
function StatPill({ label, count, color }) {
  return (
    <div className={`min-w-[5.5rem] rounded-xl border px-3 py-2 ${color}`}>
      <span className="block text-lg font-bold leading-none">{count}</span>
      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
    </div>
  )
}
