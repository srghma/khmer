import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'
import { useEffect } from 'react'
import { memoizeSync3_Booleans } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import {
  strToKhmerWordOrThrow,
  type TypedKhmerWord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

/**
 * Tries to handle a click on a word (Khmer or Non-Khmer).
 */
export const tryHandleKhmerAndNonKhmerWordClick = (
  e: MouseEvent,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined,
  isKhmerWordsHidingEnabled: boolean,
  isNonKhmerWordsHidingEnabled: boolean,
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

    if (isKhmerLinksEnabled_ifTrue_passOnNavigateKm) {
      const rawWord = khmerSpan.getAttribute('data-navigate-khmer-word')
      const word = rawWord ? strToKhmerWordOrThrow(nonEmptyString_afterTrim(rawWord)) : undefined // if fails - then there is mistake in parser logic

      if (word) {
        e.preventDefault()
        e.stopPropagation()
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm(word)

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

  // 3. Check for Khmer Image Wrapper (Hiding Only)
  const khmerImageWrapper = target.closest('.khmer--image-wrapper') as HTMLElement | null

  if (khmerImageWrapper) {
    if (isKhmerWordsHidingEnabled) {
      const isRevealed = khmerImageWrapper.classList.contains('is-revealed')

      if (!isRevealed) {
        e.preventDefault()
        e.stopPropagation()
        khmerImageWrapper.classList.add('is-revealed')

        return true
      }
    }
  }

  return false
}

export const calculateKhmerAndNonKhmerContentStyles = memoizeSync3_Booleans(
  (isKhmerLinksEnabled: boolean, isKhmerWordsHidingEnabled: boolean, isNonKhmerWordsHidingEnabled: boolean) => {
    const classes = [
      srghma_khmer_dict_content_styles.srghma_khmer_dict_content,
      isKhmerLinksEnabled && srghma_khmer_dict_content_styles.interactive,
      isKhmerWordsHidingEnabled && srghma_khmer_dict_content_styles.hiding_enabled,
      isNonKhmerWordsHidingEnabled && srghma_khmer_dict_content_styles.hiding_non_khmer_enabled,
    ]

    return classes.filter(Boolean).join(' ')
  },
)

/**
 * Extended click listener that tries Khmer/non-Khmer handling first,
 * then falls back to custom logic if not handled.
 */
export const useKhmerAndNonKhmerClickListener = (
  ref: React.RefObject<HTMLElement | null>,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined,
  isKhmerWordsHidingEnabled: boolean,
  isNonKhmerWordsHidingEnabled: boolean,
  fallbackHandler?: (e: MouseEvent) => void | Promise<void>,
) => {
  useEffect(() => {
    const el = ref.current

    if (!el) return

    const handleClick = async (e: MouseEvent) => {
      const handled = tryHandleKhmerAndNonKhmerWordClick(
        e,
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
        isKhmerWordsHidingEnabled,
        isNonKhmerWordsHidingEnabled,
      )

      if (!handled && fallbackHandler) {
        await fallbackHandler(e)
      }
    }

    el.addEventListener('click', handleClick)

    return () => el.removeEventListener('click', handleClick)
  }, [
    ref,
    fallbackHandler,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  ])
}
