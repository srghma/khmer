import {
  khmerSentenceToWords_usingDictionary,
  khmerSentenceToWords_usingSegmenter,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer_segmentation'
import { isKhmerWord, type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'

import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import {
  nonEmptyString,
  type NonEmptyString,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string'
import { COLOR_PALETTE, type ColorizationMode } from './utils'

////////////////////////////////////////////////////////////////////////

const HTML_DETECTION_REGEX = /<[a-z][\s\S]*>/i

/**
 * Escapes unsafe HTML characters to ensure the text renders literally
 * before we inject our own <span> tags.
 */
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// --- New Types & Split Functions ---

export type TextSegment = { t: 'khmer'; words: NonEmptyArray<TypedKhmerWord> } | { t: 'notKhmer'; v: NonEmptyString }

/**
 * Function 1: Parsing / Generation
 * Splits text into segments and performs Khmer segmentation/lookup where applicable.
 */
export const generateTextSegments = (
  text: NonEmptyStringTrimmed,
  mode: 'segmenter' | 'dictionary',
  km_map: KhmerWordsMap,
): NonEmptyArray<TextSegment> => {
  // 1. Validation
  if (HTML_DETECTION_REGEX.test(text)) {
    throw new Error(
      `Invalid input for colorizeText: HTML tags detected. Use colorizeHtml instead. Input snippet: ${text.substring(0, 50)}...`,
    )
  }

  // 2. Escape HTML
  const safeText = escapeHtml(text)

  // 3. Split by Khmer blocks
  // Using capturing group () keeps the delimiters (Khmer parts) in the result array
  const rawParts = safeText.split(/([\p{Script=Khmer}]+)/u)

  const segments: TextSegment[] = []

  for (const part of rawParts) {
    if (!part) continue // Skip empty splits

    // Check if this part is a block of Khmer text
    if (isKhmerWord(part)) {
      const match = part as TypedKhmerWord
      const words: NonEmptyArray<TypedKhmerWord> =
        mode === 'segmenter'
          ? khmerSentenceToWords_usingSegmenter(match)
          : khmerSentenceToWords_usingDictionary(match, km_map)

      segments.push({ t: 'khmer', words })
    } else {
      // It's punctuation, spaces, or non-Khmer text
      segments.push({ t: 'notKhmer', v: nonEmptyString(part) })
    }
  }

  return Array_toNonEmptyArray_orThrow(segments)
}

/**
 * Function 2: Rendering / Colorizing
 * Takes the parsed segments and converts them into an HTML string with colors.
 */
export const colorizeSegments = (
  segments: NonEmptyArray<TextSegment>,
  mode: 'segmenter' | 'dictionary',
  km_map: KhmerWordsMap,
): NonEmptyStringTrimmed => {
  let wordCounter = 0

  const html = segments
    .map(segment => {
      // 1. Handle non-Khmer text
      if (segment.t === 'notKhmer') {
        return segment.v
      }

      // 2. Handle Khmer text (apply colors to words)
      return segment.words
        .map(w => {
          if (!w.trim()) return w // Preserve spaces without spans

          // A. Segmenter Mode
          if (mode === 'segmenter') {
            const color = COLOR_PALETTE[wordCounter % COLOR_PALETTE.length]

            wordCounter++

            return `<span style="color:${color};">${w}</span>`
          }

          // B. Dictionary Mode
          if (mode === 'dictionary' && km_map) {
            if (km_map.has(w)) {
              // Known word
              const color = COLOR_PALETTE[wordCounter % COLOR_PALETTE.length]

              wordCounter++

              return `<span style="color:${color};font-weight:500;">${w}</span>`
            } else {
              // Unknown word
              return `<span style="color:#ff5555; text-decoration: underline decoration-dotted;">${w}</span>`
            }
          }

          // Fallback (e.g. if mode switched to 'none' unexpectedly, though filtered earlier)
          return w
        })
        .join('')
    })
    .join('')

  return nonEmptyString_afterTrim(html)
}

// --- Main Export ---

export const colorizeText = (
  text: NonEmptyStringTrimmed,
  mode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyStringTrimmed => {
  if (mode === 'none' || !km_map) return text
  const segments = generateTextSegments(text, mode, km_map)

  return colorizeSegments(segments, mode, km_map)
}

export const colorizeText_allowUndefined = (
  text: NonEmptyStringTrimmed | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyStringTrimmed | undefined => {
  return text ? colorizeText(text, mode, km_map) : undefined
}
