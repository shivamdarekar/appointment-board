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

const DEFAULT_PAGE_SIZE = 10

/**
 * useAppointments
 *
 * Central data hook for the Appointment Board.
 * Owns:
 *   - the appointment list (current page)
 *   - filter state (date + status)
 *   - pagination state (page, pageSize, total, totalPages)
 *   - loading / error state for the list
 *   - CRUD operations (create, update, complete, cancel)
 *   - per-action busy state to prevent duplicate submissions
 */
export default function useAppointments() {
  // ── Appointment list (current page) ──────────────────────────────────────
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState('')

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage]             = useState(1)
  const [pageSize]                  = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Per-action busy tracking (id → true while in-flight) ─────────────────
  const [busyIds, setBusyIds] = useState({})

  // ── Abort controller ref ──────────────────────────────────────────────────
  const abortRef = useRef(null)

  // ─── List fetching ────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async (date, status, targetPage) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setLoadError('')

    try {
      const result = await getAppointments({ date, status, page: targetPage, pageSize })
      if (!controller.signal.aborted) {
        setAppointments(result.items)
        setTotal(result.total)
        setTotalPages(result.total_pages)
        setPage(result.page)
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
  }, [pageSize])

  // Fetch when filters or page changes
  useEffect(() => {
    fetchAppointments(dateFilter, statusFilter, page)
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [dateFilter, statusFilter, page, fetchAppointments])

  // Manual retry
  const retry = useCallback(() => {
    fetchAppointments(dateFilter, statusFilter, page)
  }, [dateFilter, statusFilter, page, fetchAppointments])

  // ─── Filter helpers — reset to page 1 on any filter change ───────────────

  function handleDateChange(value) {
    setDateFilter(value)
    setPage(1)
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleClearFilters() {
    setDateFilter('')
    setStatusFilter('')
    setPage(1)
  }

  // ─── Pagination helpers ───────────────────────────────────────────────────

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return
    setPage(targetPage)
  }

  function goToPrevPage() { goToPage(page - 1) }
  function goToNextPage() { goToPage(page + 1) }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  function markBusy(id) { setBusyIds(prev => ({ ...prev, [id]: true })) }
  function markIdle(id) { setBusyIds(prev => { const n = { ...prev }; delete n[id]; return n }) }
  function isBusy(id)   { return !!busyIds[id] }

  // After a mutation that changes the total (create/complete/cancel with active
  // status filter), refetch the current page so pagination stays consistent.
  function refetch() {
    fetchAppointments(dateFilter, statusFilter, page)
  }

  // ─── CRUD operations ──────────────────────────────────────────────────────

  async function handleCreate(formData) {
    try {
      const created = await createAppointment(formData)
      // Go to page 1 to show the new appointment (ordered by date/time)
      if (page === 1) {
        refetch()
      } else {
        setPage(1) // triggers useEffect → fetch page 1
      }
      return { ok: true, appointment: created }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err), isConflict: isConflictError(err) }
    }
  }

  async function handleUpdate(id, formData) {
    try {
      const updated = await updateAppointment(id, formData)
      // Refetch to reflect updated data in current sort order
      refetch()
      return { ok: true, appointment: updated }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err), isConflict: isConflictError(err) }
    }
  }

  async function handleComplete(id) {
    if (isBusy(id)) return { ok: false, error: 'Already in progress.' }
    markBusy(id)
    try {
      await completeAppointment(id)
      refetch()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    } finally {
      markIdle(id)
    }
  }

  async function handleCancel(id) {
    if (isBusy(id)) return { ok: false, error: 'Already in progress.' }
    markBusy(id)
    try {
      await cancelAppointment(id)
      refetch()
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

    // Pagination state + helpers
    page,
    pageSize,
    total,
    totalPages,
    goToPrevPage,
    goToNextPage,
    goToPage,

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
