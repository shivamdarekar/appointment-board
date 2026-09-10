import { useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import AppointmentBoardPage from './pages/AppointmentBoardPage'

/**
 * Root application shell.
 *
 * openFormSignal is a counter that AppointmentBoardPage watches.
 * Incrementing it triggers the "Add Appointment" modal from the header button
 * without duplicating modal state or creating circular dependencies.
 * All actual form/modal/appointment state lives in AppointmentBoardPage.
 */
export default function App() {
  const [openFormSignal, setOpenFormSignal] = useState(0)

  function triggerOpenCreate() {
    setOpenFormSignal(n => n + 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader onAddAppointment={triggerOpenCreate} />
      <AppointmentBoardPage openCreateSignal={openFormSignal} />
    </div>
  )
}
