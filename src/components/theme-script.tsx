"use client"

import { useEffect } from "react"

export function ThemeScript() {
  useEffect(() => {
    // This script runs immediately to prevent flash of wrong theme
    const script = `
      (function() {
        try {
          var theme = localStorage.getItem('movie-tracker-theme') || 'dark';
          var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          var actualTheme = theme === 'system' ? systemTheme : theme;
          
          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
          }
        } catch (e) {
          console.error('Theme script error:', e);
        }
      })();
    `

    const scriptElement = document.createElement("script")
    scriptElement.innerHTML = script
    document.head.appendChild(scriptElement)

    return () => {
      document.head.removeChild(scriptElement)
    }
  }, [])

  return null
}
