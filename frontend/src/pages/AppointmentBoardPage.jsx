import { useState, useMemo, useEffect } from 'react'
import AppointmentBoard from '../components/appointments/AppointmentBoard'
import AppointmentFilters from '../components/appointments/AppointmentFilters'
import AppointmentForm from '../components/appointments/AppointmentForm'
import ErrorMessage from '../components/common/ErrorMessage'
import Modal from '../components/common/Modal'
import { MOCK_APPOINTMENTS } from '../utils/mockData'
import { STATUS } from '../constants/appointments'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a UUID v4 using the browser's crypto API (no extra dependency). */
function generateId() {
  return crypto.randomUUID()
}

// ─── Modal modes ─────────────────────────────────────────────────────────────
const MODAL_CLOSED  = null
const MODAL_CREATE  = 'create'
const MODAL_EDIT    = 'edit'

export default function AppointmentBoardPage({ openCreateSignal = 0 }) {
  // ── Appointment collection ──────────────────────────────────────────────
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)

  // ── Filter state ────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Modal / form state ──────────────────────────────────────────────────
  const [modalMode, setModalMode]             = useState(MODAL_CLOSED)
  const [editingAppointment, setEditingAppointment] = useState(null)

  // ── Feedback banners ────────────────────────────────────────────────────
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage]     = useState('')

  // Open create modal when triggered from the header button in App.jsx
  useEffect(() => {
    if (openCreateSignal > 0) openCreate()
  }, [openCreateSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (dateFilter   && a.appointment_date !== dateFilter)   return false
      if (statusFilter && a.status           !== statusFilter) return false
      return true
    })
  }, [appointments, dateFilter, statusFilter])

  // ── Derived: stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    scheduled: appointments.filter(a => a.status === STATUS.SCHEDULED).length,
    completed: appointments.filter(a => a.status === STATUS.COMPLETED).length,
    cancelled: appointments.filter(a => a.status === STATUS.CANCELLED).length,
  }), [appointments])

  // ── Helpers ─────────────────────────────────────────────────────────────
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

  // ── Form submission handlers ─────────────────────────────────────────────
  function handleCreate(formData) {
    const now = new Date().toISOString()
    const newAppointment = {
      id: generateId(),
      ...formData,
      status: STATUS.SCHEDULED,
      created_at: now,
      updated_at: now,
    }
    setAppointments(prev => [newAppointment, ...prev])
    setSuccessMessage('Appointment created successfully.')
    closeModal()
  }

  function handleUpdate(formData) {
    const now = new Date().toISOString()
    setAppointments(prev =>
      prev.map(a =>
        a.id === editingAppointment.id
          ? {
              ...a,
              ...formData,
              // preserve fields the form does not touch
              id: a.id,
              status: a.status,
              created_at: a.created_at,
              updated_at: now,
            }
          : a
      )
    )
    setSuccessMessage('Appointment updated successfully.')
    closeModal()
  }

  // ── Status action handlers ───────────────────────────────────────────────
  function handleComplete(id) {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: STATUS.COMPLETED, updated_at: new Date().toISOString() } : a)
    )
  }

  function handleCancel(id) {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: STATUS.CANCELLED, updated_at: new Date().toISOString() } : a)
    )
  }

  function handleClearFilters() {
    setDateFilter('')
    setStatusFilter('')
  }

  // ── Render ───────────────────────────────────────────────────────────────
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
                aria-label="Dismiss"
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

            <StatCard
              label="Scheduled"
              count={stats.scheduled}
              iconBg="bg-blue-500/30"
              icon={<CalendarIcon />}
            />
            <StatCard
              label="Completed"
              count={stats.completed}
              iconBg="bg-emerald-500/30"
              icon={<CheckCircleIcon />}
            />
            <StatCard
              label="Cancelled"
              count={stats.cancelled}
              iconBg="bg-rose-500/30"
              icon={<XCircleIcon />}
            />

          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <AppointmentFilters
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onDateChange={setDateFilter}
        onStatusChange={setStatusFilter}
        onClear={handleClearFilters}
        totalCount={appointments.length}
        filteredCount={filtered.length}
      />

      {/* ── Board ── */}
      <AppointmentBoard
        appointments={filtered}
        onEdit={openEdit}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onAddAppointment={openCreate}
      />

      {/* ── Add / Edit modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === MODAL_EDIT ? 'Edit Appointment' : 'Add Appointment'}
      >
        <AppointmentForm
          mode={modalMode === MODAL_EDIT ? 'edit' : 'create'}
          initialValues={editingAppointment}
          onSubmit={modalMode === MODAL_EDIT ? handleUpdate : handleCreate}
          onCancel={closeModal}
        />
      </Modal>

    </main>
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
