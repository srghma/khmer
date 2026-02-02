import { useMemo } from 'react'
import { generateTextSegments, type TextSegment } from '../utils/text-processing/text'
import { type KhmerWordsMap } from '../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { ColorizationMode } from '../utils/text-processing/utils'

export const useMaybeGenerateTextSegments = (
  text: TypedContainsKhmer | undefined,
  colorMode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyArray<TextSegment> | undefined => {
  return useMemo(() => {
    if (!text || !km_map) return undefined

    return generateTextSegments(text, colorMode, km_map)
  }, [text, km_map, colorMode])
}
