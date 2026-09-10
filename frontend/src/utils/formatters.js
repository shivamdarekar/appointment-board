/**
 * Shared date/time formatting utilities.
 * Keeps presentation logic out of components.
 */

/**
 * Format an ISO date string (YYYY-MM-DD) to a readable date.
 * e.g. "2026-10-01" → "01 Oct 2026"
 */
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format an HH:MM:SS time string to 12-hour display.
 * e.g. "09:00:00" → "9:00 AM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [hourStr, minStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const min = minStr
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${min} ${period}`
}

/**
 * Format a start/end time pair as a range.
 * e.g. "9:00 AM – 10:00 AM"
 */
export function formatTimeRange(startTime, endTime) {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}
