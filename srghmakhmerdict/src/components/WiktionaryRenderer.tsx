import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { type DictionaryLanguage } from '../types'
import styles from './WiktionaryRenderer.module.css'
import { useAppToast } from '../providers/ToastProvider'
import { detectModeFromText } from '../utils/detectModeFromText'
import type { KhmerWordsMap } from '../db/dict'
import { colorizeHtml } from '../utils/text-processing/html'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import { parseWikiHref } from '../utils/wikiLinkParser'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { tryHandleKhmerWordClick, useKhmerContentStyles } from '../hooks/useKhmerLinks'

export const useWiktionaryContent = (
  html: NonEmptyStringTrimmed,
  maybeColorMode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
) => {
  return useMemo(() => {
    if (maybeColorMode === 'none' || !km_map) return { __html: html }

    return { __html: colorizeHtml(html, maybeColorMode, km_map) }
  }, [html, maybeColorMode, km_map])
}

export const useWikiLinkInterception = (
  containerRef: RefObject<HTMLDivElement | null>,
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void,
  currentMode: DictionaryLanguage,
  htmlContent: NonEmptyStringTrimmed,
  isKhmerLinksEnabled: boolean,
  isKhmerWordsHidingEnabled: boolean,
) => {
  const toast = useAppToast()

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleLinkClick = (e: MouseEvent) => {
      // 1. Custom "Data Attribute" Links (Khmer Words) - Priority
      const handled = tryHandleKhmerWordClick(e, isKhmerLinksEnabled, isKhmerWordsHidingEnabled, onNavigate)

      if (handled) return

      // 2. Standard Wiki Links (only process if we didn't hit a khmer word above)
      const target = e.target as HTMLElement
      const targetAnchor = target.closest('a')

      if (!targetAnchor) return

      const href = targetAnchor.getAttribute('href')
      const result = parseWikiHref(href)

      switch (result.kind) {
        case 'internal': {
          e.preventDefault()
          const nextMode = detectModeFromText(result.term) ?? currentMode

          onNavigate(result.term, nextMode)
          break
        }
        case 'external': {
          targetAnchor.setAttribute('target', '_blank')
          targetAnchor.setAttribute('rel', 'noopener noreferrer')
          break
        }
        case 'invalid': {
          e.preventDefault()
          toast.error('Invalid Link', result.reason)
          break
        }
        case 'ignore':
          break
        default:
          assertNever(result)
      }
    }

    container.addEventListener('click', handleLinkClick)

    return () => container.removeEventListener('click', handleLinkClick)
  }, [htmlContent, onNavigate, currentMode, toast, isKhmerLinksEnabled])
}

interface WiktionaryRendererProps {
  html: NonEmptyStringTrimmed
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
  currentMode: DictionaryLanguage
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
  isKhmerLinksEnabled: boolean
  isKhmerWordsHidingEnabled: boolean
}

export const WiktionaryRenderer = ({
  html,
  onNavigate,
  currentMode,
  km_map,
  maybeColorMode,
  isKhmerLinksEnabled,
  isKhmerWordsHidingEnabled,
}: WiktionaryRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Process HTML (Colorization)
  const content = useWiktionaryContent(html, maybeColorMode, km_map)

  // 2. Attach Event Listeners (Navigation)
  useWikiLinkInterception(containerRef, onNavigate, currentMode, html, isKhmerLinksEnabled, isKhmerWordsHidingEnabled)

  const srghma_khmer_dict_content_styles = useKhmerContentStyles(isKhmerLinksEnabled, isKhmerWordsHidingEnabled)

  // 3. Dynamic Class for Interaction
  // contentStyles.interactive determines if hover effects are shown
  const className = `${styles.wikiScope} ${srghma_khmer_dict_content_styles}`

  return <div dangerouslySetInnerHTML={content} ref={containerRef} className={className} />
}
