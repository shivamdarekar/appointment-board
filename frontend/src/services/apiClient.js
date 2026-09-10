import axios from 'axios'

/**
 * Centralized Axios instance.
 *
 * Base URL is read from the Vite environment variable so it is never
 * hard-coded and never changes between environments.
 *
 * All API service modules import this instance instead of creating
 * their own Axios instances.
 */
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/appointments/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
