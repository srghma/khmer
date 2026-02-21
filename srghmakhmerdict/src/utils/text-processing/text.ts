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
import { type MaybeColorizationMode } from './utils'
import { renderKhmerWordSpan, renderNonKhmerSpan } from './word-renderer'
import type { ShortDefinition } from '../../db/dict'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import {
  type NonEmptySet,
  Set_toNonEmptySet_orUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { isWordInKmMap } from '../isWordInKmMap'

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
 *
 *
 * if we are in "khmer analyzer" - user provides sentences, e.g. "latin khmer1khmer2 latin" - dictionaryMode_lonelyWordShouldBeSpilt should be false
 * if we are rendering header - it can be "khmer1" or "khmer1khmer2" or "khmer1khmer2 latin"
 */
export function* yieldTextSegments(
  text: NonEmptyString,
  mode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
  dictionaryMode_lonelyWordShouldBeSpilt: boolean,
): Generator<TextSegment> {
  // Capture Khmer blocks
  const rawParts = text.split(/(\p{Script=Khmer}+)/u)

  for (const part of rawParts) {
    if (!part) continue

    if (isKhmerWord(part)) {
      const match = part as TypedKhmerWord
      const words =
        mode === 'dictionary'
          ? khmerSentenceToWords_usingDictionary(
              match,
              dictionaryMode_lonelyWordShouldBeSpilt
                ? (s: TypedKhmerWord) => s !== match && isWordInKmMap(s, km_map)
                : (s: TypedKhmerWord) => isWordInKmMap(s, km_map),
            )
          : khmerSentenceToWords_usingSegmenter(match)

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
  mode: MaybeColorizationMode,
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined,
  excludeWord?: TypedKhmerWord,
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
      const shortDef = shortDefinitions?.[w]
      const extraInfo = shortDef
        ? {
            ipa: (shortDef as any).wiktionary_ipa_or_from_csv_pronunciations || undefined,
            def: shortDef.definition,
          }
        : undefined

      yield renderKhmerWordSpan(w, wordCounter.current, isWordInKmMap(w, km_map), mode, extraInfo, excludeWord)
      wordCounter.current++
    }
  }
}

// --- Public API ---

export const generateTextSegments = (
  text: NonEmptyString, // Accept full string (not pre-trimmed)
  mode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
  dictionaryMode_lonelyWordShouldBeSpilt: boolean,
): NonEmptyArray<TextSegment> => {
  if (HTML_DETECTION_REGEX.test(text)) {
    throw new Error(`Invalid input: HTML detected.`)
  }
  const safeText = escapeHtml(text)

  return Array_toNonEmptyArray_orThrow([
    ...yieldTextSegments(safeText, mode, km_map, dictionaryMode_lonelyWordShouldBeSpilt),
  ])
}

export const colorizeSegments_usingWordCounterRef = (
  segments: Iterable<TextSegment>,
  km_map: KhmerWordsMap,
  wordCounter: { current: number },
  mode: MaybeColorizationMode,
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined,
  excludeWord?: TypedKhmerWord,
): NonEmptyString => {
  let result = ''

  for (const chunk of yieldColorizedChunks(segments, km_map, wordCounter, mode, shortDefinitions, excludeWord)) {
    result += chunk
  }

  return nonEmptyString(result)
}

export const colorizeSegments = (
  segments: Iterable<TextSegment>,
  km_map: KhmerWordsMap,
  mode: MaybeColorizationMode,
  shortDefinitions?: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null>,
  excludeWord?: TypedKhmerWord,
): NonEmptyString => {
  return colorizeSegments_usingWordCounterRef(segments, km_map, { current: 0 }, mode, shortDefinitions, excludeWord)
}

export const colorizeText = (
  text: NonEmptyStringTrimmed,
  mode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
  dictionaryMode_lonelyWordShouldBeSpilt: boolean,
  shortDefinitions?: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null>,
  excludeWord?: TypedKhmerWord,
): NonEmptyString => {
  const segments = yieldTextSegments(escapeHtml(text), mode, km_map, dictionaryMode_lonelyWordShouldBeSpilt)

  return colorizeSegments(segments, km_map, mode, shortDefinitions, excludeWord)
}

export const colorizeText_allowUndefined = (
  text: NonEmptyStringTrimmed | undefined,
  mode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
  dictionaryMode_lonelyWordShouldBeSpilt: boolean,
  shortDefinitions?: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null>,
  excludeWord?: TypedKhmerWord,
): NonEmptyString | undefined => {
  return text
    ? colorizeText(text, mode, km_map, dictionaryMode_lonelyWordShouldBeSpilt, shortDefinitions, excludeWord)
    : undefined
}
