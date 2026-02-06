import { useEffect, type RefObject } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useSettings } from '../providers/SettingsProvider'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'

/**
 * Common logic to handle clicking on a Khmer word (span with data-navigate-khmer-word).
 * Returns the CSS class string to apply to the container to enable hover effects.
 */
export const useKhmerLinkInterception = (
  containerRef: RefObject<HTMLElement | null>,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
) => {
  const { isKhmerLinksEnabled } = useSettings()

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleClick = (e: MouseEvent) => {
      // 1. Check if feature is enabled
      if (!isKhmerLinksEnabled) return

      const target = e.target as HTMLElement

      // 2. Find the closest Khmer word span
      const navigateSpan = target.closest('[data-navigate-khmer-word]') as HTMLElement | null

      if (navigateSpan) {
        const rawWord = navigateSpan.getAttribute('data-navigate-khmer-word')
        const word = rawWord ? String_toNonEmptyString_orUndefined_afterTrim(rawWord) : undefined

        if (word) {
          e.preventDefault()
          e.stopPropagation() // Prevent bubbling
          onNavigate(word, 'km')
        }
      }
    }

    container.addEventListener('click', handleClick)

    return () => container.removeEventListener('click', handleClick)
  }, [containerRef, onNavigate, isKhmerLinksEnabled])

  const interactive = isKhmerLinksEnabled ? srghma_khmer_dict_content_styles.interactive : ''

  // Return the CSS class to apply for hover effects
  return `${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${interactive}`
}
