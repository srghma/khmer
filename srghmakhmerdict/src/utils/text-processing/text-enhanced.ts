import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  type NonEmptyArray,
  Array_toNonEmptyArray_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyString } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TextSegment } from './text'

export type TextSegmentEnhanced =
  | {
      t: 'khmer'
      words: NonEmptyArray<{ w: TypedKhmerWord; def?: NonEmptyStringTrimmed }>
    }
  | { t: 'notKhmer'; v: NonEmptyString }

// --- Helper: Enhance Segments ---

export const enhanceSegments = (
  segments: NonEmptyArray<TextSegment>,
  definitions: Record<TypedKhmerWord, NonEmptyStringTrimmed>,
): NonEmptyArray<TextSegmentEnhanced> => {
  return Array_toNonEmptyArray_orThrow(
    segments.map(seg => {
      if (seg.t === 'notKhmer') {
        return seg
      }

      const enhancedWords = Array_toNonEmptyArray_orThrow(
        seg.words.map(w => ({
          w,
          def: definitions[w],
        })),
      )

      return { t: 'khmer', words: enhancedWords }
    }),
  )
}
