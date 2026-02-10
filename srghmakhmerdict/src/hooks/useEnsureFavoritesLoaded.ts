import { useEffect, useSyncExternalStore } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import * as FavDb from '../db/favorite'
import { favoritesStore } from '../externalStores/historyAndFavorites'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'

export function useEnsureFavoritesLoaded() {
  const toast = useAppToast()
  // We subscribe to the store to check if it's undefined
  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)

  useEffect(() => {
    let active = true

    if (allFavorites === undefined) {
      FavDb.getFavorites()
        .then(favs => {
          if (active) favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(favs)
        })
        .catch(e => {
          if (active) toast.error('Error loading favorites' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        })
    }

    return () => {
      active = false
    }
  }, [allFavorites, toast])
}
