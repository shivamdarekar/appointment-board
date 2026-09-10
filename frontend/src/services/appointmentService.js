import apiClient from './apiClient'

// ─── Error mapping ────────────────────────────────────────────────────────────

/**
 * Translate an Axios error into a human-readable message.
 * The backend always returns { detail: string } for expected errors.
 * We surface that message directly when it is present and safe to show.
 *
 * @param {unknown} error - The caught error from an Axios call.
 * @returns {string} A user-friendly error message.
 */
export function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.'

  if (error.response) {
    const { status, data } = error.response
    const detail = data?.detail

    switch (status) {
      case 400:
      case 422:
        return detail ?? 'The request contained invalid data. Please check your input.'
      case 404:
        return 'The appointment could not be found.'
      case 409:
        return detail ?? 'This time slot is already occupied. Please choose a different time.'
      case 500:
        return 'A server error occurred. Please try again later.'
      default:
        return detail ?? `Unexpected error (${status}). Please try again.`
    }
  }

  // Network error — FastAPI unreachable
  if (error.request) {
    return 'Unable to connect to the server. Please check that the backend is running.'
  }

  return error.message ?? 'An unexpected error occurred.'
}

/**
 * Returns true if the error is a 409 Conflict response.
 * Used by the form to keep itself open and show an inline error.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isConflictError(error) {
  return error?.response?.status === 409
}

// ─── API methods ──────────────────────────────────────────────────────────────

/**
 * Fetch all appointments, optionally filtered by date and/or status.
 *
 * @param {{ date?: string, status?: string }} filters
 * @returns {Promise<Appointment[]>}
 */
export async function getAppointments({ date = '', status = '' } = {}) {
  const params = {}
  if (date)   params.date   = date
  if (status) params.status = status

  const { data } = await apiClient.get('', { params })
  return data
}

/**
 * Fetch a single appointment by UUID.
 *
 * @param {string} id
 * @returns {Promise<Appointment>}
 */
export async function getAppointment(id) {
  const { data } = await apiClient.get(`${id}`)
  return data
}

/**
 * Create a new appointment.
 * Sends only the user-editable fields — the backend owns id, status, timestamps.
 *
 * @param {{ title: string, description: string|null, appointment_date: string, start_time: string, end_time: string }} payload
 * @returns {Promise<Appointment>}
 */
export async function createAppointment(payload) {
  const { data } = await apiClient.post('', payload)
  return data
}

/**
 * Update an existing appointment by UUID.
 * Sends only the user-editable fields.
 *
 * @param {string} id
 * @param {{ title: string, description: string|null, appointment_date: string, start_time: string, end_time: string }} payload
 * @returns {Promise<Appointment>}
 */
export async function updateAppointment(id, payload) {
  const { data } = await apiClient.put(`${id}`, payload)
  return data
}

/**
 * Mark an appointment as completed.
 *
 * @param {string} id
 * @returns {Promise<Appointment>}
 */
export async function completeAppointment(id) {
  const { data } = await apiClient.patch(`${id}/complete`)
  return data
}

/**
 * Cancel an appointment. The record is never deleted.
 *
 * @param {string} id
 * @returns {Promise<Appointment>}
 */
export async function cancelAppointment(id) {
  const { data } = await apiClient.patch(`${id}/cancel`)
  return data
}
