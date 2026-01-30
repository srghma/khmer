import { useEffect, type RefObject } from 'react'
// Import invoke
import { useToast } from '../providers/ToastProvider'
import { type DictionaryLanguage } from '../types'
import { detectModeFromText, extractWikiTerm } from '../utils/rendererUtils'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

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

/**
 * Intercepts Wiki links to navigate within the app.
 */
export const useWikiLinkInterception = (
  containerRef: RefObject<HTMLDivElement | null>,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
  currentMode: DictionaryLanguage,
  htmlContent: string, // Re-attach listener if HTML changes
) => {
  const toast = useToast()

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')

      if (!target) return

      const href = target.getAttribute('href')

      if (!href) return

      if (href.startsWith('/wiki/')) {
        e.preventDefault()
        const term = extractWikiTerm(href)

        if (term) {
          const nextMode = detectModeFromText(term, currentMode)

          onNavigate(term, nextMode)
        } else {
          toast.error('Invalid Link', 'Could not parse wiki link')
        }
      } else {
        target.setAttribute('target', '_blank')
        target.setAttribute('rel', 'noopener noreferrer')
      }
    }

    container.addEventListener('click', handleLinkClick)

    return () => container.removeEventListener('click', handleLinkClick)
  }, [htmlContent, onNavigate, currentMode, toast])
}
