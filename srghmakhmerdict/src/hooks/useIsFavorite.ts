import { useFavorites } from '../providers/FavoritesProvider'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { useMemo } from 'react'

export function useIsFavorite(word: NonEmptyStringTrimmed, word_language: DictionaryLanguage): boolean {
  const { isFavorite } = useFavorites()

  return useMemo(() => isFavorite(word, word_language), [isFavorite, word, word_language])
}
