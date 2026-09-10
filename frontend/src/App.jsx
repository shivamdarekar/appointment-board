import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import AppHeader from './components/layout/AppHeader'
import AppointmentBoardPage from './pages/AppointmentBoardPage'

/**
 * Root application shell.
 *
 * <Toaster> is mounted once here at the root so toasts are always
 * rendered outside any scrollable/modal content.
 *
 * openFormSignal: counter AppointmentBoardPage watches to open the
 * "Add Appointment" modal from the header button.
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

      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '0.75rem',
            background: '#fff',
            color: '#1e293b',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)',
            maxWidth: '360px',
            padding: '12px 16px',
          },
          success: {
            duration: 3500,
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            duration: 5500,
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </div>
  )
}
