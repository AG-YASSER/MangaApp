import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'

function ThemeToggle() {
  // Theme options: 'light', 'dark', or 'system'
  const [theme, setTheme] = useState('system')

  // Initialize theme from localStorage on mount
  useEffect(() => {
    // Get initial theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }
  }, [])

  // Apply theme whenever it changes
  useEffect(() => {
    // Check if we should use system preference
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches

      document.documentElement.classList.toggle('dark', prefersDark)

      // Setup listener for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => {
        document.documentElement.classList.toggle('dark', e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Apply explicit user preference
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // Cycle through themes
  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % modes.length
    setTheme(modes[nextIndex])
  }

  // Get icon based on current theme
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />
      case 'dark':
        return <Moon size={20} />
      case 'system':
        return <Monitor size={20} />
      default:
        return <Sun size={20} />
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full bg-white/50 dark:bg-black/50 text-[#003554] dark:text-[#CCDBFD] 
                transition-colors duration-300 hover:bg-white/70 dark:hover:bg-black/70 
                focus:outline-none focus:ring-2 focus:ring-[#003554] dark:focus:ring-[#CCDBFD] cursor-pointer"
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
