import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

const LATIN_CHAR_REGEX = /[A-Za-z\u00C0-\u017F\u0180-\u024F\u0300-\u036F\u02B0-\u02FF\u1E00-\u1EFF]/

/**
 * Wiktionary (En/Ru) specific pronunciation and transliteration wrapping.
 */
export const wrapWiktionaryPronunciations = (html: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 1. IPA spans
  doc.querySelectorAll('.IPA').forEach(el => {
    el.classList.add('khmer--ipa')
  })

  // 2. Transliterations and romanizations
  // Based on Wiktionary classes: .tr, .mention-tr, .headword-tr, .Latn
  // And language codes ending in -Latn
  doc.querySelectorAll('.tr, .mention-tr, .headword-tr, .Latn, [lang$="-Latn"]').forEach(el => {
    el.classList.add('khmer--ipa')
  })

  return doc.body.innerHTML
}

/**
 * Gorgoniev specific pronunciation wrapping (uses <pre>).
 */

export const wrapGorgonievPronunciations = (html: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc.querySelectorAll('span.ipa').forEach(el => {
    el.classList.add('khmer--ipa')
  })

  return doc.body.innerHTML
}

/**
 * Russian Wiki specific wrapping.
 * The user requested hiding "all english texts" as they are likely pronunciation clues.
 */
export const wrapRussianWikiPronunciations = (html: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Recursive function to find and wrap Latin-looking text nodes
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''

      if (LATIN_CHAR_REGEX.test(text) && text.trim().length > 0) {
        const span = doc.createElement('span')

        span.className = 'khmer--ipa'
        span.textContent = text
        node.parentNode?.replaceChild(span, node)
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      // Skip already processed or if it's a script/style
      if (el.classList.contains('khmer--ipa') || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return

      // If the element itself contains only Latin text and no children (besides text)
      // we might want to wrap it entirely if it's small, or just its text nodes.
      // Let's just process children for now.
      Array.from(el.childNodes).forEach(processNode)
    }
  }

  Array.from(doc.body.childNodes).forEach(processNode)

  return doc.body.innerHTML
}

export type PronunciationSource = 'wiktionary' | 'gorgoniev' | 'russian_wiki'

export const processHtmlForPronunciationHiding = (
  html: NonEmptyStringTrimmed,
  isEnabled: boolean,
  source: PronunciationSource,
): NonEmptyStringTrimmed => {
  if (!isEnabled) return html

  switch (source) {
    case 'wiktionary':
      return wrapWiktionaryPronunciations(html) as NonEmptyStringTrimmed

    case 'gorgoniev':
      return wrapGorgonievPronunciations(html) as NonEmptyStringTrimmed

    case 'russian_wiki':
      return wrapRussianWikiPronunciations(html) as NonEmptyStringTrimmed

    default: {
      assertNever(source)
    }
  }
}
