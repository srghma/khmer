import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { generateTextSegments } from '../utils/text-processing/text'
import type { KhmerWordsMap } from '../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { enhanceSegments, type TextSegmentEnhanced } from '../utils/text-processing/text-enhanced'
import type { ColorizationMode } from '../utils/text-processing/utils'

// --- Hook ---

interface UseEnhancedSegmentsResult {
  segments: NonEmptyArray<TextSegmentEnhanced> | undefined
  loading: boolean
}

export const useEnhancedSegments = (
  text: TypedContainsKhmer | undefined,
  colorMode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): UseEnhancedSegmentsResult => {
  const [definitions, setDefinitions] = useState<Record<TypedKhmerWord, NonEmptyStringTrimmed>>({})
  const [loading, setLoading] = useState(false)

  // 1. Generate Basic Segments
  const basicSegments = useMemo(() => {
    if (!text || !km_map || colorMode === 'none') return undefined

    // Map 'none' -> 'segmenter' conceptually if it slips through, though we guard above
    const segMode = colorMode === 'dictionary' ? 'dictionary' : 'segmenter'

    return generateTextSegments(text, segMode, km_map)
  }, [text, km_map, colorMode])

  // 2. Fetch Definitions
  useEffect(() => {
    if (!basicSegments) return

    const uniqueWords = new Set<TypedKhmerWord>()

    basicSegments.forEach(seg => {
      if (seg.t === 'khmer') {
        seg.words.forEach(w => uniqueWords.add(w))
      }
    })

    const wordsToFetch = Array.from(uniqueWords)

    if (wordsToFetch.length === 0) return

    let active = true

    setLoading(true)

    invoke<Record<TypedKhmerWord, NonEmptyStringTrimmed>>('get_km_word_definitions', {
      words: wordsToFetch,
    })
      .then(res => {
        if (active) setDefinitions(res)
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [basicSegments])

  // 3. Enhance
  const enhancedSegments = useMemo(() => {
    if (!basicSegments) return undefined

    return enhanceSegments(basicSegments, definitions)
  }, [basicSegments, definitions])

  return { segments: enhancedSegments, loading }
}
