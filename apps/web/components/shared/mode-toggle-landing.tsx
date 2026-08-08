"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggleLanding() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#1a2744]" />
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" || theme === 'system' ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-[#1a2744] bg-white dark:bg-[#060d1a] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-600 hover:border-blue-200 dark:hover:border-cyan-800 transition-colors shadow-sm"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
