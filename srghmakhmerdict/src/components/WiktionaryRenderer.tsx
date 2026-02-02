import {
  type NonEmptyStringTrimmed,
  String_toNonEmptyString_orUndefined_afterTrim,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { type DictionaryLanguage } from '../types'
import styles from './WiktionaryRenderer.module.css'
import { useToast } from '../providers/ToastProvider'
import { extractWikiTerm, detectModeFromText } from '../utils/rendererUtils'
import type { KhmerWordsMap } from '../db/dict'
import { colorizeHtml } from '../utils/text-processing/html'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'

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

      // 1. Standard Wiki Links: /wiki/Word
      if (href.startsWith('/wiki/')) {
        e.preventDefault()
        const term = extractWikiTerm(href)

        // extractWikiTerm usually returns a string, but let's be safe and trim/validate
        const cleanTerm = term ? String_toNonEmptyString_orUndefined_afterTrim(term) : undefined

        if (cleanTerm) {
          const nextMode = detectModeFromText(cleanTerm, currentMode)

          onNavigate(cleanTerm, nextMode)
        } else {
          toast.error('Invalid Link', 'Could not parse wiki link')
        }

        return
      }

      // 2. Query Style Links (Redlinks, Edit): /w/index.php?title=Word...
      if (href.startsWith('/w/index.php')) {
        e.preventDefault()
        let term: string | null = null

        try {
          // Use a dummy base to allow parsing relative URLs
          const url = new URL(href, 'http://dummy.base')

          term = url.searchParams.get('title')
        } catch (err: any) {
          toast.warn('Failed to parse wiki query link', err.message)
        }

        const cleanTerm = term ? String_toNonEmptyString_orUndefined_afterTrim(term) : undefined

        if (cleanTerm) {
          const nextMode = detectModeFromText(cleanTerm, currentMode)

          onNavigate(cleanTerm, nextMode)
        } else {
          // If we can't extract a title, it might be a special page or history link.
          // In a dictionary viewer, these are usually dead ends.
          toast.error('Invalid Link', 'Could not resolve word from link')
        }

        return
      }

      // 3. External / Other Links
      target.setAttribute('target', '_blank')
      target.setAttribute('rel', 'noopener noreferrer')
    }

    container.addEventListener('click', handleLinkClick)

    return () => container.removeEventListener('click', handleLinkClick)
  }, [htmlContent, onNavigate, currentMode, toast])
}

export const WiktionaryRenderer = ({
  html,
  onNavigate,
  currentMode,
  km_map,
  colorMode,
}: {
  html: NonEmptyStringTrimmed
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
  currentMode: DictionaryLanguage
  km_map: KhmerWordsMap | undefined
  colorMode: MaybeColorizationMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Custom Hook: Handle link clicks
  useWikiLinkInterception(containerRef, onNavigate, currentMode, html)

  // Utility: Process HTML string
  const __html = useMemo(() => {
    if (colorMode === 'none' || !km_map) return { __html: html }

    return { __html: colorizeHtml(html, colorMode, km_map) }
  }, [html, colorMode, km_map])

  return (
    <>
      <div dangerouslySetInnerHTML={__html} ref={containerRef} className={styles.wikiScope} />
    </>
  )
}
