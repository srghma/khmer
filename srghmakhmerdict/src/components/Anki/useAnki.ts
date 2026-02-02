import { useEffect, useMemo, useCallback, useReducer } from 'react'

// --- FSRS Imports ---
import type { Rating, Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---
import { getKmWordsDetailFull, type WordDetailKm } from '../../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { Record_stripNullValuesOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'
import { useToast } from '../../providers/ToastProvider'
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

// --- State Shape ---

export type AnkiState =
  | { t: 'idle' }
  | { t: 'loading' }
  | {
      t: 'ready'
      cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
      definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> | undefined
      selectedWord: TypedContainsKhmer
      isRevealed: boolean
    }

export const AnkiState_idle: AnkiState = { t: 'idle' }
export const AnkiState_loading: AnkiState = { t: 'loading' }

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

export const ankiReducer = (state: AnkiState, action: AnkiAction): AnkiState => {
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

      return {
        ...state,
        definitions: action.definitions,
      }

    case 'SELECT_WORD':
      if (state.t !== 'ready') return state

      return {
        ...state,
        selectedWord: action.word,
        isRevealed: false,
      }

    case 'REVEAL':
      if (state.t !== 'ready') return state

      return {
        ...state,
        isRevealed: true,
      }

    case 'REVIEW_SUCCESS':
      if (state.t !== 'ready') return state

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

export const useAnki = (items: NonEmptySet<TypedContainsKhmer>) => {
  const toast = useToast()
  const [state, dispatch] = useReducer(ankiReducer, AnkiState_idle)

  // 1. Lifecycle: Initialize when opening
  //    This is the ONLY place 'items' prop is strictly necessary
  useEffect(() => {
    // Don't re-init if already ready (unless forced elsewhere)
    if (state.t === 'ready' || state.t === 'loading') return

    dispatch({ type: 'INIT_START' })

    try {
      const nextCards = localStorage_loadOrInitCards(items)

      // Initial Selection Strategy (Earliest Due Date)
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
  }, [items, state.t])

  // 2. Lifecycle: Fetch Definitions (Side Effect)
  //    Refactored to derive words from state.cards instead of unstable props
  useEffect(() => {
    if (state.t !== 'ready') return
    if (!state.definitions) return

    let active = true

    getKmWordsDetailFull(NonEmptyMap_keysSet(state.cards))
      .then(res => {
        const cleanRes = Record_stripNullValuesOrThrow(res) // all words should be found

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
  }, [state.t, state.t === 'ready' ? state.cards : undefined])

  // 3. Handlers
  const handleRate = useCallback(
    (rating: Rating) => {
      if (state.t !== 'ready') return

      // 1. Calculate new state via pure function (No dependency on 'items')
      const { newCards, nextWord } = transition_reviewCard(state.cards, state.selectedWord, rating)

      // 2. Persist (Side Effect)
      localStorage_saveCardsMap(newCards)

      // 3. Update State
      dispatch({
        type: 'REVIEW_SUCCESS',
        newCards,
        nextWord,
      })
    },
    [state],
  )

  const handleSelect = useCallback(
    (word: TypedContainsKhmer) => {
      if (state.t === 'ready') {
        dispatch({ type: 'SELECT_WORD', word })
      }
    },
    [state.t],
  )

  const setIsRevealed = useCallback(
    (_: boolean) => {
      if (state.t === 'ready') {
        dispatch({ type: 'REVEAL' })
      }
    },
    [state.t],
  )

  // 4. Derived Data (Next Intervals)
  const nextIntervals = useMemo(() => {
    if (state.t !== 'ready') return undefined
    const card = state.cards.get(state.selectedWord)

    if (!card) return undefined

    return getNextIntervals(card)
  }, [state])

  return {
    state,
    handleRate,
    handleSelect,
    setIsRevealed,
    nextIntervals,
  }
}
