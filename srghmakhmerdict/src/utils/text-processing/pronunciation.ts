import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

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

  // Helper: Recursive function to wrap text nodes in a span
  const wrapTextNodes = (element: Node) => {
    // If text node and has content
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent || ''

      if (text.trim().length > 0) {
        const span = doc.createElement('span')

        span.className = 'khmer--ipa'
        span.textContent = text
        element.parentNode?.replaceChild(span, element)
      }

      return
    }

    // If element, recurse (unless it's already wrapped or a script/style)
    if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as HTMLElement

      if (
        el.classList.contains('khmer--ipa') ||
        ['SCRIPT', 'STYLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)
      ) {
        return
      }

      // Convert childNodes to array to safely iterate while modifying
      Array.from(el.childNodes).forEach(wrapTextNodes)
    }
  }

  // 1. Select all headers (Wiktionary usually uses h3 or h4 for sections)
  const headers = Array.from(doc.querySelectorAll('h3, h4, h5'))

  for (const header of headers) {
    const headerText = header.textContent?.trim().toLowerCase() || ''

    // 2. Check for "Произношение" (case-insensitive)
    if (headerText.includes('произношение')) {
      // 3. Determine the "row" or container.
      // In modern MediaWiki, <h3> is often inside <div class="mw-heading mw-heading3">
      let currentElement: Element | null = header.closest('.mw-heading')

      if (!currentElement) currentElement = header // Fallback for older structures

      // 4. Iterate over subsequent siblings until we hit the next section
      if (currentElement) {
        let sibling = currentElement.nextElementSibling

        while (sibling) {
          // Stop if we hit another header or a new heading div
          const isHeader = /^H[1-6]$/.test(sibling.tagName)
          const isHeadingDiv = sibling.classList.contains('mw-heading')

          if (isHeader || isHeadingDiv) {
            break
          }

          // 5. Wrap text inside this sibling (e.g., the <ul> containing the IPA)
          wrapTextNodes(sibling)

          sibling = sibling.nextElementSibling
        }
      }
    }
  }

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
