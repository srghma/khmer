import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { useMemo, useRef } from 'react'

// HeroUI Imports

import { type DictionaryLanguage } from '../types'
import { useWikiLinkInterception } from '../hooks/rendererHooks'
import styles from './WiktionaryRenderer.module.css'

export const WiktionaryRenderer = ({
  html,
  onNavigate,
  currentMode,
}: {
  html: string
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
  currentMode: DictionaryLanguage
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Custom Hook: Handle link clicks
  useWikiLinkInterception(containerRef, onNavigate, currentMode, html)

  // Utility: Process HTML string
  const __html = useMemo(() => {
    return { __html: html }
  }, [html])

  return (
    <>
      <div dangerouslySetInnerHTML={__html} ref={containerRef} className={styles.wikiScope} />
    </>
  )
}
