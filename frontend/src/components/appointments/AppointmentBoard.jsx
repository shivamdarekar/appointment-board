import EmptyState from '../common/EmptyState'
import AppointmentCard from './AppointmentCard'

export default function AppointmentBoard({ appointments, onEdit, onComplete, onCancel, onAddAppointment }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No appointments found"
        message="Try adjusting your filters, or add a new appointment to get started."
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
          />
        </div>
      ))}
    </div>
  )
}
