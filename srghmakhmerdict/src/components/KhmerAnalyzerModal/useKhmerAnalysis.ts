import { useMemo } from 'react'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict/index'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  strToContainsKhmerOrUndefined,
  type TypedContainsKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { useKhmerDefinitions } from '../../hooks/useKhmerDefinitions'
import { generateTextSegments, yieldUniqueKhmerWords, type TextSegment } from '../../utils/text-processing/text'
import { NonEmptySet_union_maybeUndefined_onCollisionIgnore_fromIterables } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { enhanceSegments, type TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

export const KhmerAnalysisResult__empty_text = { t: 'empty_text' } as const

export type KhmerAnalysisResult =
  | typeof KhmerAnalysisResult__empty_text
  | {
      t: 'non_empty_text_without_at_least_one_khmer_char'
      analyzedText: NonEmptyStringTrimmed
      analyzedText_language: DictionaryLanguage
    }
  | {
      t: 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading'
      analyzedText: TypedContainsKhmer
      analyzedText_language: 'km'
      segmentsDict: NonEmptyArray<TextSegment>
      segmentsIntl: NonEmptyArray<TextSegment>
    }
  | {
      t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored'
      analyzedText: TypedContainsKhmer
      analyzedText_language: 'km'
      segmentsDict: NonEmptyArray<TextSegment>
      segmentsIntl: NonEmptyArray<TextSegment>
      e: NonEmptyStringTrimmed | undefined
    }
  | {
      t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_success'
      analyzedText: TypedContainsKhmer
      analyzedText_language: 'km'
      segmentsDict: NonEmptyArray<TextSegmentEnhanced>
      segmentsIntl: NonEmptyArray<TextSegmentEnhanced>
    }

export const useKhmerAnalysis = (
  analyzedText: string,
  initialText_language_fallback: DictionaryLanguage,
  km_map: KhmerWordsMap,
): KhmerAnalysisResult => {
  const phase1 = useMemo(() => {
    const analyzedText_nonEmptyTrimmed = String_toNonEmptyString_orUndefined_afterTrim(analyzedText)

    if (!analyzedText_nonEmptyTrimmed) return KhmerAnalysisResult__empty_text

    const analyzedText_withKhmer = strToContainsKhmerOrUndefined(analyzedText_nonEmptyTrimmed)

    if (!analyzedText_withKhmer) {
      return {
        t: 'non_empty_text_without_at_least_one_khmer_char' as const,
        analyzedText: analyzedText_nonEmptyTrimmed,
        analyzedText_language: detectModeFromText(analyzedText_nonEmptyTrimmed) ?? initialText_language_fallback, // en or ru
      }
    }

    // 1. Generate segment arrays (needed for the UI)
    const segmentsIntlRaw = generateTextSegments(analyzedText_withKhmer, 'segmenter', km_map)
    const segmentsDictRaw = generateTextSegments(analyzedText_withKhmer, 'dictionary', km_map)

    // 2. Use generators to extract and merge unique words into one Set in a single pass
    // This replaces: union(extract(arr1), extract(arr2))
    const uniqueWords = NonEmptySet_union_maybeUndefined_onCollisionIgnore_fromIterables(
      yieldUniqueKhmerWords(segmentsIntlRaw),
      yieldUniqueKhmerWords(segmentsDictRaw),
    )

    return {
      t: 'WITH_KHMER' as const, // Internal tag for Phase 2
      analyzedText: analyzedText_withKhmer,
      segmentsIntlRaw,
      segmentsDictRaw,
      uniqueWords,
    }
  }, [analyzedText, initialText_language_fallback])

  const defsResult = useKhmerDefinitions(phase1.t === 'WITH_KHMER' ? phase1.uniqueWords : undefined)

  // block 2: Final consolidation returning the record or undefined
  return useMemo(() => {
    // If empty or no Khmer, Phase 1 already has the final state
    if (phase1.t === 'empty_text' || phase1.t === 'non_empty_text_without_at_least_one_khmer_char') {
      return phase1
    }

    const { analyzedText, segmentsIntlRaw, segmentsDictRaw } = phase1

    switch (defsResult.t) {
      case 'idle':
      case 'loading':
        return {
          t: 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading',
          analyzedText,
          analyzedText_language: 'km',
          segmentsIntl: segmentsIntlRaw,
          segmentsDict: segmentsDictRaw,
        }

      case 'request_error':
        return {
          t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored',
          analyzedText,
          analyzedText_language: 'km',
          segmentsIntl: segmentsIntlRaw,
          segmentsDict: segmentsDictRaw,
          e: defsResult.e,
        }

      case 'success':
        return {
          t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_success',
          analyzedText,
          analyzedText_language: 'km',
          segmentsIntl: enhanceSegments(segmentsIntlRaw, defsResult.definitions),
          segmentsDict: enhanceSegments(segmentsDictRaw, defsResult.definitions),
          definitions: defsResult.definitions,
        }
    }
  }, [phase1, defsResult])
}
