import { useEffect, useMemo, useState } from 'react'
import type { FavoriteItem } from '../../db/favorite/item'
import { useAppToast } from '../../providers/ToastProvider'
import type { DictionaryLanguage } from '../../types'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { allFavorites_filterByLanguage, getWords, zipQueueWithDescriptions } from './utils'
import { getWordDetailsByModeShort_Strict, type LanguageToShortDefinitionMap } from '../../db/dict/index'
import { type NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { AnkiGame_loading } from './useAnkiGameManager'

export type CardAndDescription<L extends DictionaryLanguage> = {
  card: FavoriteItem
  description: LanguageToShortDefinitionMap[L]
}

export const UseAnkiGameInitialData_Return_empty = { t: 'empty' } as const
export type UseAnkiGameInitialData_Return<T> =
  | typeof AnkiGame_loading
  | typeof UseAnkiGameInitialData_Return_empty
  | {
    t: 'have_enhanced_cards'
    cards: NonEmptyArray<T>
  }

export function useAnkiGameInitialData_GUESSING_KHMER<L extends DictionaryLanguage>(
  language: L,
  allFavorites: NonEmptyArray<FavoriteItem>, // already after allFavorites_filterByLanguage
): UseAnkiGameInitialData_Return<CardAndDescription<L>> {
  const toast = useAppToast()

  const [state, setState] = useState<UseAnkiGameInitialData_Return<CardAndDescription<L>>>(AnkiGame_loading)

  // 2. Fetch Descriptions (if needed for GUESSING_KHMER)
  useEffect(() => {
    let active = true
    const fetch = async () => {
      const favoritesOfLanguage = allFavorites_filterByLanguage(allFavorites, language)

      if (!favoritesOfLanguage) {
        setState(UseAnkiGameInitialData_Return_empty)

        return
      }

      const missing = getWords(favoritesOfLanguage)

      if (state.t !== 'loading') return AnkiGame_loading

      let results: NonEmptyRecord<NonEmptyStringTrimmed, LanguageToShortDefinitionMap[L]> | undefined

      try {
        results = await getWordDetailsByModeShort_Strict(language, missing)

        if (!active) return
      } catch (e) {
        if (active) toast.error('Failed to load descriptions' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))

        return
      }

      const favoritesOfLanguage_withDescription: NonEmptyArray<CardAndDescription<L>> = zipQueueWithDescriptions<
        LanguageToShortDefinitionMap[L]
      >(favoritesOfLanguage, results)

      setState({ t: 'have_enhanced_cards', cards: favoritesOfLanguage_withDescription })
    }

    fetch()

    return () => {
      active = false
    }
  }, [language, allFavorites, toast])

  return state
}

export function useAnkiGameInitialData_GUESSING_NON_KHMER<L extends DictionaryLanguage>(
  language: L,
  allFavorites: NonEmptyArray<FavoriteItem>, // already after allFavorites_filterByLanguage
): UseAnkiGameInitialData_Return<FavoriteItem> {
  return useMemo(() => {
    const favoritesOfLanguage = allFavorites_filterByLanguage(allFavorites, language)

    if (!favoritesOfLanguage) {
      return UseAnkiGameInitialData_Return_empty
    }

    return { t: 'have_enhanced_cards', cards: favoritesOfLanguage }
  }, [allFavorites, language])
}
