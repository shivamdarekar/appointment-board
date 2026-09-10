import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import AppHeader from './components/layout/AppHeader'
import useTheme from './hooks/useTheme'
import AppointmentBoardPage from './pages/AppointmentBoardPage'


// Root application component with toast notifications
export default function App() {
  const [openFormSignal, setOpenFormSignal] = useState(0)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  function triggerOpenCreate() {
    setOpenFormSignal(n => n + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-slate-950 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader onAddAppointment={triggerOpenCreate} theme={theme} onThemeToggle={toggleTheme} />
      <AppointmentBoardPage openCreateSignal={openFormSignal} />

      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '0.875rem',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#f8fafc' : '#0f172a',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: isDark ? '0 16px 36px -16px rgba(0, 0, 0, 0.65)' : '0 16px 36px -16px rgba(15, 23, 42, 0.30)',
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
            style: {
              background: isDark ? '#4c0519' : '#fff1f2',
              color: isDark ? '#fecdd3' : '#9f1239',
              border: isDark ? '1px solid #9f1239' : '1px solid #fecdd3',
            },
          },
        }}
      />
    </div>
  )
}
