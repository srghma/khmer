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
import { type ColorizationMode } from './utils'
import { renderKhmerWordSpan, renderNonKhmerSpan } from './word-renderer'

import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  type NonEmptySet,
  Set_toNonEmptySet_orUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

const HTML_DETECTION_REGEX = /<[a-z][\s\S]*>/i

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export type TextSegment =
  | { t: 'khmer'; words: NonEmptyArray<TypedKhmerWord> }
  | { t: 'notKhmer'; v: NonEmptyStringTrimmed }
  | { t: 'whitespace'; v: NonEmptyString }

/**
 * GENERATOR: Yields Khmer words from an iterable of segments.
 */
export function* yieldUniqueKhmerWords(segments: Iterable<TextSegment>): Generator<TypedKhmerWord> {
  for (const seg of segments) {
    if (seg.t === 'khmer') {
      for (const w of seg.words) {
        yield w
      }
    }
  }
}

/**
 * Consumes the generator to maintain backward compatibility if needed,
 * though we will prefer the generator directly in Phase 2.
 */
export const segmentsToUniqueKhmerWords = (
  segments: Iterable<TextSegment>,
): NonEmptySet<TypedKhmerWord> | undefined => {
  const uniqueWords = new Set<TypedKhmerWord>()

  for (const w of yieldUniqueKhmerWords(segments)) {
    uniqueWords.add(w)
  }

  return Set_toNonEmptySet_orUndefined(uniqueWords)
}

/**
 * GENERATOR: Yields segments one by one.
 * Replaces the imperative loop and intermediate array pushes.
 */
export function* yieldTextSegments(
  text: string,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): Generator<TextSegment> {
  // Using capture group to keep delimiters (Khmer blocks)
  const rawParts = text.split(/([\p{Script=Khmer}]+)/u)

  for (const part of rawParts) {
    if (!part) continue

    if (isKhmerWord(part)) {
      const match = part as TypedKhmerWord
      const words =
        mode === 'segmenter'
          ? khmerSentenceToWords_usingSegmenter(match)
          : khmerSentenceToWords_usingDictionary(match, (s: TypedKhmerWord) => s !== match && km_map.has(s))

      yield { t: 'khmer', words }
    } else {
      // Handle punctuation and whitespace
      const subParts = part.split(/(\s+)/)

      for (const sub of subParts) {
        if (!sub) continue
        if (/^\s+$/.test(sub)) {
          yield { t: 'whitespace', v: nonEmptyString(sub) }
        } else {
          yield { t: 'notKhmer', v: nonEmptyString_afterTrim(sub) }
        }
      }
    }
  }
}

/**
 * GENERATOR: Yields rendered HTML strings for each segment.
 */
export function* yieldColorizedChunks(
  segments: Iterable<TextSegment>,
  km_map: KhmerWordsMap,
  wordCounter: { current: number },
): Generator<NonEmptyString> {
  for (const segment of segments) {
    if (segment.t === 'whitespace') {
      yield segment.v
      continue
    }

    if (segment.t === 'notKhmer') {
      yield renderNonKhmerSpan(segment.v)
      continue
    }

    // Process Khmer words
    for (const w of segment.words) {
      yield renderKhmerWordSpan(w, wordCounter.current, km_map.has(w))
      wordCounter.current++
    }
  }
}

// --- Public API (Consuming the Generators) ---

export const generateTextSegments = (
  text: NonEmptyStringTrimmed,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyArray<TextSegment> => {
  if (HTML_DETECTION_REGEX.test(text)) {
    throw new Error(`Invalid input: HTML detected.`)
  }
  const safeText = escapeHtml(text)

  // Consume the generator into an array
  return Array_toNonEmptyArray_orThrow([...yieldTextSegments(safeText, mode, km_map)])
}

export const colorizeSegments_usingWordCounterRef = (
  segments: Iterable<TextSegment>,
  km_map: KhmerWordsMap,
  wordCounter: { current: number },
): NonEmptyStringTrimmed => {
  let result = ''

  // Use a simple loop to build the string without intermediate map arrays
  for (const chunk of yieldColorizedChunks(segments, km_map, wordCounter)) {
    result += chunk
  }

  return nonEmptyString_afterTrim(result)
}

export const colorizeSegments = (segments: Iterable<TextSegment>, km_map: KhmerWordsMap): NonEmptyStringTrimmed => {
  return colorizeSegments_usingWordCounterRef(segments, km_map, { current: 0 })
}

export const colorizeText = (
  text: TypedContainsKhmer,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyStringTrimmed => {
  // Chain: input -> segment generator -> colorize helper
  const segments = yieldTextSegments(escapeHtml(text), mode, km_map)

  return colorizeSegments(segments, km_map)
}

export const colorizeText_allowUndefined = (
  text: TypedContainsKhmer | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyStringTrimmed | undefined => {
  return text ? colorizeText(text, mode, km_map) : undefined
}
