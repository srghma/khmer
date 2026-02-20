import { useMemo } from 'react'
import type { DictionaryLanguage } from '../../types'
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
import { useDictionary } from '../../providers/DictionaryProvider'

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
    segmentsDict: NonEmptyArray<TextSegment> | undefined
    segmentsIntl: NonEmptyArray<TextSegment> | undefined
  }
  | {
    t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored'
    analyzedText: TypedContainsKhmer
    analyzedText_language: 'km'
    segmentsDict: NonEmptyArray<TextSegment> | undefined
    segmentsIntl: NonEmptyArray<TextSegment> | undefined
    e: NonEmptyStringTrimmed | undefined
  }
  | {
    t: 'non_empty_text_with_at_least_one_khmer_char__defs_request_success'
    analyzedText: TypedContainsKhmer
    analyzedText_language: 'km'
    segmentsDict: NonEmptyArray<TextSegmentEnhanced> | undefined
    segmentsIntl: NonEmptyArray<TextSegmentEnhanced> | undefined
  }

export const useKhmerAnalysis = (
  analyzedText: string,
  initialText_language_fallback: DictionaryLanguage,
  enabledSegmenters: 'segmenter' | 'dictionary' | 'both',
): KhmerAnalysisResult => {
  const { km_map } = useDictionary()
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
    const segmentsIntlRaw =
      enabledSegmenters === 'segmenter' || enabledSegmenters === 'both'
        ? generateTextSegments(analyzedText_withKhmer, 'segmenter', km_map, false)
        : undefined
    const segmentsDictRaw =
      enabledSegmenters === 'dictionary' || enabledSegmenters === 'both'
        ? generateTextSegments(analyzedText_withKhmer, 'dictionary', km_map, false)
        : undefined

    console.log('segmentsIntlRaw', segmentsIntlRaw)
    console.log('segmentsDictRaw', segmentsDictRaw)
    // 2. Use generators to extract and merge unique words into one Set in a single pass
    const iterables = []

    if (segmentsDictRaw) iterables.push(yieldUniqueKhmerWords(segmentsDictRaw))
    if (segmentsIntlRaw) iterables.push(yieldUniqueKhmerWords(segmentsIntlRaw))

    const uniqueWords = NonEmptySet_union_maybeUndefined_onCollisionIgnore_fromIterables(...iterables)

    console.log('uniqueWords', uniqueWords)

    return {
      t: 'WITH_KHMER' as const, // Internal tag for Phase 2
      analyzedText: analyzedText_withKhmer,
      segmentsIntlRaw,
      segmentsDictRaw,
      uniqueWords,
    }
  }, [analyzedText, initialText_language_fallback, enabledSegmenters, km_map])

  const defsResult = useKhmerDefinitions(phase1.t === 'WITH_KHMER' ? phase1.uniqueWords : undefined)

  // block 2: Final consolidation returning the record or undefined
  return useMemo(() => {
    // If empty or no Khmer, Phase 1 already has the final state
    if (phase1.t === 'empty_text' || phase1.t === 'non_empty_text_without_at_least_one_khmer_char') {
      return phase1
    }

    const { analyzedText, segmentsIntlRaw, segmentsDictRaw } = phase1

    console.log('defsResult', defsResult)

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
          segmentsIntl: segmentsIntlRaw ? enhanceSegments(segmentsIntlRaw, defsResult.definitions) : undefined,
          segmentsDict: segmentsDictRaw ? enhanceSegments(segmentsDictRaw, defsResult.definitions) : undefined,
          definitions: defsResult.definitions,
        }
    }
  }, [phase1, defsResult])
}
