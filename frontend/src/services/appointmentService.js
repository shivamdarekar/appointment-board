import apiClient from './apiClient'


// Translate Axios errors into user-friendly messages
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

  if (error.request) {
    return 'Unable to connect to the server. Please check that the backend is running.'
  }

  return error.message ?? 'An unexpected error occurred.'
}


// Check if error is a 409 Conflict (time slot conflict)
export function isConflictError(error) {
  return error?.response?.status === 409
}


// Fetch appointments with optional filters and pagination
export async function getAppointments({ date = '', status = '', page = 1, pageSize = 10 } = {}) {
  const params = {}
  if (date)     params.date      = date
  if (status)   params.status    = status
  params.page      = page
  params.page_size = pageSize

  const { data } = await apiClient.get('', { params })
  return data
}


export async function getAppointment(id) {
  const { data } = await apiClient.get(`${id}`)
  return data
}


export async function createAppointment(payload) {
  const { data } = await apiClient.post('', payload)
  return data
}


export async function updateAppointment(id, payload) {
  const { data } = await apiClient.put(`${id}`, payload)
  return data
}


export async function completeAppointment(id) {
  const { data } = await apiClient.patch(`${id}/complete`)
  return data
}


export async function cancelAppointment(id) {
  const { data } = await apiClient.patch(`${id}/cancel`)
  return data
}
