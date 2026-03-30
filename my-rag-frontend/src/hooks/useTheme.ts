import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  return { isDark }
}
