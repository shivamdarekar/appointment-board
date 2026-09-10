import ThemeToggle from '../common/ThemeToggle'

export default function AppHeader({ onAddAppointment, theme, onThemeToggle }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 shadow-sm shadow-slate-300 dark:bg-sky-400 dark:shadow-none">
            <svg className="h-5 w-5 text-white dark:text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4.75 9.25h14.5M5.5 5.5h13A1.5 1.5 0 0120 7v11.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5V7a1.5 1.5 0 011.5-1.5zM8 13h3m2 0h3" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Team workspace</p>
            <h1 className="truncate text-base font-bold tracking-tight text-slate-950 dark:text-white">Appointment Board</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <button
            type="button"
            onClick={onAddAppointment}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950 sm:px-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
            <span className="hidden sm:inline">New appointment</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  )
}
