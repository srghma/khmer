import { useState, useEffect, useCallback } from 'react'
import { getCurrentWindow, type Theme } from '@tauri-apps/api/window'

const updateDOM = (t: Theme) => {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(t)
}

// will work only on desktop
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  const setTheme = useCallback(async (newTheme: Theme) => {
    const win = getCurrentWindow()

    await win.setTheme(newTheme)
    setThemeState(newTheme)
    updateDOM(newTheme)
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | undefined

    const init = async () => {
      const win = getCurrentWindow()

      const current: Theme | null = await win.theme()
      const resolved: Theme = current ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

      setThemeState(resolved)
      updateDOM(resolved)

      unlisten = await win.onThemeChanged(event => {
        const payload: Theme = event.payload

        setThemeState(payload)
        updateDOM(payload)
      })
    }

    init()

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  return { theme, setTheme }
}
