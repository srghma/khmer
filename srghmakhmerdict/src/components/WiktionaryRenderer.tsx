import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useCallback, useMemo, useRef } from 'react'
import { type DictionaryLanguage } from '../types'
import styles from './WiktionaryRenderer.module.css'
import { useAppToast } from '../providers/ToastProvider'
import { detectModeFromText } from '../utils/detectModeFromText'
import type { KhmerWordsMap } from '../db/dict'
import { colorizeHtml } from '../utils/text-processing/html'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import { parseWikiHref } from '../utils/wikiLinkParser'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../hooks/useKhmerLinks'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

export const useWiktionaryContent = (
  html: NonEmptyStringTrimmed,
  maybeColorMode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
) => {
  return useMemo(() => {
    if (maybeColorMode === 'none') return { __html: html }

    if (!isContainsKhmer(html)) return { __html: html }

    return { __html: colorizeHtml(html, maybeColorMode, km_map) }
  }, [html, maybeColorMode, km_map])
}

const useWikiLinkHandler = (
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
    | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
    | undefined,
  currentMode: DictionaryLanguage,
  toast: ReturnType<typeof useAppToast>,
) => {
  return useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const targetAnchor = target.closest('a')

      if (!targetAnchor) return

      const href = targetAnchor.getAttribute('href')
      const result = parseWikiHref(href)

      switch (result.kind) {
        case 'internal': {
          // TODO: we disable all links (instead of just clicks on colorized khmer word), maybe its bad (but in anki game we want to disable things that disable the game, so...)
          if (isKhmerLinksEnabled_ifTrue_passOnNavigate) {
            e.preventDefault()
            const nextMode = detectModeFromText(result.term) ?? currentMode

            isKhmerLinksEnabled_ifTrue_passOnNavigate?.(result.term, nextMode)
          } else {
            targetAnchor.setAttribute('target', '_blank')
            targetAnchor.setAttribute('rel', 'noopener noreferrer')
          }
          break
        }
        case 'external': {
          targetAnchor.setAttribute('target', '_blank')
          targetAnchor.setAttribute('rel', 'noopener noreferrer')
          break
        }
        case 'invalid': {
          e.preventDefault()
          toast.error(result.reason, unknown_to_errorMessage(result.e))
          break
        }
        case 'ignore':
          break
        default:
          assertNever(result)
      }
    },
    [isKhmerLinksEnabled_ifTrue_passOnNavigate, currentMode, toast],
  )
}

interface WiktionaryRendererProps {
  html: NonEmptyStringTrimmed
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
    | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
    | undefined
  currentMode: DictionaryLanguage
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
}

export const WiktionaryRenderer = ({
  html,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  isKhmerLinksEnabled_ifTrue_passOnNavigate,
  currentMode,
  km_map,
  maybeColorMode,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
}: WiktionaryRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Process HTML (Colorization)
  const content = useWiktionaryContent(html, maybeColorMode, km_map)

  const toast = useAppToast()

  const wikiLinkHandler = useWikiLinkHandler(isKhmerLinksEnabled_ifTrue_passOnNavigate, currentMode, toast)

  useKhmerAndNonKhmerClickListener(
    containerRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    wikiLinkHandler,
  )

  const srghma_khmer_dict_content_styles = calculateKhmerAndNonKhmerContentStyles(
    !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  )

  // 3. Dynamic Class for Interaction
  // contentStyles.interactive determines if hover effects are shown
  const className = `${styles.wikiScope} ${srghma_khmer_dict_content_styles}`

  return <div dangerouslySetInnerHTML={content} ref={containerRef} className={className} />
}
