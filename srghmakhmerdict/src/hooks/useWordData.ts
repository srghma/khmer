import { useToggleFavorite } from './useToggleFavorite'
import { useEffect, useSyncExternalStore, useState } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import * as FavDb from '../db/favourite'
import * as DictDb from '../db/dict'
import { type DictionaryLanguage } from '../types'
import { type WordDetailEnOrRuOrKm } from '../db/dict'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { favoritesStore } from '../externalStores/historyAndFavourites'

const STATE_LOADING = { t: 'loading' } as const
const STATE_NOT_FOUND = { t: 'not_found' } as const

type State = typeof STATE_LOADING | typeof STATE_NOT_FOUND | { t: 'found'; data: WordDetailEnOrRuOrKm }

export function useWordData(word: NonEmptyStringTrimmed, mode: DictionaryLanguage) {
  const toast = useAppToast()
  const [state, dispatch] = useState<State>(STATE_LOADING)

  const { isFav, toggleFav } = useToggleFavorite(word, mode)

  // 1. Subscribe to the global favorites store
  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)

  // 2. Initial Data Loading
  useEffect(() => {
    let active = true
    const load = async () => {
      dispatch(STATE_LOADING)
      try {
        const [favs, data] = await Promise.all([
          allFavorites === undefined ? FavDb.getFavorites() : Promise.resolve(allFavorites),
          DictDb.getWordDetailByMode(mode, word, false),
        ])

        if (!active) return

        if (allFavorites === undefined) favoritesStore.set(favs)

        if (data) {
          dispatch({ t: 'found', data })
        } else {
          dispatch(STATE_NOT_FOUND)
        }
      } catch (e) {
        if (active) {
          dispatch(STATE_NOT_FOUND)
          toast.error('Error loading word' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [word, mode, toast])

  return { ...state, isFav, toggleFav }
}
