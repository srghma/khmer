// ==== FILE: srghmakhmerdict/src/components/Anki/hooks/useAnkiCards.ts ====
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getFavorites } from '../../db/favorite'
import type { FavoriteItem } from '../../db/favorite/item'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { useAppToast } from '../../providers/ToastProvider'
import type { DictionaryLanguage } from '../../types'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { getDueCards } from './utils'
import {
  Array_isNonEmptyArray,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

export const AnkiCardsResult_loading = { t: 'loading' } as const
export const AnkiCardsResult_empty = { t: 'empty' } as const

export type AnkiCardsResult =
  | typeof AnkiCardsResult_loading
  | typeof AnkiCardsResult_empty
  | { t: 'ready'; dueQueue: NonEmptyArray<FavoriteItem> }

export function useAnkiCards(language: DictionaryLanguage): AnkiCardsResult {
  const toast = useAppToast()
  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)

  // Initial Data Fetch
  useEffect(() => {
    if (allFavorites === undefined) {
      getFavorites()
        .then(data => favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(data))
        .catch(e => toast.error('Failed to load cards' as NonEmptyStringTrimmed, unknown_to_errorMessage(e)))
    }
  }, [allFavorites, toast])

  const dueQueue = useMemo(() => {
    if (!allFavorites) return []

    return getDueCards(allFavorites, language)
  }, [allFavorites, language])

  if (allFavorites === undefined) return AnkiCardsResult_loading
  if (!Array_isNonEmptyArray(dueQueue)) return AnkiCardsResult_empty

  return { t: 'ready', dueQueue }
}
