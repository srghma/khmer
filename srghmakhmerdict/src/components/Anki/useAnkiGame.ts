import { useEffect, useMemo, useReducer } from 'react'
import { Grade } from 'femto-fsrs'
import { getFavorites } from '../../db/favorite'
import type { FavoriteItem } from '../../db/favorite/item'
import { reviewCard } from '../../db/favorite/anki'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { useAppToast } from '../../providers/ToastProvider'
import type { DictionaryLanguage } from '../../types'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { allFavorites_filterByLanguageAndSortByDue, getPreviewIntervals, zipQueueWithDescriptions } from './utils'
import { getWordDetailsByModeFull_Strict, type LanguageToDetailMap } from '../../db/dict/index'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NOfDays } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'
import type { AnkiDirection } from './types'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { Record_toNonEmptyRecord_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

export type CardAndDescription<L extends DictionaryLanguage> = {
  card: FavoriteItem
  description: LanguageToDetailMap[L]
}

export type DirectionToCards<L extends DictionaryLanguage> = {
  GUESSING_KHMER: NonEmptyArray<CardAndDescription<L>>
  GUESSING_NON_KHMER: NonEmptyArray<FavoriteItem>
}

export const AnkiGame_loading = { t: 'loading' } as const

export type AnkiGameHookReturn<L extends DictionaryLanguage, D extends AnkiDirection> =
  | typeof AnkiGame_loading
  | {
      t: 'no_more_due_cards_today__nothing_selected'
      allFavorites_filteredByLanguageAndSortedByDue: DirectionToCards<L>[D]

      selectCard: (index: ValidNonNegativeInt) => void // will transition to 'no_more_due_cards_today__selected__front'
    }
  | {
      t: 'no_more_due_cards_today__selected__front'
      allFavorites_filteredByLanguageAndSortedByDue: DirectionToCards<L>[D]
      fourButtons: Record<Grade, NOfDays>
      allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt

      reveal: () => void
      selectOtherCard: (index: ValidNonNegativeInt) => void // will transition to 'no_more_due_cards_today__selected__front'
    }
  | {
      t: 'no_more_due_cards_today__selected__back'
      allFavorites_filteredByLanguageAndSortedByDue: DirectionToCards<L>[D]
      allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt

      rate: (grade: Grade) => Promise<void>
      selectOtherCard: (index: ValidNonNegativeInt) => void // will transition to 'no_more_due_cards_today__selected__front'
    }
  | {
      t: 'have_due_cards_today__selected__front'
      allFavorites_filteredByLanguageAndSortedByDue: DirectionToCards<L>[D]
      fourButtons: Record<Grade, NOfDays>
      nOfCardsDueToday: ValidNonNegativeInt
      allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt // should be more than 0 and less than allFavorites_filteredByLanguageAndSortedByDue

      // Actions
      reveal: () => void
      selectOtherCard: (index: ValidNonNegativeInt) => void // will transition to 'have_due_cards_today__selected__front'
    }
  | {
      t: 'have_due_cards_today__selected__back'
      allFavorites_filteredByLanguageAndSortedByDue: DirectionToCards<L>[D]
      nOfCardsDueToday: ValidNonNegativeInt
      allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt

      rate: (grade: Grade) => Promise<void>
      selectOtherCard: (index: ValidNonNegativeInt) => void // will transition to 'have_due_cards_today__selected__front'
    }

type State<L extends DictionaryLanguage> = {
  selectedIndex: ValidNonNegativeInt
  isRevealed: boolean
  isProcessing: boolean
  descriptions: NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]> | undefined
}

type Action<L extends DictionaryLanguage> =
  | { type: 'SELECT_CARD'; index: ValidNonNegativeInt }
  | { type: 'REVEAL' }
  | { type: 'RATE_START' }
  | { type: 'RATE_END' }
  | { type: 'ADD_DESCRIPTIONS'; payload: NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]> }

function reducer<L extends DictionaryLanguage>(state: State<L>, action: Action<L>): State<L> {
  switch (action.type) {
    case 'SELECT_CARD':
      return { ...state, selectedIndex: action.index, isRevealed: false }
    case 'REVEAL':
      return { ...state, isRevealed: true }
    case 'RATE_START':
      return { ...state, isProcessing: true }
    case 'RATE_END':
      return { ...state, isProcessing: false, isRevealed: false }
    case 'ADD_DESCRIPTIONS':
      return {
        ...state,
        descriptions: state.descriptions
          ? (Record_toNonEmptyRecord_orThrow({ ...state.descriptions, ...action.payload } as Record<
              string,
              unknown
            >) as unknown as NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]>)
          : action.payload,
      }
    default:
      assertNever(action)
  }
}

export function useAnkiGame<L extends DictionaryLanguage, D extends AnkiDirection>(
  language: L,
  direction: D,
  allFavorites: NonEmptyArray<FavoriteItem>,
): AnkiGameHookReturn<L, D> {
  const toast = useAppToast()
  const [state, dispatch] = useReducer(reducer<L>, {
    selectedIndex: 0 as ValidNonNegativeInt,
    isRevealed: false,
    isProcessing: false,
    descriptions: undefined,
  })

  // 1. Calculate filtered and sorted list
  const filteredAndSortedFavorites = useMemo(
    () => allFavorites_filterByLanguageAndSortByDue(allFavorites, language),
    [allFavorites, language],
  )
  const nonEmptyFiltered = Array_toNonEmptyArray_orThrow(filteredAndSortedFavorites)

  // 2. Fetch Descriptions (if needed for GUESSING_KHMER)
  useEffect(() => {
    if (direction === 'GUESSING_NON_KHMER') return

    const wordsToFetchSet = new Set<NonEmptyStringTrimmed>()

    for (const item of nonEmptyFiltered) {
      if (!state.descriptions?.[item.word]) {
        wordsToFetchSet.add(item.word)
      }
    }
    const missing = Set_toNonEmptySet_orUndefined(wordsToFetchSet)

    if (!missing) return

    let active = true
    const fetch = async () => {
      try {
        const results = await getWordDetailsByModeFull_Strict(language, missing)

        if (active) dispatch({ type: 'ADD_DESCRIPTIONS', payload: results })
      } catch (e) {
        if (active) toast.error('Failed to load descriptions' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      }
    }

    fetch()

    return () => {
      active = false
    }
  }, [language, nonEmptyFiltered, direction, state.descriptions, toast])

  // 3. Construct Logic
  const canShowCards =
    direction === 'GUESSING_NON_KHMER' ||
    (direction === 'GUESSING_KHMER' && nonEmptyFiltered.every(item => state.descriptions?.[item.word] !== undefined))

  if (!canShowCards) return AnkiGame_loading

  // Construct the specific list based on direction
  let finalQueue: DirectionToCards<L>[D]

  if (direction === 'GUESSING_NON_KHMER') {
    finalQueue = nonEmptyFiltered as unknown as DirectionToCards<L>[D]
  } else {
    // GUESSING_KHMER
    finalQueue = zipQueueWithDescriptions(nonEmptyFiltered, state.descriptions!) as unknown as DirectionToCards<L>[D]
  }

  const getCard = (item: CardAndDescription<L> | FavoriteItem): FavoriteItem => {
    return 'card' in item ? item.card : item
  }

  const nOfCardsDueToday = finalQueue.filter(item => getCard(item).due <= Date.now()).length as ValidNonNegativeInt

  // Clamp index
  const clampedIndex = Math.min(state.selectedIndex, finalQueue.length - 1) as ValidNonNegativeInt
  const selectedItem = finalQueue[clampedIndex]
  const currentCard = getCard(selectedItem)

  const actions = {
    selectCard: (index: ValidNonNegativeInt) => dispatch({ type: 'SELECT_CARD', index }),
    selectOtherCard: (index: ValidNonNegativeInt) => dispatch({ type: 'SELECT_CARD', index }),
    reveal: () => dispatch({ type: 'REVEAL' }),
    rate: async (grade: Grade) => {
      if (state.isProcessing) return
      dispatch({ type: 'RATE_START' })
      try {
        await reviewCard(currentCard.word, currentCard.language, grade)
        const updatedData = await getFavorites()

        favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(updatedData)
        dispatch({ type: 'RATE_END' })
      } catch (e) {
        toast.error('Failed to rate' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        dispatch({ type: 'RATE_END' })
      }
    },
  }

  // State Logic
  if (nOfCardsDueToday === 0) {
    if (!state.isRevealed) {
      return {
        t: 'no_more_due_cards_today__selected__front',
        allFavorites_filteredByLanguageAndSortedByDue: finalQueue,
        fourButtons: getPreviewIntervals(currentCard),
        allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: clampedIndex,
        ...actions,
      }
    } else {
      return {
        t: 'no_more_due_cards_today__selected__back',
        allFavorites_filteredByLanguageAndSortedByDue: finalQueue,
        allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: clampedIndex,
        ...actions,
      }
    }
  } else {
    if (!state.isRevealed) {
      return {
        t: 'have_due_cards_today__selected__front',
        allFavorites_filteredByLanguageAndSortedByDue: finalQueue,
        fourButtons: getPreviewIntervals(currentCard),
        nOfCardsDueToday,
        allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: clampedIndex,
        ...actions,
      }
    } else {
      return {
        t: 'have_due_cards_today__selected__back',
        allFavorites_filteredByLanguageAndSortedByDue: finalQueue,
        nOfCardsDueToday,
        allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: clampedIndex,
        ...actions,
      }
    }
  }
}
