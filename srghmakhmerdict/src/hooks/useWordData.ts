import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { useToggleFavorite } from './useToggleFavorite'
import { useWordDefinition } from './useWordDefinition'
import { useEnsureFavoritesLoaded } from './useEnsureFavoritesLoaded'

export function useWordData(word: NonEmptyStringTrimmed, mode: DictionaryLanguage) {
  // 1. Ensure global favorites are loaded
  useEnsureFavoritesLoaded()

  // 2. Get Definition Data
  const defResult = useWordDefinition(word, mode)

  // 3. Get Favorite Status
  const { isFav, toggleFav } = useToggleFavorite(word, mode)

  return { ...defResult, isFav, toggleFav }
}
