import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import * as FavDb from '../db/favorite'
import { favoritesStore } from '../externalStores/historyAndFavorites'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import {
  favoriteItemArray_add,
  favoriteItemArray_containsWordLanguage,
  favoriteItemArray_remove,
} from '../db/favorite/item'

export function useToggleFavorite(word: NonEmptyStringTrimmed, word_language: DictionaryLanguage) {
  const toast = useAppToast()
  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)

  const isFav = useMemo(
    () => favoriteItemArray_containsWordLanguage(allFavorites, word, word_language),
    [allFavorites, word, word_language],
  )

  const toggleFav = useCallback(async () => {
    const prevFavs = favoritesStore.getSnapshot()
    // Optimistic Update

    const isFav = favoriteItemArray_containsWordLanguage(prevFavs, word, word_language)

    const nextList = isFav
      ? favoriteItemArray_remove(prevFavs, word, word_language)
      : favoriteItemArray_add(prevFavs, word, word_language, () => Date.now())

    favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(nextList)

    try {
      if (isFav) {
        await FavDb.removeFavorite(word, word_language)
      } else {
        await FavDb.addFavorite(word, word_language)
      }
    } catch (e) {
      favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(prevFavs) // Rollback
      toast.error('Toggle failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    }
  }, [word, word_language, toast])

  return { isFav, toggleFav }
}
