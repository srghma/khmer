import { useEffect } from 'react'
import { type PreloadableComponent } from 'react-lazy-with-preload'
import { useToast } from '../providers/ToastProvider'

/**
 * Hook to trigger preloading of components when the browser is idle.
 * If window.requestIdleCallback is missing, it does nothing.
 */
export function usePreloadOnIdle(components: PreloadableComponent<any>[]) {
  const toast = useToast()

  useEffect(() => {
    // Check specifically for requestIdleCallback availability
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => {
        components.forEach(component => {
          try {
            component.preload()
          } catch (e: any) {
            toast.warn('Failed to preload component on idle', e.message)
          }
        })
      })

      return () => window.cancelIdleCallback(handle)
    }
    // No fallback logic, as requested.
  }, [components])
}
