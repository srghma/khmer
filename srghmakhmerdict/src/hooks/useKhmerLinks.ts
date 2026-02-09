import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'
import { useEffect } from 'react'

/**
 * Tries to handle a click on a word (Khmer or Non-Khmer).
 */
export const tryHandleKhmerAndNonKhmerWordClick = (
  e: MouseEvent,
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
  isNonKhmerWordsHidingEnabled: boolean,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
): boolean => {
  const target = e.target as HTMLElement

  // 1. Check for Khmer Word
  const khmerSpan = target.closest('[data-navigate-khmer-word]') as HTMLElement | null

  if (khmerSpan) {
    if (isKhmerWordsHidingEnabled) {
      const isBlueLabel = khmerSpan.classList.contains('khmer--blue-lbl')
      const isRevealed = khmerSpan.classList.contains('is-revealed')

      if (!isBlueLabel && !isRevealed) {
        e.preventDefault()
        e.stopPropagation()
        khmerSpan.classList.add('is-revealed')

        return true
      }
    }

    if (isKhmerLinksEnabled) {
      const rawWord = khmerSpan.getAttribute('data-navigate-khmer-word')
      const word = rawWord ? String_toNonEmptyString_orUndefined_afterTrim(rawWord) : undefined

      if (word) {
        e.preventDefault()
        e.stopPropagation()
        onNavigate(word, 'km')

        return true
      }
    }
  }

  // 2. Check for Non-Khmer Text (Hiding Only)
  const nonKhmerSpan = target.closest('[data-non-khmer-text]') as HTMLElement | null

  if (nonKhmerSpan) {
    if (isNonKhmerWordsHidingEnabled) {
      const isRevealed = nonKhmerSpan.classList.contains('is-revealed')

      if (!isRevealed) {
        e.preventDefault()
        e.stopPropagation()
        nonKhmerSpan.classList.add('is-revealed')

        return true
      }
    }
  }

  return false
}

export const useKhmerAndNonKhmerContentStyles = (
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
  isNonKhmerWordsHidingEnabled: boolean,
) => {
  const interactive = isKhmerLinksEnabled ? srghma_khmer_dict_content_styles.interactive : ''
  const hidingKhmer = isKhmerWordsHidingEnabled ? srghma_khmer_dict_content_styles.hiding_enabled : ''
  const hidingNonKhmer = isNonKhmerWordsHidingEnabled ? srghma_khmer_dict_content_styles.hiding_non_khmer_enabled : ''

  return `${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${interactive} ${hidingKhmer} ${hidingNonKhmer}`
}

export const useKhmerAndNonKhmerClickListener = (
  ref: React.RefObject<HTMLElement | null>,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
  isNonKhmerWordsHidingEnabled: boolean,
) => {
  useEffect(() => {
    const el = ref.current

    if (!el) return

    const handleClick = (e: MouseEvent) => {
      tryHandleKhmerAndNonKhmerWordClick(
        e,
        isKhmerLinksEnabled,
        isKhmerWordsHidingEnabled,
        isNonKhmerWordsHidingEnabled,
        onNavigate,
      )
    }

    el.addEventListener('click', handleClick)

    return () => el.removeEventListener('click', handleClick)
  }, [ref, isKhmerLinksEnabled, isKhmerWordsHidingEnabled, isNonKhmerWordsHidingEnabled, onNavigate])
}
