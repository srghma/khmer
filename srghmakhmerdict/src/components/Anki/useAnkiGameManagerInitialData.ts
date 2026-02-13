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

import { languageAndDirectionToAnkiGameMode, type AnkiGameMode } from './types'

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
  'km:GUESS_NON_KHMER': FavoriteItem
  'en:GUESS_KHMER': FavoriteItem
  'ru:GUESS_KHMER': FavoriteItem
  'km:GUESS_KHMER': CardAndDescription<'km'>
  'en:GUESS_NON_KHMER': CardAndDescription<'en'>
  'ru:GUESS_NON_KHMER': CardAndDescription<'ru'>
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
    case 'km:GUESS_NON_KHMER':
    case 'en:GUESS_KHMER':
    case 'ru:GUESS_KHMER':
      return (data as any).find((item: any) => item.word === word)
    case 'km:GUESS_KHMER':
    case 'en:GUESS_NON_KHMER':
    case 'ru:GUESS_NON_KHMER':
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

export function GameModeAndData_NonEmptyArray_first(data: GameModeAndData): GameModeAndDataItem {
  const v = data.v[0] as any

  return {
    t: data.t,
    v,
  }
}

export function GameModeAndDataItem_getCard(item: GameModeAndDataItem): FavoriteItem {
  switch (item.t) {
    case 'km:GUESS_NON_KHMER':
    case 'en:GUESS_KHMER':
    case 'ru:GUESS_KHMER':
      return item.v
    case 'km:GUESS_KHMER':
    case 'en:GUESS_NON_KHMER':
    case 'ru:GUESS_NON_KHMER':
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
    console.log('[Anki InitialData] Computing syncResult', { language, direction, itemCount: items.length })
    // Mode 1: KM Dict -> Guess En/Ru (Show Word)
    if (language === 'km' && direction === 'GUESSING_NON_KHMER') {
      console.log('[Anki InitialData] Sync mode: km:GUESS_NON_KHMER')
      return { t: 'km:GUESS_NON_KHMER', v: items }
    }
    // Mode 3: EN Dict -> Guess Km (Show Word)
    if (language === 'en' && direction === 'GUESSING_KHMER') {
      console.log('[Anki InitialData] Sync mode: en:GUESS_KHMER')
      return { t: 'en:GUESS_KHMER', v: items }
    }
    // Mode 5: RU Dict -> Guess Km (Show Word)
    if (language === 'ru' && direction === 'GUESSING_KHMER') {
      console.log('[Anki InitialData] Sync mode: ru:GUESS_KHMER')
      return { t: 'ru:GUESS_KHMER', v: items }
    }

    console.log('[Anki InitialData] No sync mode matched, will use async')
    return undefined
  }, [language, direction, items])

  // 2. Handle Async Modes (2, 4, 6) via State & Effect
  // We include a "requestId" in the state to detect when the parameters have changed
  // so we can immediately return 'loading' instead of the stale result from a previous state.
  const [asyncState, setAsyncState] = useState<{
    requestId: AnkiGameMode
    result: UseAnkiGameInitialData_Return
  }>({
    requestId: languageAndDirectionToAnkiGameMode(language, direction),
    result: 'loading',
  })

  // Synchronously reset state if parameters change
  if (asyncState.requestId !== languageAndDirectionToAnkiGameMode(language, direction)) {
    setAsyncState({
      requestId: languageAndDirectionToAnkiGameMode(language, direction),
      result: 'loading',
    })
  }

  const asyncResult = asyncState.requestId === languageAndDirectionToAnkiGameMode(language, direction) ? asyncState.result : 'loading'

  useEffect(() => {
    // If we have a sync result, do nothing (or reset async state)
    if (syncResult) return

    let active = true

    const fetchDescriptions = async () => {
      console.log('[Anki InitialData] Starting async fetch', { language, direction, itemCount: items.length })
      // No need to setAsyncState('loading') here as it's already reset during render if requestId changed
      const words = getWords(items)
      console.log('[Anki InitialData] Words to fetch:', Array.from(words))
      try {
        // Mode 2: KM Dict -> Guess Km (Show Description)
        if (language === 'km' && direction === 'GUESSING_KHMER') {
          console.log('[Anki InitialData] Async mode: km:GUESS_KHMER, fetching descriptions...')
          const descs = await getWordDetailsByModeShort_Strict('km', words)
          console.log('[Anki InitialData] Descriptions fetched:', Object.keys(descs))

          if (active) {
            console.log('[Anki InitialData] Zipping queue with descriptions...')
            const zipped = zipQueueWithDescriptions(items, descs)
            console.log('[Anki InitialData] Zipped successfully, count:', zipped.length)
            setAsyncState({
              requestId: languageAndDirectionToAnkiGameMode(language, direction),
              result: {
                t: 'km:GUESS_KHMER',
                v: zipped,
              },
            })
          }
        }
        // Mode 4: EN Dict -> Guess En (Show Description/Translation)
        else if (language === 'en' && direction === 'GUESSING_NON_KHMER') {
          console.log('[Anki InitialData] Async mode: en:GUESS_NON_KHMER, fetching descriptions...')
          const descs = await getWordDetailsByModeShort_Strict('en', words)
          console.log('[Anki InitialData] Descriptions fetched:', Object.keys(descs))

          if (active) {
            console.log('[Anki InitialData] Zipping queue with descriptions...')
            const zipped = zipQueueWithDescriptions(items, descs)
            console.log('[Anki InitialData] Zipped successfully, count:', zipped.length)
            setAsyncState({
              requestId: languageAndDirectionToAnkiGameMode(language, direction),
              result: {
                t: 'en:GUESS_NON_KHMER',
                v: zipped,
              },
            })
          }
        }
        // Mode 6: RU Dict -> Guess Ru (Show Description/Translation)
        else if (language === 'ru' && direction === 'GUESSING_NON_KHMER') {
          console.log('[Anki InitialData] Async mode: ru:GUESS_NON_KHMER, fetching descriptions...')
          const descs = await getWordDetailsByModeShort_Strict('ru', words)
          console.log('[Anki InitialData] Descriptions fetched:', Object.keys(descs))

          if (active) {
            console.log('[Anki InitialData] Zipping queue with descriptions...')
            const zipped = zipQueueWithDescriptions(items, descs)
            console.log('[Anki InitialData] Zipped successfully, count:', zipped.length)
            setAsyncState({
              requestId: languageAndDirectionToAnkiGameMode(language, direction),
              result: {
                t: 'ru:GUESS_NON_KHMER',
                v: zipped,
              },
            })
          }
        }
        console.log('[Anki InitialData] Async fetch completed successfully')
      } catch (e) {
        console.error('[Anki InitialData] Error during async fetch:', e)
        if (active) {
          toast.error('Failed to load descriptions' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          // Keep the 'loading' state or potentially set to an error state if added
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
