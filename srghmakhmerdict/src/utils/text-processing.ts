import {
  khmerSentenceToWords_usingDictionary,
  khmerSentenceToWords_usingSegmenter,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer_segmentation'
import { type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../db/dict'

export type ColorizationMode = 'none' | 'segmenter' | 'dictionary'

const COLOR_PALETTE = [
  '#569cd6', // Blue
  '#4ec9b0', // Soft Green
  '#c586c0', // Pink/Purple
  '#dcdcaa', // Soft Yellow
  '#ce9178', // Orange
]

/**
 * Pure function to colorize Khmer text within HTML strings.
 * Safely handles HTML tags by parsing the DOM and only modifying text nodes.
 */
export const colorizeHtml = (
  html: NonEmptyStringTrimmed | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyStringTrimmed | undefined => {
  if (!html) return undefined
  if (mode === 'none') return html as NonEmptyStringTrimmed
  // If we need dictionary mode but don't have the dictionary yet, return original
  if (mode === 'dictionary' && !km_map) return html as NonEmptyStringTrimmed

  // 1. Create a temporary container to parse the HTML
  // Note: In a Node.js/SSR environment, this would require JSDOM.
  // In Tauri/Browser, `document` is available.
  const tempDiv = document.createElement('div')

  tempDiv.innerHTML = html

  // 2. Global state for color cycling across different text nodes
  let wordCounter = 0

  // 3. Recursive function to traverse and process Text Nodes only
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.nodeValue

      // Only process if the text actually contains Khmer characters
      if (textContent && /[\p{Script=Khmer}]/u.test(textContent)) {
        // Use the replace logic on the text content
        const newHtml = textContent.replace(/[\p{Script=Khmer}]+/gu, match_ => {
          const match = match_ as TypedKhmerWord
          let words: TypedKhmerWord[] = []

          if (mode === 'segmenter') {
            words = khmerSentenceToWords_usingSegmenter(match)
          } else if (mode === 'dictionary' && km_map) {
            words = khmerSentenceToWords_usingDictionary(match, km_map)
          }

          return words
            .map(w => {
              const trimmed = w.trim()

              if (!trimmed) return w // Preserve spaces

              if (mode === 'segmenter') {
                const color = COLOR_PALETTE[wordCounter % COLOR_PALETTE.length]

                wordCounter++

                return `<span style="color:${color};">${w}</span>`
              }

              if (mode === 'dictionary' && km_map) {
                if (km_map.has(w)) {
                  const color = COLOR_PALETTE[wordCounter % COLOR_PALETTE.length]

                  wordCounter++

                  return `<span style="color:${color};font-weight:500;">${w}</span>`
                }

                // Unknown word
                return `<span style="color:#ff5555; text-decoration: underline decoration-dotted;">${w}</span>`
              }

              return w
            })
            .join('')
        })

        // If changes were made, replace the text node with HTML elements
        if (newHtml !== textContent) {
          const wrapper = document.createElement('span')

          wrapper.innerHTML = newHtml

          // Replace the single text node with the new nodes (unwrapping the temporary span)
          // We use replaceWith with the spread operator on childNodes to avoid adding extra spans
          if (node.parentNode) {
            // Convert NodeList to Array to avoid live collection issues during insertion
            const newNodes = Array.from(wrapper.childNodes)

            // @ts-expect-error - replaceWith is standard on CharacterData (TextNode)
            node.replaceWith(...newNodes)
          }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Don't traverse inside <script> or <style> tags
      const tagName = (node as Element).tagName.toLowerCase()

      if (tagName !== 'script' && tagName !== 'style') {
        // Convert childNodes to array to safely iterate even if DOM changes
        Array.from(node.childNodes).forEach(processNode)
      }
    }
  }

  // 4. Start processing
  Array.from(tempDiv.childNodes).forEach(processNode)

  // 5. Return the serialized HTML
  return nonEmptyString_afterTrim(tempDiv.innerHTML)
}
