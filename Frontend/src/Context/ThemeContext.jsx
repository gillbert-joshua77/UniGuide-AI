import React, { useState, useEffect, useCallback } from 'react'
import { ThemeContext } from './useTheme'

const THEME_STORAGE_KEY = 'uniguide_theme'

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore storage errors
    }
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
