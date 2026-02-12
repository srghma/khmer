import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  addFavorite as addFavoriteDb,
  removeFavorite as removeFavoriteDb,
  toggleFavorite as toggleFavoriteDb,
  deleteAllFavorites as deleteAllFavoritesDb,
  getFavorites as getFavoritesDb,
} from '../db/favorite'
import { calculateReviewUpdates, reviewCard as reviewCardDb } from '../db/favorite/anki'
import { FavoriteItem_mk, type FavoriteItem } from '../db/favorite/item'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import type { Grade } from 'femto-fsrs'
import { useAppToast } from './ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'

interface FavoritesContextType {
  favorites: FavoriteItem[]
  loading: boolean
  addFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<void>
  removeFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  toggleFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  deleteAllFavorites: () => Promise<void>
  reviewCard: (word: NonEmptyStringTrimmed, language: DictionaryLanguage, grade: Grade) => Promise<FavoriteItem>
  isFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export const useFavorites = () => {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }

  return context
}

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const mutex = useRef<Promise<unknown>>(Promise.resolve())
  const toast = useAppToast()

  useEffect(() => {
    let mounted = true

    getFavoritesDb()
      .then(data => {
        if (mounted) {
          setFavorites(data)
          setLoading(false)
        }
      })
      .catch(e => {
        if (mounted) {
          toast.error('Failed to load favorites' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [toast])

  const runMutation = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    // Chain the new mutation to the existing promise chain
    const resultPromise = mutex.current.then(async () => {
      return fn()
    })

    // Update the mutex to wait for this new mutation, catching errors to ensure the chain continues
    mutex.current = resultPromise.catch(() => { })

    return resultPromise
  }, [])

  const addFavorite = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        // Optimistic update
        const newItem = FavoriteItem_mk(word, language, Date.now())
        const prevState = favorites

        setFavorites(prev => [newItem, ...prev.filter(item => !(item.word === word && item.language === language))])

        try {
          await addFavoriteDb(word, language)
        } catch (e) {
          setFavorites(prevState)
          toast.error('Failed to add favorite' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [favorites, runMutation, toast],
  )

  const removeFavorite = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        const prevState = favorites

        setFavorites(prev => prev.filter(item => !(item.word === word && item.language === language)))

        try {
          const result = await removeFavoriteDb(word, language)

          return result
        } catch (e) {
          setFavorites(prevState)
          toast.error('Failed to remove favorite' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [favorites, runMutation, toast],
  )

  const toggleFavorite = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        const prevState = favorites
        const existingIndex = favorites.findIndex(item => item.word === word && item.language === language)
        const exists = existingIndex !== -1

        let optimisticState

        if (exists) {
          optimisticState = favorites.filter((_, idx) => idx !== existingIndex)
        } else {
          const newItem = FavoriteItem_mk(word, language, Date.now())

          optimisticState = [newItem, ...favorites]
        }
        setFavorites(optimisticState)

        try {
          const result = await toggleFavoriteDb(word, language)

          return result
        } catch (e) {
          setFavorites(prevState)
          toast.error('Failed to toggle favorite' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [favorites, runMutation, toast],
  )

  const deleteAllFavorites = useCallback(async () => {
    return runMutation(async () => {
      const prevState = favorites

      setFavorites([])

      try {
        await deleteAllFavoritesDb()
      } catch (e) {
        setFavorites(prevState)
        toast.error('Failed to delete all favorites' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        throw e
      }
    })
  }, [favorites, runMutation, toast])

  const reviewCard = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage, grade: Grade) => {
      return runMutation(async () => {
        const prevState = favorites
        const itemIndex = favorites.findIndex(i => i.word === word && i.language === language)

        if (itemIndex === -1) {
          throw new Error('Item not found in store')
        }

        const currentItem = favorites[itemIndex]

        if (!currentItem) {
          throw new Error('Item not found in store')
        }

        const now = Date.now()
        const updates = calculateReviewUpdates(currentItem, grade, now)
        const optimisticItem = { ...currentItem, ...updates }

        const optimisticState = [...favorites]

        optimisticState[itemIndex] = optimisticItem
        setFavorites(optimisticState)

        try {
          const result = await reviewCardDb(word, language, grade)

          return result
        } catch (e) {
          setFavorites(prevState)
          toast.error('Failed to review card' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [favorites, runMutation, toast],
  )

  const isFavorite = useCallback(
    (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return favorites.some(item => item.word === word && item.language === language)
    },
    [favorites],
  )

  const value = useMemo(
    () => ({
      favorites,
      loading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      deleteAllFavorites,
      reviewCard,
      isFavorite,
    }),
    [favorites, loading, addFavorite, removeFavorite, toggleFavorite, deleteAllFavorites, reviewCard, isFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
