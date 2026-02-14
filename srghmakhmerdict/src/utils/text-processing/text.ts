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

import {
  type NonEmptySet,
  Set_toNonEmptySet_orUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

const HTML_DETECTION_REGEX = /<[a-z][\s\S]*>/i

const escapeHtml = (unsafe: NonEmptyString): NonEmptyString => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;') as NonEmptyString
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
 */
export function* yieldTextSegments(
  text: NonEmptyString,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): Generator<TextSegment> {
  // Capture Khmer blocks
  const rawParts = text.split(/(\p{Script=Khmer}+)/u)

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
      // Logic: Split by whitespace to separate content from formatting
      const subParts = part.split(/(\s+)/)

      for (const sub of subParts) {
        if (!sub) continue
        if (/^\s+$/.test(sub)) {
          // It's whitespace: yield as-is
          yield { t: 'whitespace', v: nonEmptyString(sub) }
        } else {
          // It's content: yield as Trimmed (e.g. "ые")
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

    for (const w of segment.words) {
      yield renderKhmerWordSpan(w, wordCounter.current, km_map.has(w))
      wordCounter.current++
    }
  }
}

// --- Public API ---

export const generateTextSegments = (
  text: NonEmptyString, // Accept full string (not pre-trimmed)
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyArray<TextSegment> => {
  if (HTML_DETECTION_REGEX.test(text)) {
    throw new Error(`Invalid input: HTML detected.`)
  }
  const safeText = escapeHtml(text)

  return Array_toNonEmptyArray_orThrow([...yieldTextSegments(safeText, mode, km_map)])
}

export const colorizeSegments_usingWordCounterRef = (
  segments: Iterable<TextSegment>,
  km_map: KhmerWordsMap,
  wordCounter: { current: number },
): NonEmptyString => {
  let result = ''

  for (const chunk of yieldColorizedChunks(segments, km_map, wordCounter)) {
    result += chunk
  }

  return nonEmptyString(result)
}

export const colorizeSegments = (segments: Iterable<TextSegment>, km_map: KhmerWordsMap): NonEmptyString => {
  return colorizeSegments_usingWordCounterRef(segments, km_map, { current: 0 })
}

export const colorizeText = (
  text: NonEmptyStringTrimmed,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyString => {
  const segments = yieldTextSegments(escapeHtml(text), mode, km_map)

  return colorizeSegments(segments, km_map)
}

export const colorizeText_allowUndefined = (
  text: NonEmptyStringTrimmed | undefined,
  mode: ColorizationMode,
  km_map: KhmerWordsMap,
): NonEmptyString | undefined => {
  return text ? colorizeText(text, mode, km_map) : undefined
}
