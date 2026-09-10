export const STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const STATUS_LABELS = {
  [STATUS.SCHEDULED]: 'Scheduled',
  [STATUS.COMPLETED]: 'Completed',
  [STATUS.CANCELLED]: 'Cancelled',
}

export const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: STATUS.SCHEDULED, label: 'Scheduled' },
  { value: STATUS.COMPLETED, label: 'Completed' },
  { value: STATUS.CANCELLED, label: 'Cancelled' },
]
