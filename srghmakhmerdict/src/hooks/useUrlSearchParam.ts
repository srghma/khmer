import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { getUrlSearchParam } from '../utils/url-navigation'

/**
 * A hook to sync a React state with a URL query parameter.
 *
 * @param paramKey The query parameter key (e.g., 'text')
 * @returns [currentValue, setValue] - similar to useState, but updates URL
 */
export const useUrlSearchParam = (paramKey: string) => {
  const [location, setLocation] = useLocation()

  // 1. Initialize state from URL
  const [value, setValue] = useState<string>(() => getUrlSearchParam(paramKey) ?? '')

  // 2. Listen for browser back/forward (popstate) to sync local state with URL
  useEffect(() => {
    const handlePopState = () => {
      const newValue = getUrlSearchParam(paramKey) ?? ''
      if (newValue !== value) {
        setValue(newValue)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [paramKey, value])

  // 3. Helper to update both local state and URL
  const setParam = useCallback(
    (newValue: string) => {
      setValue(newValue)

      // Construct new URL with updated param
      const params = new URLSearchParams(window.location.search)

      if (newValue) {
        params.set(paramKey, newValue)
      } else {
        params.delete(paramKey)
      }

      const queryString = params.toString()
      const targetUrl = queryString ? `${location}?${queryString}` : location

      // We use replace: true to avoid cluttering history with every keystroke if debounced upstream,
      // but typically explicit navigation pushes.
      // For 'search as you type', usually replace is better.
      // However, wouter's setLocation usually pushes.
      // Let's rely on the component to decide, but here we default to replacing
      // the current entry if we are just tweaking params on the same page.
      setLocation(targetUrl, { replace: true })
    },
    [location, paramKey, setLocation],
  )

  return [value, setParam] as const
}
