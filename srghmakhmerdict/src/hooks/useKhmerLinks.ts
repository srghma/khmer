import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'
import { useEffect } from 'react'

/**
 * Tries to handle a click on a Khmer word.
 *
 * 1. If Hiding Mode is ON and word is hidden -> Reveal it (Modify DOM directly).
 * 2. If Hiding Mode is OFF or word is revealed -> Navigate.
 */
export const tryHandleKhmerWordClick = (
  e: MouseEvent,
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
): boolean => {
  const target = e.target as HTMLElement

  // Find the closest Khmer word span
  const navigateSpan = target.closest('[data-navigate-khmer-word]') as HTMLElement | null

  if (navigateSpan) {
    // --- Logic 1: Handle Hiding/Revealing ---
    if (isKhmerWordsHidingEnabled) {
      // Check if it is a targetable khmer word (exclude blue label if necessary,
      // though the CSS usually handles the visual part, we check class logic here too)
      const isBlueLabel = navigateSpan.classList.contains('khmer--blue-lbl')
      const isRevealed = navigateSpan.classList.contains('is-revealed')

      if (!isBlueLabel && !isRevealed) {
        // REVEAL ACTION
        e.preventDefault()
        e.stopPropagation()
        navigateSpan.classList.add('is-revealed')

        return true // Handled
      }
    }

    // --- Logic 2: Handle Navigation ---
    if (!isKhmerLinksEnabled) return false

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

export const useKhmerContentStyles = (isKhmerLinksEnabled: boolean, isKhmerWordsHidingEnabled: boolean) => {
  const interactive = isKhmerLinksEnabled ? srghma_khmer_dict_content_styles.interactive : ''
  const hiding = isKhmerWordsHidingEnabled ? srghma_khmer_dict_content_styles.hiding_enabled : ''

  const khmerContentClass = `${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${interactive} ${hiding}`

  return khmerContentClass
}

export const useKhmerClickListener = (
  ref: React.RefObject<HTMLElement | null>,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
) => {
  useEffect(() => {
    const el = ref.current

    if (!el) return

    const handleClick = (e: MouseEvent) => {
      tryHandleKhmerWordClick(e, isKhmerLinksEnabled, isKhmerWordsHidingEnabled, onNavigate)
    }

    el.addEventListener('click', handleClick)

    return () => el.removeEventListener('click', handleClick)
  }, [ref, isKhmerLinksEnabled, onNavigate])
}
