import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { useEffect, useRef } from 'react'

// HeroUI Imports

import { type DictionaryLanguage } from '../types'
import { useToast } from '../providers/ToastProvider'

const WIKI_STYLES = `
  .wiki-scope {
    font-size: 0.925rem;
    line-height: 1.6;
    color: hsl(var(--heroui-foreground) / 0.9);
  }

  /* Headings: Match the app's 'sectionTitleClass' style */
  .wiki-scope h3, .wiki-scope h4 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: hsl(var(--heroui-default-400));
    border-bottom: 1px solid hsl(var(--heroui-divider));
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.25rem;
  }

  /* Hide the main language header (e.g., "Khmer") as it's redundant */
  .wiki-scope h2 {
    display: none;
  }

  /* Links */
  .wiki-scope a {
    color: hsl(var(--heroui-primary));
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
  }
  .wiki-scope a:hover {
    text-decoration: underline;
  }
  .wiki-scope a.new {
    color: hsl(var(--heroui-danger));
  }

  /* Lists */
  .wiki-scope ul, .wiki-scope ol {
    margin-left: 1.2rem;
    margin-bottom: 1rem;
    list-style-type: disc;
  }
  .wiki-scope ol {
    list-style-type: decimal;
  }
  .wiki-scope li {
    margin-bottom: 0.25rem;
  }

  /* Khmer Text Enhancement */
  .wiki-scope .Khmr, .wiki-scope [lang="km"] {
    font-family: 'Noto Serif Khmer', 'Battambang', system-ui;
    font-size: 1.1em;
    line-height: 1.8;
  }

  /* --- Tables (Pronunciation Box) Cleanup --- */

  /* Reset table spacing */
  .wiki-scope table {
    margin: 1rem 0;
    border-collapse: collapse;
    background: transparent !important;
    border: 1px solid hsl(var(--heroui-divider)) !important;
    border-radius: 0.5rem;
    overflow: hidden;
    font-size: 0.9em;
  }

  /* Override internal table borders and backgrounds */
  .wiki-scope td, .wiki-scope th {
    border: 1px solid hsl(var(--heroui-divider)) !important;
    padding: 0.5rem 0.75rem !important;
    background-color: transparent !important;
    vertical-align: middle;
  }

  /* Labels (left column of pronunciation) */
  .wiki-scope td:first-child {
    color: hsl(var(--heroui-default-500)) !important;
    background-color: hsl(var(--heroui-default-100) / 0.5) !important;
    font-weight: 600;
    width: 1%;
    white-space: nowrap;
    text-align: right;
  }

  /* Remove nested table weirdness often found in Wiktionary */
  .wiki-scope table table {
    border: none !important;
    margin: 0 !important;
  }
  .wiki-scope table table td {
    border: none !important;
    padding: 0 !important;
  }

  /* IPA / Pronunciation Styles - Updated Font Stack */
  .wiki-scope .IPA {
    font-family: 'Segoe UI', 'Lucida Sans Unicode', 'Arial Unicode MS', 'Gentium', sans-serif;
    color: hsl(var(--heroui-secondary));
  }

  /* Hide Edit buttons/sections if scraped */
  .wiki-scope .mw-editsection {
    display: none;
  }
`

/**
 * Helper to determine dictionary mode based on the script of the word.
 * This ensures clicking an English word in Khmer dictionary opens it in English mode.
 */
const detectModeFromText = (text: string, currentMode: DictionaryLanguage): DictionaryLanguage => {
  if (/\p{Script=Khmer}/u.test(text)) return 'km'
  if (/\p{Script=Cyrillic}/u.test(text)) return 'ru'
  // If explicitly Latin chars, usually English in this context
  if (/[a-zA-Z]/.test(text)) return 'en'

  return currentMode
}

/**
 * Specialized renderer for Wiktionary HTML to handle scoping and link behavior
 */
export const WiktionaryRenderer = ({
  html,
  onNavigate,
  currentMode,
}: {
  html: string
  onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
  currentMode: DictionaryLanguage
}) => {
  const toast = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleLinkClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement).closest('a')

      if (!target) return

      const href = target.getAttribute('href')

      if (!href) return

      // Intercept internal Wiki links
      if (href.startsWith('/wiki/')) {
        e.preventDefault()

        // Extract word: remove /wiki/ prefix and any anchor hash
        const rawPath = href.replace(/^\/wiki\//, '').split('#')[0] ?? ''

        try {
          const decoded = decodeURIComponent(rawPath)
          const validWord = String_toNonEmptyString_orUndefined_afterTrim(decoded)

          if (validWord) {
            const nextMode = detectModeFromText(validWord, currentMode)

            onNavigate(validWord, nextMode)
          }
        } catch (err: any) {
          toast.error('Failed to decode wiki link', err.message)
        }
      } else {
        // Force external links to open in new tab
        target.setAttribute('target', '_blank')
        target.setAttribute('rel', 'noopener noreferrer')
      }
    }

    container.addEventListener('click', handleLinkClick)

    return () => {
      container.removeEventListener('click', handleLinkClick)
    }
  }, [html, onNavigate, currentMode])

  return (
    <>
      <style>{WIKI_STYLES}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} ref={containerRef} className="wiki-scope" />
    </>
  )
}
