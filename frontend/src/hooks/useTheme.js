import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'appointment-board-theme'

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return savedTheme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The UI still works when browser storage is unavailable.
    }
  }, [theme])

  function toggleTheme() {
    setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
