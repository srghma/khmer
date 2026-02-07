import { useState, useMemo } from 'react'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useMaybeGenerateTextSegments } from '../../hooks/useMaybeGenerateTextSegments'
import { useKhmerDefinitions } from '../../hooks/useKhmerDefinitions'
import { segmentsToUniqueKhmerWords, type TextSegment } from '../../utils/text-processing/text'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import {
  NonEmptySet_union_maybeUndefined_onCollisionIgnore,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { enhanceSegments, type TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'

export const useKhmerAnalysis = (
  initialText: NonEmptyStringTrimmed,
  initialText_language_fallback: DictionaryLanguage,
  km_map: KhmerWordsMap,
) => {
  const [analyzedText, setAnalyzedText] = useState<string>(initialText)

  const analyzedText_nonEmptyTrimmed = useMemo(
    () => String_toNonEmptyString_orUndefined_afterTrim(analyzedText),
    [analyzedText],
  )

  const detectedMode = useMemo(
    () =>
      analyzedText_nonEmptyTrimmed
        ? (detectModeFromText(analyzedText_nonEmptyTrimmed) ?? initialText_language_fallback)
        : initialText_language_fallback,
    [analyzedText_nonEmptyTrimmed, initialText_language_fallback],
  )

  const analyzedText_undefinedUnlessNonEmptyAndContainsKhmer = useMemo(
    () => (analyzedText_nonEmptyTrimmed ? strToContainsKhmerOrUndefined(analyzedText_nonEmptyTrimmed) : undefined),
    [analyzedText_nonEmptyTrimmed],
  )

  // 1. Get basic segments for both modes
  const segmentsIntlRaw: NonEmptyArray<TextSegment> | undefined = useMaybeGenerateTextSegments(
    analyzedText_undefinedUnlessNonEmptyAndContainsKhmer,
    'segmenter',
    km_map,
  )
  const segmentsDictRaw: NonEmptyArray<TextSegment> | undefined = useMaybeGenerateTextSegments(
    analyzedText_undefinedUnlessNonEmptyAndContainsKhmer,
    'dictionary',
    km_map,
  )

  const segmentsDictRawKhmerWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => (segmentsIntlRaw ? segmentsToUniqueKhmerWords(segmentsIntlRaw) : undefined),
    [segmentsIntlRaw],
  )
  const segmentsIntlRawKhmerWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => (segmentsDictRaw ? segmentsToUniqueKhmerWords(segmentsDictRaw) : undefined),
    [segmentsDictRaw],
  )

  // 2. Extract unique Khmer words to fetch definitions
  const uniqueWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => NonEmptySet_union_maybeUndefined_onCollisionIgnore(segmentsIntlRawKhmerWords, segmentsDictRawKhmerWords),
    [segmentsIntlRawKhmerWords, segmentsDictRawKhmerWords],
  )

  // 3. Fetch definitions
  const defsResult = useKhmerDefinitions(uniqueWords)

  const segmentsIntlEnhanced = useMemo(
    () =>
      defsResult.t === 'success' && segmentsIntlRaw
        ? enhanceSegments(segmentsIntlRaw, defsResult.definitions)
        : undefined,
    [segmentsIntlRaw, defsResult],
  )

  const segmentsDictEnhanced = useMemo(
    () =>
      defsResult.t === 'success' && segmentsDictRaw
        ? enhanceSegments(segmentsDictRaw, defsResult.definitions)
        : undefined,
    [segmentsDictRaw, defsResult],
  )

  // Use enhanced segments if available, otherwise fall back to raw
  const segmentsDict: NonEmptyArray<TextSegment | TextSegmentEnhanced> | undefined =
    segmentsDictEnhanced ?? segmentsDictRaw
  const segmentsIntl: NonEmptyArray<TextSegment | TextSegmentEnhanced> | undefined =
    segmentsIntlEnhanced ?? segmentsIntlRaw

  return {
    analyzedText,
    analyzedText_nonEmptyTrimmed,
    setAnalyzedText,
    detectedMode,
    analyzedText_undefinedUnlessNonEmptyAndContainsKhmer,
    defsResult,
    segmentsDict,
    segmentsIntl,
  }
}
