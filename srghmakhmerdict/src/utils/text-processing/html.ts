import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  khmerSentenceToWords_usingDictionary,
  khmerSentenceToWords_usingSegmenter,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer_segmentation'
import { type NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { replaceHtmlTextNodesWithMaybeOtherHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/replaceHtmlTextNodesWithMaybeOtherHtml'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { type ColorizationMode } from './utils'
import { renderKhmerWordSpan } from './word-renderer'

/**
 * Pure function to colorize Khmer text within HTML strings.
 * Safely handles HTML tags by parsing the DOM and only modifying text nodes.
 */
export const colorizeHtml = (
  html: NonEmptyStringTrimmed,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyStringTrimmed => {
  // Global state for color cycling across different text nodes
  let wordCounter = 0

  // 1. Process Text Nodes using the extracted helper
  let serializedHtml: NonEmptyStringTrimmed = replaceHtmlTextNodesWithMaybeOtherHtml(
    document.createElement('div'),
    html,
    (textContent: NonEmptyStringTrimmed): NonEmptyStringTrimmed => {
      // Only process if the text actually contains Khmer characters
      if (/\p{Script=Khmer}/u.test(textContent)) {
        return nonEmptyString_afterTrim(
          textContent.replace(/\p{Script=Khmer}+/gu, match_ => {
            const match = match_ as TypedKhmerWord
            const words: NonEmptyArray<TypedKhmerWord> =
              mode === 'segmenter'
                ? khmerSentenceToWords_usingSegmenter(match)
                : khmerSentenceToWords_usingDictionary(match, assertIsDefinedAndReturn(km_map))

            return words
              .map(w => {
                const htmlSegment = renderKhmerWordSpan(w, wordCounter, km_map.has(w))

                wordCounter++

                return htmlSegment
              })
              .join('')
          }),
        )
      }

      return textContent
    },
  )

  // 2. Post-processing: Replace legacy blue colors
  // (<font color="blue"> or #000099) with Tailwind class
  serializedHtml = serializedHtml.replace(
    /<font\s+color=["']?(?:blue|#000099)["']?>(.*?)<\/font>/gi,
    '<span class="khmer--blue-lbl">$1</span>',
  ) as NonEmptyStringTrimmed

  return serializedHtml
}

export const colorizeHtml_allowUndefined = (
  html: NonEmptyStringTrimmed | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyStringTrimmed | undefined => {
  return html ? colorizeHtml(html, mode, km_map) : undefined
}
