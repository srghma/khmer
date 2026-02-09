import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  type NonEmptyArray,
  Array_toNonEmptyArray_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyString } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TextSegment } from './text'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

export type TextSegmentEnhancedKhmerWord = { w: TypedKhmerWord; def: NonEmptyStringTrimmed }
export type TextSegmentEnhanced =
  | { t: 'khmer'; words: NonEmptyArray<TypedKhmerWord | TextSegmentEnhancedKhmerWord> }
  | { t: 'notKhmer'; v: NonEmptyStringTrimmed }
  | { t: 'whitespace'; v: NonEmptyString }

// --- Helper: Enhance Segments ---

export const enhanceSegments = (
  segments: NonEmptyArray<TextSegment>,
  definitions: NonEmptyRecord<TypedKhmerWord, NonEmptyStringTrimmed | null>,
): NonEmptyArray<TextSegmentEnhanced> => {
  return Array_toNonEmptyArray_orThrow(
    segments.map((seg): TextSegmentEnhanced => {
      // 1. Pass through non-Khmer content (notKhmer and whitespace)
      if (seg.t !== 'khmer') return seg

      // 2. Process Khmer words: Enhance only if a definition exists
      const enhancedWords = Array_toNonEmptyArray_orThrow(
        seg.words.map((w): TypedKhmerWord | TextSegmentEnhancedKhmerWord => {
          const def = definitions[w]

          // If we have a non-null definition, return the enhanced object
          if (def) return { w, def }

          // Otherwise, return the raw TypedKhmerWord to satisfy the union
          return w
        }),
      )

      return { t: 'khmer', words: enhancedWords }
    }),
  )
}
