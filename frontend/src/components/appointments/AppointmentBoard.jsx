import EmptyState from '../common/EmptyState'
import AppointmentCard from './AppointmentCard'

/**
 * AppointmentBoard
 *
 * Props:
 *   appointments     — array of appointment objects
 *   onEdit           — (appointment) => void
 *   onComplete       — (appointment) => void  — passes whole object for confirm dialog
 *   onCancel         — (appointment) => void  — passes whole object for confirm dialog
 *   onAddAppointment — () => void
 *   isBusy           — (id) => boolean
 *   isFiltered       — boolean  — true when date/status filters are active
 */
export default function AppointmentBoard({
  appointments,
  onEdit,
  onComplete,
  onCancel,
  onAddAppointment,
  isBusy,
  isFiltered = false,
}) {
  if (appointments.length === 0) {
    if (isFiltered) {
      return (
        <EmptyState
          variant="filtered"
          title="No appointments match your filters"
          message="Try changing the date or status filter, or clear all filters to see every appointment."
          action={{ label: 'Clear Filters', onClick: onAddAppointment }}
        />
      )
    }
    return (
      <EmptyState
        variant="empty"
        title="No appointments yet"
        message="Create your first appointment to get started."
        action={{ label: '+ Add Appointment', onClick: onAddAppointment }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-6" role="list">
      {appointments.map((appt) => (
        <div key={appt.id} role="listitem">
          <AppointmentCard
            appointment={appt}
            onEdit={onEdit}
            onComplete={onComplete}
            onCancel={onCancel}
            isBusy={isBusy}
          />
        </div>
      ))}
    </div>
  )
}
