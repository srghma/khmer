import { useEffect } from 'react'
import { type PreloadableComponent } from 'react-lazy-with-preload'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from './errorMessage'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

/**
 * Hook to trigger preloading of components when the browser is idle.
 * If window.requestIdleCallback is missing, it does nothing.
 */
export function usePreloadOnIdle(components: PreloadableComponent<any>[]) {
  const toast = useAppToast()

  useEffect(() => {
    // Check specifically for requestIdleCallback availability
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => {
        components.forEach(component => {
          try {
            component.preload()
          } catch (e: unknown) {
            toast.warn('Failed to preload component on idle' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          }
        })
      })

      return () => window.cancelIdleCallback(handle)
    }
    // No fallback logic, as requested.
  }, [components])
}
