import { useCallback, useSyncExternalStore } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import * as FavDb from '../db/favourite'
import { favoritesStore } from '../externalStores/historyAndFavourites'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { Map_toNonEmptyMap_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'

export function useToggleFavorite(word: NonEmptyStringTrimmed, mode: DictionaryLanguage) {
  const toast = useAppToast()
  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)
  const isFav = allFavorites?.has(word) ?? false

  const toggleFav = useCallback(async () => {
    const prevFavs = favoritesStore.getSnapshot()
    const nextMap = new Map(prevFavs ?? [])

    // Optimistic Update
    if (isFav) nextMap.delete(word)
    else nextMap.set(word, mode)

    favoritesStore.set(Map_toNonEmptyMap_orUndefined(nextMap))

    try {
      if (isFav) {
        await FavDb.removeFavorite(word, mode)
      } else {
        await FavDb.addFavorite(word, mode)
      }
    } catch (e) {
      favoritesStore.set(prevFavs) // Rollback
      toast.error('Toggle failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    }
  }, [isFav, word, mode, toast])

  return { isFav, toggleFav }
}
