import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useCallback, useMemo, useRef } from 'react'
import { type DictionaryLanguage } from '../types'
import styles from './WiktionaryRenderer.module.css'
import { useAppToast } from '../providers/ToastProvider'
import { detectModeFromText } from '../utils/detectModeFromText'
import { colorizeHtml } from '../utils/text-processing/html'
import { parseWikiHref } from '../utils/wikiLinkParser'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../hooks/useKhmerLinks'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useSettings } from '../providers/SettingsProvider'
import { useDictionary } from '../providers/DictionaryProvider'

import { processHtmlForPronunciationHiding } from '../utils/text-processing/pronunciation'

export const useWiktionaryContent = (html: NonEmptyStringTrimmed, isKhmerPronunciationHidingEnabled: boolean) => {
  const { km_map } = useDictionary()
  const { maybeColorMode } = useSettings()

  return useMemo(() => {
    const html_withPronunciations = processHtmlForPronunciationHiding(
      html,
      isKhmerPronunciationHidingEnabled,
      'wiktionary',
    )

    return { __html: colorizeHtml(html_withPronunciations, maybeColorMode, km_map) }
  }, [html, maybeColorMode, km_map, isKhmerPronunciationHidingEnabled])
}

const useWikiLinkHandler = (
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
    | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
    | undefined,
  currentMode: DictionaryLanguage,
  toast: ReturnType<typeof useAppToast>,
) => {
  const { en, ru } = useDictionary()

  return useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const targetAnchor = target.closest('a')

      if (!targetAnchor) return

      const href = targetAnchor.getAttribute('href')

      if (!href) return

      const result = parseWikiHref(href)

      const processAsExternal = () => {
        const isRelativeLink = href.startsWith('/')
        const absoluteHref = isRelativeLink ? `https://en.wiktionary.org${href}` : href

        targetAnchor.setAttribute('href', absoluteHref)
        targetAnchor.setAttribute('target', '_blank')
        targetAnchor.setAttribute('rel', 'noopener noreferrer')
      }

      const processAsInternal = (
        isKhmerLinksEnabled_ifTrue_passOnNavigate_: (term: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void,
        term: NonEmptyStringTrimmed,
        mode: DictionaryLanguage,
      ) => {
        e.preventDefault()
        isKhmerLinksEnabled_ifTrue_passOnNavigate_(term, mode)
      }

      switch (result.kind) {
        case 'internal': {
          // TODO: we disable all links (instead of just clicks on colorized khmer word), maybe its bad (but in anki game we want to disable things that disable the game, so...)
          if (isKhmerLinksEnabled_ifTrue_passOnNavigate) {
            const nextMode = detectModeFromText(result.term) ?? currentMode

            switch (nextMode) {
              case 'km': {
                processAsInternal(isKhmerLinksEnabled_ifTrue_passOnNavigate, result.term, nextMode)
                break
              }
              case 'en': {
                if (en.has(result.term)) {
                  processAsInternal(isKhmerLinksEnabled_ifTrue_passOnNavigate, result.term, nextMode)
                } else {
                  processAsExternal()
                }
                break
              }
              case 'ru': {
                if (ru.has(result.term)) {
                  processAsInternal(isKhmerLinksEnabled_ifTrue_passOnNavigate, result.term, nextMode)
                } else {
                  processAsExternal()
                }
                break
              }
              default:
                assertNever(nextMode)
            }
          } else {
            processAsExternal()
          }
          break
        }
        case 'external': {
          processAsExternal()
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
    [isKhmerLinksEnabled_ifTrue_passOnNavigate, currentMode, toast, en, ru],
  )
}

interface WiktionaryRendererProps {
  html: NonEmptyStringTrimmed
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
  | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
  | undefined
  currentMode: DictionaryLanguage
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}

export const WiktionaryRenderer = ({
  html,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  isKhmerLinksEnabled_ifTrue_passOnNavigate,
  currentMode,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  isKhmerPronunciationHidingEnabled,
}: WiktionaryRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Process HTML (Colorization)
  const content = useWiktionaryContent(html, isKhmerPronunciationHidingEnabled)

  const toast = useAppToast()

  const wikiLinkHandler = useWikiLinkHandler(isKhmerLinksEnabled_ifTrue_passOnNavigate, currentMode, toast)

  useKhmerAndNonKhmerClickListener(
    containerRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
    wikiLinkHandler,
  )

  const srghma_khmer_dict_content_styles = calculateKhmerAndNonKhmerContentStyles(
    !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  // 3. Dynamic Class for Interaction
  // contentStyles.interactive determines if hover effects are shown
  const className = `${styles.wikiScope} ${srghma_khmer_dict_content_styles}`

  return <div dangerouslySetInnerHTML={content} ref={containerRef} className={className} />
}
