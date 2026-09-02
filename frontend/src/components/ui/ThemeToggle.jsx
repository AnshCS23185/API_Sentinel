import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/app/providers/ThemeProvider'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1 text-slate-500 dark:text-slate-400">
      <button
        onClick={() => setTheme('light')}
        className={`rounded-md p-1.5 transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-xs'
            : 'hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded-md p-1.5 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-800 text-[#ACCAB2] shadow-xs'
            : 'hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`rounded-md p-1.5 transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-xs'
            : 'hover:text-slate-900 dark:hover:text-slate-100'
        }`}
        title="System Preference"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
