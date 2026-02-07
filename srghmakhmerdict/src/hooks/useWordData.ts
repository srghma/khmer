import { useEffect, useCallback, useReducer } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import * as FavDb from '../db/favourite'
import * as HistoryDb from '../db/history'
import * as DictDb from '../db/dict'
import { type DictionaryLanguage } from '../types'
import { type WordDetailEnOrRuOrKm } from '../db/dict'
import { useAppToast } from '../providers/ToastProvider'

// Constants for optimization
const STATE_LOADING = { t: 'loading' } as const
const STATE_NOT_FOUND = { t: 'not_found' } as const

// Global sync mechanism
const FAV_EVENT = 'fav-status-changed'
const activeLocks = new Map<string, Promise<void>>()

type State = typeof STATE_LOADING | typeof STATE_NOT_FOUND | { t: 'found'; data: WordDetailEnOrRuOrKm; isFav: boolean }

type Action =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_NOT_FOUND' }
  | { type: 'FETCH_SUCCESS'; data: WordDetailEnOrRuOrKm; isFav: boolean }
  | { type: 'SET_FAV'; isFav: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_INIT':
      return STATE_LOADING
    case 'FETCH_NOT_FOUND':
      return STATE_NOT_FOUND
    case 'FETCH_SUCCESS':
      return { t: 'found', data: action.data, isFav: action.isFav }
    case 'SET_FAV':
      return state.t === 'found' ? { ...state, isFav: action.isFav } : state
    default:
      return state
  }
}

export type WordDataResult =
  | typeof STATE_LOADING
  | typeof STATE_NOT_FOUND
  | {
      t: 'found'
      data: WordDetailEnOrRuOrKm
      isFav: boolean
      toggleFav: () => Promise<void>
    }

export function useWordData(word: NonEmptyStringTrimmed, mode: DictionaryLanguage): WordDataResult {
  const toast = useAppToast()
  const [state, dispatch] = useReducer(reducer, STATE_LOADING)

  const lockKey = `${mode}:${word}`

  // 1. Sync state across instances via CustomEvent
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail.key === lockKey) {
        dispatch({ type: 'SET_FAV', isFav: e.detail.isFav })
      }
    }

    window.addEventListener(FAV_EVENT, handler)

    return () => window.removeEventListener(FAV_EVENT, handler)
  }, [lockKey])

  // 2. Initial Data Loading
  useEffect(() => {
    let active = true

    dispatch({ type: 'FETCH_INIT' })

    const load = async () => {
      try {
        const [isFav, data] = await Promise.all([
          FavDb.isFavorite(word, mode),
          DictDb.getWordDetailByMode(mode, word, false),
        ])

        if (!active) return

        if (data) {
          HistoryDb.addToHistory(word, mode)
          dispatch({ type: 'FETCH_SUCCESS', data, isFav })
        } else {
          dispatch({ type: 'FETCH_NOT_FOUND' })
        }
      } catch (e: any) {
        if (active) {
          dispatch({ type: 'FETCH_NOT_FOUND' })
          toast.error('Error loading word details', e.message || String(e))
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [word, mode, toast])

  // 3. Optimized Toggle
  const toggleFav = useCallback(async () => {
    if (state.t !== 'found' || activeLocks.has(lockKey)) return

    const originalFav = state.isFav
    const targetFav = !originalFav

    // Optimistic Update & Broadcast to other components
    const broadcast = (isFav: boolean) => {
      window.dispatchEvent(new CustomEvent(FAV_EVENT, { detail: { key: lockKey, isFav } }))
    }

    broadcast(targetFav)

    const promise = (async () => {
      try {
        const newState = await FavDb.toggleFavorite(word, mode, toast.warn)

        // Ensure UI is in sync with actual DB result (in case of double-toggle logic)
        if (newState !== targetFav) broadcast(newState)
      } catch (e: any) {
        // Revert on error
        broadcast(originalFav)
        toast.error(originalFav ? 'Failed to remove favorite' : 'Failed to add favorite', e.message)
      } finally {
        activeLocks.delete(lockKey)
      }
    })()

    activeLocks.set(lockKey, promise)
    await promise
  }, [state, word, mode, toast, lockKey])

  if (state.t === 'found') {
    return { ...state, toggleFav }
  }

  return state
}
