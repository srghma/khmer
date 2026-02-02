import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useMemo } from 'react'

interface WordDataSubset {
  readonly word: NonEmptyStringTrimmed
  readonly word_display?: NonEmptyStringTrimmed
}

export const useWordDisplay = (data: WordDataSubset | undefined) => {
  return useMemo(() => {
    if (!data) return undefined

    return { __html: data.word_display ?? data.word }
  }, [data])
}
