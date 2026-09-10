import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment,
  getErrorMessage,
  isConflictError,
} from '../services/appointmentService'

/**
 * useAppointments
 *
 * Central data hook for the Appointment Board.
 * Owns:
 *   - the appointment list
 *   - filter state (date + status)
 *   - loading / error state for the list
 *   - CRUD operations (create, update, complete, cancel)
 *   - per-action busy state to prevent duplicate submissions
 *
 * Returns everything AppointmentBoardPage needs to render and act.
 */
export default function useAppointments() {
  // ── Appointment list ──────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState('')

  // ── Filters ───────────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Per-action busy tracking (maps id → true while a request is in flight) ─
  const [busyIds, setBusyIds] = useState({})

  // ── Abort controller ref — cancels stale filter requests ─────────────────
  const abortRef = useRef(null)

  // ─── List fetching ────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async (date, status) => {
    // Cancel any in-flight request before starting a new one
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setLoadError('')

    try {
      const data = await getAppointments({ date, status })
      // Only update state if this request wasn't superseded
      if (!controller.signal.aborted) {
        setAppointments(data)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setLoadError(getErrorMessage(err))
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch on mount and whenever filters change
  useEffect(() => {
    fetchAppointments(dateFilter, statusFilter)
    // Cleanup: abort if the component unmounts mid-request
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [dateFilter, statusFilter, fetchAppointments])

  // Manual retry (for the error state Retry button)
  const retry = useCallback(() => {
    fetchAppointments(dateFilter, statusFilter)
  }, [dateFilter, statusFilter, fetchAppointments])

  // ─── Filter helpers ───────────────────────────────────────────────────────

  function handleDateChange(value) {
    setDateFilter(value)
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
  }

  function handleClearFilters() {
    setDateFilter('')
    setStatusFilter('')
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function markBusy(id)   { setBusyIds(prev => ({ ...prev, [id]: true })) }
  function markIdle(id)   { setBusyIds(prev => { const n = { ...prev }; delete n[id]; return n }) }
  function isBusy(id)     { return !!busyIds[id] }

  /** Replace a single appointment in state with an updated version from the API. */
  function replaceAppointment(updated) {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  // ─── CRUD operations ──────────────────────────────────────────────────────

  /**
   * Create a new appointment.
   * @param {object} formData — validated form fields from AppointmentForm
   * @returns {{ ok: true, appointment: object } | { ok: false, error: string, isConflict: boolean }}
   */
  async function handleCreate(formData) {
    try {
      const created = await createAppointment(formData)
      // Prepend the new appointment so it appears at the top
      setAppointments(prev => [created, ...prev])
      return { ok: true, appointment: created }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err), isConflict: isConflictError(err) }
    }
  }

  /**
   * Update an existing appointment.
   * @param {string} id — UUID of the appointment to update
   * @param {object} formData — validated form fields from AppointmentForm
   * @returns {{ ok: true, appointment: object } | { ok: false, error: string, isConflict: boolean }}
   */
  async function handleUpdate(id, formData) {
    try {
      const updated = await updateAppointment(id, formData)
      replaceAppointment(updated)
      return { ok: true, appointment: updated }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err), isConflict: isConflictError(err) }
    }
  }

  /**
   * Mark an appointment as completed.
   * @param {string} id
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  async function handleComplete(id) {
    if (isBusy(id)) return { ok: false, error: 'Already in progress.' }
    markBusy(id)
    try {
      const updated = await completeAppointment(id)
      replaceAppointment(updated)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    } finally {
      markIdle(id)
    }
  }

  /**
   * Cancel an appointment. Record remains visible with Cancelled status.
   * @param {string} id
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  async function handleCancel(id) {
    if (isBusy(id)) return { ok: false, error: 'Already in progress.' }
    markBusy(id)
    try {
      const updated = await cancelAppointment(id)
      replaceAppointment(updated)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    } finally {
      markIdle(id)
    }
  }

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // List state
    appointments,
    loading,
    loadError,
    retry,

    // Filter state + handlers
    dateFilter,
    statusFilter,
    handleDateChange,
    handleStatusChange,
    handleClearFilters,

    // Per-action busy state
    isBusy,

    // CRUD
    handleCreate,
    handleUpdate,
    handleComplete,
    handleCancel,
  }
}
