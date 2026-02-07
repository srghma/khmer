import { useEffect, useMemo, useReducer } from 'react'

// --- FSRS Imports ---
import type { Rating, Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---
import { getKmWordsDetailFull, type WordDetailKm } from '../../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { Record_stripNullValuesOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'
import { useAppToast } from '../../providers/ToastProvider'
import {
  findNextDue,
  getNextIntervals,
  transition_reviewCard,
  localStorage_loadOrInitCards,
  localStorage_saveCardsMap,
} from './AnkiStateManager'
import { type NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

import { type NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  NonEmptyMap_keysSet,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import type { ValidDate } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'

// --- Internal State (Data Only) ---

type AnkiStateInternal =
  | { t: 'idle' }
  | { t: 'loading' }
  | {
      t: 'ready'
      cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
      definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> | undefined
      selectedWord: TypedContainsKhmer
      isRevealed: boolean
    }

// --- Public State (Exposed to UI) ---

export type AnkiState =
  | { t: 'idle' }
  | { t: 'loading' }
  | {
      t: 'ready'
      // Data
      cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
      definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> | undefined
      selectedWord: TypedContainsKhmer
      isRevealed: boolean

      // Memoized Computed Data
      nextIntervals: NonEmptyRecord<Rating, ValidDate>

      // Bound Actions
      revealSet: () => void
      handleSelect: (word: TypedContainsKhmer) => void
      handleRate: (rating: Rating) => void
    }

export const AnkiState_idle: AnkiStateInternal = { t: 'idle' }
export const AnkiState_loading: AnkiStateInternal = { t: 'loading' }

// --- Actions ---

export type AnkiAction =
  | { type: 'RESET' }
  | { type: 'INIT_START' }
  | {
      type: 'INIT_SUCCESS'
      cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
      selectedWord: TypedContainsKhmer
    }
  | { type: 'SET_DEFINITIONS'; definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> }
  | { type: 'SELECT_WORD'; word: TypedContainsKhmer }
  | { type: 'REVEAL' }
  | {
      type: 'REVIEW_SUCCESS'
      newCards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
      nextWord: TypedContainsKhmer
    }

// --- Reducer ---

const ankiReducer = (state: AnkiStateInternal, action: AnkiAction): AnkiStateInternal => {
  switch (action.type) {
    case 'RESET':
      return AnkiState_idle

    case 'INIT_START':
      return AnkiState_loading

    case 'INIT_SUCCESS':
      return {
        t: 'ready',
        cards: action.cards,
        selectedWord: action.selectedWord,
        definitions: undefined,
        isRevealed: false,
      }

    case 'SET_DEFINITIONS':
      if (state.t !== 'ready') return state
      if (state.definitions === action.definitions) return state

      return {
        ...state,
        definitions: action.definitions,
      }

    case 'SELECT_WORD':
      if (state.t !== 'ready') return state
      if (state.selectedWord === action.word && !state.isRevealed) return state

      return {
        ...state,
        selectedWord: action.word,
        isRevealed: false,
      }

    case 'REVEAL':
      if (state.t !== 'ready') return state
      if (state.isRevealed) return state

      return {
        ...state,
        isRevealed: true,
      }

    case 'REVIEW_SUCCESS':
      if (state.t !== 'ready') return state
      if (state.cards === action.newCards && state.selectedWord === action.nextWord && !state.isRevealed) {
        return state
      }

      return {
        ...state,
        cards: action.newCards,
        selectedWord: action.nextWord,
        isRevealed: false,
      }

    default:
      assertNever(action)
  }
}

// --- Hook ---

export const useAnki = (items: NonEmptySet<TypedContainsKhmer>): AnkiState => {
  const toast = useAppToast()
  // Internal state management (Data only)
  const [internalState, dispatch] = useReducer(ankiReducer, AnkiState_idle)

  // 1. Lifecycle: Initialize
  useEffect(() => {
    if (internalState.t === 'ready' || internalState.t === 'loading') return

    dispatch({ type: 'INIT_START' })

    try {
      const nextCards = localStorage_loadOrInitCards(items)
      const [nextDueWord] = findNextDue(nextCards)

      dispatch({
        type: 'INIT_SUCCESS',
        cards: nextCards,
        selectedWord: nextDueWord,
      })
    } catch (error: any) {
      toast.error('Failed to initialize cards', error.message)
      dispatch({ type: 'RESET' })
    }
  }, [items, internalState.t])

  // 2. Lifecycle: Fetch Definitions
  useEffect(() => {
    if (internalState.t !== 'ready') return
    if (internalState.definitions) return

    let active = true

    getKmWordsDetailFull(NonEmptyMap_keysSet(internalState.cards))
      .then(res => {
        const cleanRes = Record_stripNullValuesOrThrow(res)

        if (active) {
          dispatch({ type: 'SET_DEFINITIONS', definitions: cleanRes })
        }
      })
      .catch((err: any) => {
        if (active) toast.error('Failed to fetch definitions', err.message)
      })

    return () => {
      active = false
    }
  }, [internalState.t, internalState.t === 'ready' ? internalState.cards : undefined])

  // 3. Construct Public State (Memoized)
  return useMemo<AnkiState>(() => {
    if (internalState.t !== 'ready') return internalState

    // A. Compute Intervals (Memoized by virtue of useMemo dependency on internalState)
    const currentCard = internalState.cards.get(internalState.selectedWord)

    // Robustness check: Card should always exist in ready state for selectedWord
    if (!currentCard) throw new Error(`Critical: Card missing for ${internalState.selectedWord}`)

    const nextIntervals = getNextIntervals(currentCard)

    // B. Define Bound Actions
    const revealSet = () => {
      dispatch({ type: 'REVEAL' })
    }

    const handleSelect = (word: TypedContainsKhmer) => {
      dispatch({ type: 'SELECT_WORD', word })
    }

    const handleRate = (rating: Rating) => {
      const { newCards, nextWord } = transition_reviewCard(internalState.cards, internalState.selectedWord, rating)

      // Side Effect: Persist
      localStorage_saveCardsMap(newCards)

      dispatch({
        type: 'REVIEW_SUCCESS',
        newCards,
        nextWord,
      })
    }

    // C. Return Combined Object
    return {
      ...internalState,
      nextIntervals,
      revealSet,
      handleSelect,
      handleRate,
    }
  }, [internalState])
}
