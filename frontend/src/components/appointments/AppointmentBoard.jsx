import EmptyState from '../common/EmptyState'
import AppointmentCard from './AppointmentCard'

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
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            variant={isFiltered ? 'filtered' : 'empty'}
            title={isFiltered ? 'No appointments match these filters' : 'Your schedule is clear'}
            message={isFiltered ? 'Try another date or status, or clear the filters to see every appointment.' : 'Create your first appointment to start building the team schedule.'}
            action={{ label: isFiltered ? 'Clear filters' : 'New appointment', onClick: onAddAppointment }}
          />
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-label="Appointment list">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden grid-cols-[12rem_minmax(0,1fr)_8rem_17rem] gap-5 border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 lg:grid">
          <span>When</span>
          <span>Appointment</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onEdit={onEdit}
              onComplete={onComplete}
              onCancel={onCancel}
              isBusy={isBusy}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
