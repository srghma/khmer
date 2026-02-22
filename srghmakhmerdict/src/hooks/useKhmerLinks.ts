import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import srghma_khmer_dict_content_styles from '../srghma_khmer_dict_content.module.css'
import { useEffect } from 'react'
import { useShortDefinitionPopover } from '../providers/ShortDefinitionPopoverProvider'
import { useFillInTheBlankModal } from '../providers/FillInTheBlankModalProvider'
import type { WordsHidingMode } from '../providers/SettingsProvider'

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
  khmerWordsHidingMode: WordsHidingMode,
  nonKhmerWordsHidingMode: WordsHidingMode,
  showModal: (rawWord: NonEmptyStringTrimmed) => void,
): boolean => {
  const target = e.target as HTMLElement

  // 1. Check for Khmer Word
  const khmerSpan = target.closest('[data-navigate-khmer-word]') as HTMLElement | null

  if (khmerSpan) {
    if (khmerWordsHidingMode !== 'disabled') {
      const isBlueLabel = khmerSpan.classList.contains('khmer--blue-lbl')
      const isRevealed = khmerSpan.classList.contains('is-revealed')

      if (!isBlueLabel && !isRevealed) {
        e.preventDefault()
        e.stopPropagation()

        if (khmerWordsHidingMode === 'on_click_open_fill_in_the_blank_game_modal') {
          const rawWord = khmerSpan.getAttribute('data-navigate-khmer-word')

          if (rawWord) {
            showModal(nonEmptyString_afterTrim(rawWord))
          }
        } else {
          khmerSpan.classList.add('is-revealed')
        }

        return true
      }
    }

    if (isKhmerLinksEnabled_ifTrue_passOnNavigateKm) {
      const rawWord = khmerSpan.getAttribute('data-navigate-khmer-word')
      const word = rawWord ? strToKhmerWordOrThrow(nonEmptyString_afterTrim(rawWord)) : undefined

      if (word) {
        // If they clicked the short definition box specifically, we shouldn't navigate
        // We'll let the provider popover handle it, which is done within useKhmerAndNonKhmerClickListener
        const shortDefSpan = target.closest('.short-def-preview') as HTMLElement | null

        if (shortDefSpan) {
          // Handled separately below if showPopover is provided, but we still prevent default here so it doesn't navigate
          return false
        }

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
    if (nonKhmerWordsHidingMode !== 'disabled') {
      const isRevealed = nonKhmerSpan.classList.contains('is-revealed')

      if (!isRevealed) {
        e.preventDefault()
        e.stopPropagation()

        if (nonKhmerWordsHidingMode === 'on_click_open_fill_in_the_blank_game_modal') {
          const rawWord = nonKhmerSpan.getAttribute('data-non-khmer-text')

          if (rawWord) {
            showModal(nonEmptyString_afterTrim(rawWord))
          }
        } else {
          nonKhmerSpan.classList.add('is-revealed')
        }

        return true
      }
    }
  }

  // 3. Check for Khmer Image Wrapper (Hiding Only)
  const khmerImageWrapper = target.closest('.khmer--image-wrapper') as HTMLElement | null

  if (khmerImageWrapper) {
    if (khmerWordsHidingMode !== 'disabled') {
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

const calculateKhmerAndNonKhmerContentStyles_ = (
  isKhmerLinksEnabled: boolean,
  khmerWordsHidingMode: WordsHidingMode,
  nonKhmerWordsHidingMode: WordsHidingMode,
  isKhmerPronunciationHidingEnabled: boolean,
  isShowShortDetailAboutKhmerWordEnabled: boolean,
) => {
  const classes = [
    srghma_khmer_dict_content_styles.srghma_khmer_dict_content,
    isKhmerLinksEnabled && srghma_khmer_dict_content_styles.interactive,
    khmerWordsHidingMode !== 'disabled' && srghma_khmer_dict_content_styles.hiding_enabled,
    nonKhmerWordsHidingMode !== 'disabled' && srghma_khmer_dict_content_styles.hiding_non_khmer_enabled,
    isKhmerPronunciationHidingEnabled && srghma_khmer_dict_content_styles.hiding_pronunciations_enabled,
    isShowShortDetailAboutKhmerWordEnabled && srghma_khmer_dict_content_styles.show_short_details,
  ]

  return classes.filter(Boolean).join(' ')
}

export const calculateKhmerAndNonKhmerContentStyles = calculateKhmerAndNonKhmerContentStyles_

/**
 * Extended click listener that tries Khmer/non-Khmer handling first,
 * then falls back to custom logic if not handled.
 */
export const useKhmerAndNonKhmerClickListener = (
  ref: React.RefObject<HTMLElement | null>,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined,
  khmerWordsHidingMode: WordsHidingMode,
  nonKhmerWordsHidingMode: WordsHidingMode,
  isKhmerPronunciationHidingEnabled: boolean,
  fallbackHandler?: (e: MouseEvent) => void | Promise<void>,
) => {
  const { showPopover } = useShortDefinitionPopover()
  const { showModal } = useFillInTheBlankModal()

  useEffect(() => {
    const el = ref.current

    if (!el) return

    const handleClick = async (e: MouseEvent) => {
      const handled = tryHandleKhmerAndNonKhmerWordClick(
        e,
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
        khmerWordsHidingMode,
        nonKhmerWordsHidingMode,
        showModal,
      )

      if (handled) return

      // Handle Pronunciation reveal
      const ipaSpan = (e.target as HTMLElement).closest('.khmer--ipa') as HTMLElement | null

      if (ipaSpan && isKhmerPronunciationHidingEnabled) {
        if (!ipaSpan.classList.contains('is-revealed')) {
          e.preventDefault()
          e.stopPropagation()
          ipaSpan.classList.add('is-revealed')

          return
        }
      }

      // Handle Short Definition Popover
      const shortDefSpan = (e.target as HTMLElement).closest('.short-def-preview') as HTMLElement | null

      if (shortDefSpan) {
        const wordRaw = shortDefSpan.getAttribute('data-word')

        if (wordRaw) {
          e.preventDefault()
          e.stopPropagation()
          const word = strToKhmerWordOrThrow(nonEmptyString_afterTrim(wordRaw))

          showPopover(word, shortDefSpan)

          return
        }
      }

      if (fallbackHandler) {
        await fallbackHandler(e)
      }
    }

    el.addEventListener('click', handleClick)

    return () => el.removeEventListener('click', handleClick)
  }, [
    ref,
    fallbackHandler,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
    showPopover,
  ])
}
