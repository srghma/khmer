import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { useWordDefinition } from './useWordDefinition' // Keep this for now, as the new snippet doesn't fully replace definition logic
import { type LanguageToDetailMap } from '../db/dict'
import { useMemo, useCallback } from 'react'
import { useFavorites } from '../providers/FavoritesProvider'
import { useIsFavorite } from './useIsFavorite'

const UseWordDataResult_loading = { t: 'loading' } as const
const UseWordDataResult_not_found = { t: 'not_found' } as const

export type UseWordDataResult =
  | typeof UseWordDataResult_loading
  | {
      t: 'found'
      detail: LanguageToDetailMap[DictionaryLanguage]
      isFav: boolean
      toggleFav: () => Promise<void>
    }
  | typeof UseWordDataResult_not_found

export function useWordData(word: NonEmptyStringTrimmed, mode: DictionaryLanguage): UseWordDataResult {
  // 1. Get Definition Data
  const defResult = useWordDefinition(word, mode)

  // 2. Get Favorite Status
  const { toggleFavorite } = useFavorites()
  const isFav = useIsFavorite(word, mode)

  const toggleFav = useCallback(async () => {
    try {
      await toggleFavorite(word, mode)
    } catch (e) {
      // Toast is handled in provider
    }
  }, [word, mode, toggleFavorite])

  return useMemo(() => {
    if (defResult.t === 'loading') {
      return UseWordDataResult_loading
    } else if (defResult.t === 'ready') {
      return {
        t: 'found',
        detail: defResult.detail,
        isFav,
        toggleFav,
      }
    } else {
      return UseWordDataResult_not_found
    }
  }, [defResult, isFav, toggleFav])
}
