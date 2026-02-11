import { useReducer, useSyncExternalStore, useMemo, useCallback } from 'react'
import { Grade } from 'femto-fsrs'
import type { FavoriteItem } from '../../db/favorite/item'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useAppToast } from '../../providers/ToastProvider'
import { reviewCard } from '../../db/favorite/anki'
import { getFavorites } from '../../db/favorite'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import {
  init,
  type AnkiGameState,
  type AnkiGameState_NoMore_Nothing,
  type AnkiGameState_NoMore_Selected_Front,
  type AnkiGameState_NoMore_Selected_Back,
  type AnkiGameState_Have_Selected_Front,
  type AnkiGameState_Have_Selected_Back,
  no_more_due_cards_today__nothing_selected__selectCard,
  no_more_due_cards_today__selected__front__reveal,
  no_more_due_cards_today__selected__front__selectOtherCard,
  no_more_due_cards_today__selected__front__tick,
  no_more_due_cards_today__selected__back__selectOtherCard,
  no_more_due_cards_today__selected__back__rate,
  have_due_cards_today__selected__front__reveal,
  have_due_cards_today__selected__front__selectOtherCard,
  have_due_cards_today__selected__front__tick,
  have_due_cards_today__selected__back__selectOtherCard,
  have_due_cards_today__selected__back__rate,
} from './AnkiGameManager'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

export const AnkiGame_loading = { t: 'loading' } as const

export type AnkiGameHookResult<T> =
  | typeof AnkiGame_loading
  | {
      t: AnkiGameState_NoMore_Nothing<T>['t']
      state: AnkiGameState_NoMore_Nothing<T>
      selectCard: (index: ValidNonNegativeInt) => void
    }
  | {
      t: AnkiGameState_NoMore_Selected_Front<T>['t']
      state: AnkiGameState_NoMore_Selected_Front<T>
      reveal: () => void
      selectOtherCard: (index: ValidNonNegativeInt) => void
      tick: () => void
    }
  | {
      t: AnkiGameState_NoMore_Selected_Back<T>['t']
      state: AnkiGameState_NoMore_Selected_Back<T>
      rate: ((grade: Grade) => Promise<void>) | undefined // undefined = is loading
      selectOtherCard: (index: ValidNonNegativeInt) => void
    }
  | {
      t: AnkiGameState_Have_Selected_Front<T>['t']
      state: AnkiGameState_Have_Selected_Front<T>
      reveal: () => void
      selectOtherCard: (index: ValidNonNegativeInt) => void
      tick: () => void
    }
  | {
      t: AnkiGameState_Have_Selected_Back<T>['t']
      state: AnkiGameState_Have_Selected_Back<T>
      rate: ((grade: Grade) => Promise<void>) | undefined // undefined = is loading
      selectOtherCard: (index: ValidNonNegativeInt) => void
    }

type Action<T> =
  | { type: 'RESET'; rawItems: NonEmptyArray<T>; now: number; getCard: (item: T) => FavoriteItem }
  | { type: 'TICK'; now: number; getCard: (item: T) => FavoriteItem }
  | { type: 'SELECT_CARD'; index: ValidNonNegativeInt; now: number; getCard: (item: T) => FavoriteItem }
  | { type: 'REVEAL' }
  | { type: 'SELECT_OTHER_CARD'; index: ValidNonNegativeInt; now: number; getCard: (item: T) => FavoriteItem }
  | { type: 'RATE_START' }
  | { type: 'RATE_FAIL' }
  | {
      type: 'RATE_SUCCESS'
      newCard: FavoriteItem
      setItemCard: (item: T, newCard: FavoriteItem) => T
      now: number
      getCard: (item: T) => FavoriteItem
    }

type HookState<T> = {
  game: AnkiGameState<T>
  isProcessingRate: boolean
  rawItems: NonEmptyArray<T>
  lastTickNow: number
}

function reducer<T>(state: HookState<T>, action: Action<T>): HookState<T> {
  switch (action.type) {
    case 'RESET':
      return {
        game: init(action.rawItems, action.now, action.getCard),
        isProcessingRate: false,
        rawItems: action.rawItems,
        lastTickNow: action.now,
      }
    case 'TICK': {
      const prev = state.game
      let nextGame = prev

      if (prev.t === 'no_more_due_cards_today__selected__front') {
        nextGame = no_more_due_cards_today__selected__front__tick(prev, action.now, action.getCard)
      } else if (prev.t === 'have_due_cards_today__selected__front') {
        nextGame = have_due_cards_today__selected__front__tick(prev, action.now, action.getCard)
      }

      if (nextGame === prev && state.lastTickNow === action.now) return state

      return { ...state, game: nextGame, lastTickNow: action.now }
    }
    case 'SELECT_CARD': {
      const prev = state.game

      if (prev.t === 'no_more_due_cards_today__nothing_selected') {
        return {
          ...state,
          game: no_more_due_cards_today__nothing_selected__selectCard(prev, action.index, action.now, action.getCard),
        }
      }

      return state
    }
    case 'REVEAL': {
      const prev = state.game

      if (prev.t === 'no_more_due_cards_today__selected__front') {
        return { ...state, game: no_more_due_cards_today__selected__front__reveal(prev) }
      }
      if (prev.t === 'have_due_cards_today__selected__front') {
        return { ...state, game: have_due_cards_today__selected__front__reveal(prev) }
      }

      return state
    }
    case 'SELECT_OTHER_CARD': {
      const prev = state.game
      let nextGame = prev

      if (prev.t === 'no_more_due_cards_today__selected__front') {
        nextGame = no_more_due_cards_today__selected__front__selectOtherCard(
          prev,
          action.index,
          action.now,
          action.getCard,
        )
      } else if (prev.t === 'no_more_due_cards_today__selected__back') {
        nextGame = no_more_due_cards_today__selected__back__selectOtherCard(
          prev,
          action.index,
          action.now,
          action.getCard,
        )
      } else if (prev.t === 'have_due_cards_today__selected__front') {
        nextGame = have_due_cards_today__selected__front__selectOtherCard(
          prev,
          action.index,
          action.now,
          action.getCard,
        )
      } else if (prev.t === 'have_due_cards_today__selected__back') {
        nextGame = have_due_cards_today__selected__back__selectOtherCard(prev, action.index, action.now, action.getCard)
      }

      if (state.game === nextGame) return state

      return { ...state, game: nextGame }
    }
    case 'RATE_START':
      if (state.isProcessingRate === true) return state

      return { ...state, isProcessingRate: true }
    case 'RATE_FAIL':
      if (state.isProcessingRate === false) return state

      return { ...state, isProcessingRate: false }
    case 'RATE_SUCCESS': {
      const prev = state.game
      let nextGame = prev

      if (prev.t === 'no_more_due_cards_today__selected__back') {
        nextGame = no_more_due_cards_today__selected__back__rate(
          prev,
          action.newCard,
          action.setItemCard,
          action.now,
          action.getCard,
        )
      } else if (prev.t === 'have_due_cards_today__selected__back') {
        nextGame = have_due_cards_today__selected__back__rate(
          prev,
          action.newCard,
          action.setItemCard,
          action.now,
          action.getCard,
        )
      }

      if (state.game === nextGame && state.isProcessingRate === false) return state

      return { ...state, game: nextGame, isProcessingRate: false }
    }
    default:
      assertNever(action)
  }
}

export function useAnkiGameManager<T>(
  rawItems: NonEmptyArray<T>,
  getCard: (item: T) => FavoriteItem,
  setItemCard: (item: T, newCard: FavoriteItem) => T,
): AnkiGameHookResult<T> {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)
  const toast = useAppToast()

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    game: init(rawItems, now, getCard),
    isProcessingRate: false,
    rawItems,
    lastTickNow: now,
  }))

  const gameState = state.game
  const isProcessingRate = state.isProcessingRate

  // getDerivedStateFromProps pattern using hooks https://github.com/facebook/react/issues/14738#issuecomment-461865371
  // also possible to use key={id}, but how?
  if (state.rawItems !== rawItems) {
    dispatch({ type: 'RESET', rawItems, now, getCard })
  } else if (state.lastTickNow !== now) {
    dispatch({ type: 'TICK', now, getCard })
  }

  const handleRate = useCallback(
    async (grade: Grade, currentItem: T) => {
      if (isProcessingRate) return
      dispatch({ type: 'RATE_START' })
      try {
        const card = getCard(currentItem)
        const newCard = await reviewCard(card.word, card.language, grade)

        dispatch({
          type: 'RATE_SUCCESS',
          newCard,
          setItemCard,
          now,
          getCard,
        })

        const updatedData = await getFavorites()

        favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(updatedData)
      } catch (e) {
        toast.error('Failed to rate' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        dispatch({ type: 'RATE_FAIL' })
      }
    },
    [isProcessingRate, getCard, setItemCard, now, toast],
  )

  return useMemo(() => {
    switch (gameState.t) {
      case 'no_more_due_cards_today__nothing_selected':
        return {
          t: gameState.t,
          state: gameState,
          selectCard: index => dispatch({ type: 'SELECT_CARD', index, now, getCard }),
        }

      case 'no_more_due_cards_today__selected__front':
        return {
          t: gameState.t,
          state: gameState,
          reveal: () => dispatch({ type: 'REVEAL' }),
          selectOtherCard: index => dispatch({ type: 'SELECT_OTHER_CARD', index, now, getCard }),
          tick: () => dispatch({ type: 'TICK', now, getCard }),
        }

      case 'no_more_due_cards_today__selected__back':
        return {
          t: gameState.t,
          state: gameState,
          rate: isProcessingRate ? undefined : (grade: Grade) => handleRate(grade, gameState.currentItem),
          selectOtherCard: index => dispatch({ type: 'SELECT_OTHER_CARD', index, now, getCard }),
        }

      case 'have_due_cards_today__selected__front':
        return {
          t: gameState.t,
          state: gameState,
          reveal: () => dispatch({ type: 'REVEAL' }),
          selectOtherCard: index => dispatch({ type: 'SELECT_OTHER_CARD', index, now, getCard }),
          tick: () => dispatch({ type: 'TICK', now, getCard }),
        }

      case 'have_due_cards_today__selected__back':
        return {
          t: gameState.t,
          state: gameState,
          rate: isProcessingRate ? undefined : (grade: Grade) => handleRate(grade, gameState.currentItem),
          selectOtherCard: index => dispatch({ type: 'SELECT_OTHER_CARD', index, now, getCard }),
        }
      default:
        return assertNever(gameState)
    }
  }, [gameState, isProcessingRate, now, getCard, handleRate])
}
