import { useEffect, type RefObject } from 'react'

/**
 * Replaces broken images with a styled error div.
 */
export const useImageErrorReplacer = (containerRef: RefObject<HTMLDivElement | null>, dependency: any) => {
  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleImageError = (e: Event) => {
      const target = e.target as HTMLElement

      if (target.tagName !== 'IMG') return

      const imgElement = target as HTMLImageElement
      const src = imgElement.getAttribute('src') || ''
      const filename = src.split('/').pop()?.split('?')[0] || 'Unknown Image'

      const errorDiv = document.createElement('div')

      errorDiv.className = 'ek-img-error'
      errorDiv.textContent = `Image not found: ${filename}`

      imgElement.replaceWith(errorDiv)
    }

    // Capture phase is required for error events
    container.addEventListener('error', handleImageError, true)

    return () => container.removeEventListener('error', handleImageError, true)
  }, [dependency])
}
