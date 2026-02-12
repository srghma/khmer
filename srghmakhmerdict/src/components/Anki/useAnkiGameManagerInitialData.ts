import { useEffect, useMemo, useState } from 'react'
import type { FavoriteItem } from '../../db/favorite/item'
import { useAppToast } from '../../providers/ToastProvider'
import type { DictionaryLanguage } from '../../types'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { getWords, zipQueueWithDescriptions } from './utils'
import { getWordDetailsByModeShort_Strict, type LanguageToShortDefinitionMap } from '../../db/dict/index'
import { type NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { AnkiDirection } from './types'

import { type AnkiGameMode } from './types'

export type CardAndDescription<L extends DictionaryLanguage> = {
  card: FavoriteItem
  description: LanguageToShortDefinitionMap[L]
}

// khmer tab - guess khmer - if list we need to show ShortDescription without khmer chars, in details we need to show FullDescription without khmer chars
// en tab - guess khmer - if list we need to show Word, in details we need to show FullDescription without khmer chars
// ru tab - guess khmer - if list we need to show Word, in details we need to show FullDescription without khmer chars
// khmer tab - guess non-khmer - if list we need to show Word, in details we need to show FullDescription without non-khmer chars
// en tab - guess non-khmer - if list we need to show ShortDescription without non-khmer chars, in details we need to show FullDescription without non-khmer chars
// ru tab - guess non-khmer - if list we need to show ShortDescription without non-khmer chars, in details we need to show FullDescription without non-khmer chars

export type GameModeAndDataItem_Map = {
  GUESS_NON_KHMER_km: FavoriteItem
  GUESS_KHMER_en: FavoriteItem
  GUESS_KHMER_ru: FavoriteItem
  GUESS_KHMER_km: CardAndDescription<'km'>
  GUESS_NON_KHMER_en: CardAndDescription<'en'>
  GUESS_NON_KHMER_ru: CardAndDescription<'ru'>
}

export type GameModeAndData = {
  [K in AnkiGameMode]: { t: K; v: NonEmptyArray<GameModeAndDataItem_Map[K]> }
}[AnkiGameMode]

export type GameModeAndDataItem = {
  [K in AnkiGameMode]: { t: K; v: GameModeAndDataItem_Map[K] }
}[AnkiGameMode]

export function GameModeAndData_NonEmptyArray_findItemByWord_impl<M extends AnkiGameMode>(
  word: NonEmptyStringTrimmed,
  mode: M,
  data: NonEmptyArray<GameModeAndDataItem_Map[M]>,
): GameModeAndDataItem_Map[M] | undefined {
  switch (mode) {
    case 'GUESS_NON_KHMER_km':
    case 'GUESS_KHMER_en':
    case 'GUESS_KHMER_ru':
      return (data as any).find((item: any) => item.word === word)
    case 'GUESS_KHMER_km':
    case 'GUESS_NON_KHMER_en':
    case 'GUESS_NON_KHMER_ru':
      return (data as any).find((item: any) => item.card.word === word)
  }
}

export function GameModeAndData_NonEmptyArray_findItemByWord(
  word: NonEmptyStringTrimmed,
  data: GameModeAndData,
): GameModeAndDataItem {
  const v = GameModeAndData_NonEmptyArray_findItemByWord_impl(word, data.t, data.v) as any
  if (!v) {
    throw new Error(`Item with word "${word}" not found in data ${JSON.stringify(data)}`)
  }
  return {
    t: data.t,
    v,
  }
}

export function GameModeAndData_NonEmptyArray_first(
  data: GameModeAndData,
): GameModeAndDataItem {
  const v = data.v[0] as any
  return {
    t: data.t,
    v,
  }
}

export function GameModeAndDataItem_getCard(item: GameModeAndDataItem): FavoriteItem {
  switch (item.t) {
    case 'GUESS_NON_KHMER_km':
    case 'GUESS_KHMER_en':
    case 'GUESS_KHMER_ru':
      return item.v
    case 'GUESS_KHMER_km':
    case 'GUESS_NON_KHMER_en':
    case 'GUESS_NON_KHMER_ru':
      return item.v.card
  }
}

export type UseAnkiGameInitialData_Return = 'loading' | GameModeAndData

export function useAnkiGameInitialData(
  language: DictionaryLanguage,
  direction: AnkiDirection,
  items: NonEmptyArray<FavoriteItem>, // Assumed already sorted and filtered by language
): UseAnkiGameInitialData_Return {
  const toast = useAppToast()

  // 1. Handle Sync Modes (1, 3, 5) immediately via Memo
  // This prevents a "loading" flash for modes that already have all the data they need.
  const syncResult = useMemo<GameModeAndData | undefined>(() => {
    // Mode 1: KM Dict -> Guess En/Ru (Show Word)
    if (language === 'km' && direction === 'GUESSING_NON_KHMER') {
      return { t: 'GUESS_NON_KHMER_km', v: items }
    }
    // Mode 3: EN Dict -> Guess Km (Show Word)
    if (language === 'en' && direction === 'GUESSING_KHMER') {
      return { t: 'GUESS_KHMER_en', v: items }
    }
    // Mode 5: RU Dict -> Guess Km (Show Word)
    if (language === 'ru' && direction === 'GUESSING_KHMER') {
      return { t: 'GUESS_KHMER_ru', v: items }
    }

    return undefined
  }, [language, direction, items])

  // 2. Handle Async Modes (2, 4, 6) via State & Effect
  const [asyncResult, setAsyncResult] = useState<UseAnkiGameInitialData_Return>('loading')

  useEffect(() => {
    // If we have a sync result, do nothing (or reset async state)
    if (syncResult) return

    let active = true

    const fetchDescriptions = async () => {
      setAsyncResult('loading')

      try {
        const words = getWords(items)

        // Mode 2: KM Dict -> Guess Km (Show Description)
        if (language === 'km' && direction === 'GUESSING_KHMER') {
          const descs = await getWordDetailsByModeShort_Strict('km', words)

          if (active) {
            setAsyncResult({
              t: 'GUESS_KHMER_km',
              v: zipQueueWithDescriptions(items, descs),
            })
          }
        }
        // Mode 4: EN Dict -> Guess En (Show Description/Translation)
        else if (language === 'en' && direction === 'GUESSING_NON_KHMER') {
          const descs = await getWordDetailsByModeShort_Strict('en', words)

          if (active) {
            setAsyncResult({
              t: 'GUESS_NON_KHMER_en',
              v: zipQueueWithDescriptions(items, descs),
            })
          }
        }
        // Mode 6: RU Dict -> Guess Ru (Show Description/Translation)
        else if (language === 'ru' && direction === 'GUESSING_NON_KHMER') {
          const descs = await getWordDetailsByModeShort_Strict('ru', words)

          if (active) {
            setAsyncResult({
              t: 'GUESS_NON_KHMER_ru',
              v: zipQueueWithDescriptions(items, descs),
            })
          }
        }
      } catch (e) {
        if (active) {
          toast.error('Failed to load descriptions' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          // We stay in 'loading' or you could add an 'error' state
        }
      }
    }

    fetchDescriptions()

    return () => {
      active = false
    }
  }, [language, direction, items, syncResult, toast])

  return syncResult ?? asyncResult
}
