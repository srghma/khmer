import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useSettings } from '../providers/SettingsProvider'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'
import { useEffect } from 'react'

/**
 * Tries to handle a click on a Khmer word (span with data-navigate-khmer-word).
 * Returns true if the event was handled (navigation triggered), false otherwise.
 */
export const tryHandleKhmerWordClick = (
  e: MouseEvent,
  isKhmerLinksEnabled: boolean,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
): boolean => {
  if (!isKhmerLinksEnabled) return false

  const target = e.target as HTMLElement

  // Find the closest Khmer word span
  const navigateSpan = target.closest('[data-navigate-khmer-word]') as HTMLElement | null

  if (navigateSpan) {
    const rawWord = navigateSpan.getAttribute('data-navigate-khmer-word')
    const word = rawWord ? String_toNonEmptyString_orUndefined_afterTrim(rawWord) : undefined

    if (word) {
      e.preventDefault()
      e.stopPropagation() // Prevent bubbling
      onNavigate(word, 'km')

      return true
    }
  }

  return false
}

/**
 * Hook to get the common CSS classes and enabled state for Khmer content.
 */
export const useKhmerContentStyles = () => {
  const { isKhmerLinksEnabled } = useSettings()

  const interactive = isKhmerLinksEnabled ? srghma_khmer_dict_content_styles.interactive : ''
  const khmerContentClass = `${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${interactive}`

  return {
    isKhmerLinksEnabled,
    khmerContentClass,
  }
}

export const useKhmerClickListener = (
  ref: React.RefObject<HTMLElement | null>,
  isKhmerLinksEnabled: boolean,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
) => {
  useEffect(() => {
    const el = ref.current

    if (!el) return

    const handleClick = (e: MouseEvent) => {
      tryHandleKhmerWordClick(e, isKhmerLinksEnabled, onNavigate)
    }

    el.addEventListener('click', handleClick)

    return () => el.removeEventListener('click', handleClick)
  }, [ref, isKhmerLinksEnabled, onNavigate])
}
