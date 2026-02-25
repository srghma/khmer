import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  addFavorite as addFavoriteDb,
  removeFavorite as removeFavoriteDb,
  toggleFavorite as toggleFavoriteDb,
  deleteAllFavorites as deleteAllFavoritesDb,
  getFavorites as getFavoritesDb,
} from '../db/favorite'
import { reviewCard as reviewCardDb } from '../db/favorite/anki'
import { updateFavoriteHtml as updateFavoriteHtmlDb } from '../db/favorite/anki_html'
import { reviewCard_calculateReviewUpdates } from '../components/Anki/utils'
import { FavoriteItem_mk, type FavoriteItem } from '../db/favorite/item'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import type { Grade } from 'femto-fsrs'
import { useAppToast } from './ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { importWordsToAnki as importWordsToAnkiDb } from '../db/favorite/anki_import'
import type { MaybeFrontBack } from '../db/favorite/bulkInsertFavorites_front_back_html'
import type { PartitionedMaps_Split_Imported } from '../db/favorite/anki_import/process'
import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'

interface FavoritesContextType {
  favorites: FavoriteItem[]
  loading: boolean
  addFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<void>
  removeFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  toggleFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  deleteAllFavorites: () => Promise<void>
  reviewCard: (word: NonEmptyStringTrimmed, language: DictionaryLanguage, grade: Grade) => Promise<FavoriteItem>
  isFavorite: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => boolean
  updateFavoriteHtml: (
    word: NonEmptyStringTrimmed,
    language: DictionaryLanguage,
    update_to: 'additional_html_front' | 'additional_html_back',
    data: NonEmptyStringTrimmed | undefined,
  ) => Promise<void>
  importFavorites: (
    input: NonEmptyStringTrimmed,
    separator: Char,
  ) => Promise<PartitionedMaps_Split_Imported<MaybeFrontBack | undefined>>
  // refreshFavorites: () => Promise<void>
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

  const refreshFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFavoritesDb()

      setFavorites(data)
    } catch (e) {
      toast.error('Failed to load favorites' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  const runMutation = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const resultPromise = mutex.current.then(async () => {
      return fn()
    })

    mutex.current = resultPromise.catch(() => {})

    return resultPromise
  }, [])

  const addFavorite = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        // Optimistic update: New favorites via UI have no custom HTML
        const newItem = FavoriteItem_mk(word, language, Date.now(), undefined, undefined)
        const prevState = favorites

        setFavorites(prev => [newItem, ...prev.filter(item => !(item.word === word && item.language === language))])

        try {
          await addFavoriteDb(word, language, Date.now(), undefined, undefined)
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
          // Optimistic update: New favorites via UI have no custom HTML
          const newItem = FavoriteItem_mk(word, language, Date.now(), undefined, undefined)

          optimisticState = [newItem, ...favorites]
        }
        setFavorites(optimisticState)

        try {
          const result = await toggleFavoriteDb(word, language, Date.now(), undefined, undefined)

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
        const updates = reviewCard_calculateReviewUpdates(currentItem, grade, now)
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

  const updateFavoriteHtml = useCallback(
    async (
      word: NonEmptyStringTrimmed,
      language: DictionaryLanguage,
      update_to: 'additional_html_front' | 'additional_html_back',
      data: NonEmptyStringTrimmed | undefined,
    ) => {
      return runMutation(async () => {
        const prevState = favorites

        // Optimistic Update
        setFavorites(prev =>
          prev.map(item => (item.word === word && item.language === language ? { ...item, [update_to]: data } : item)),
        )

        try {
          await updateFavoriteHtmlDb(word, language, update_to, data)
        } catch (e) {
          setFavorites(prevState)
          toast.error('Failed to update note' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [favorites, runMutation, toast],
  )

  const importFavorites = useCallback(
    async (input: NonEmptyStringTrimmed, separator: Char) => {
      return runMutation(async () => {
        try {
          const res = await importWordsToAnkiDb(input, separator)

          // Re-fetch data from DB
          const newData = await getFavoritesDb()

          // Smart update: Only replace objects that have actually changed
          // to preserve referential integrity for unchanged items
          setFavorites(prev => {
            return newData.map(newItem => {
              const existing = prev.find(p => p.word === newItem.word && p.language === newItem.language)

              if (
                existing &&
                existing.additional_html_front === newItem.additional_html_front &&
                existing.additional_html_back === newItem.additional_html_back &&
                existing.last_review === newItem.last_review
              ) {
                return existing // Keep old reference
              }

              return newItem
            })
          })

          return res
        } catch (e) {
          toast.error('Import failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
          throw e
        }
      })
    },
    [runMutation, toast],
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
      refreshFavorites,
      updateFavoriteHtml,
      importFavorites,
    }),
    [
      favorites,
      loading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      deleteAllFavorites,
      reviewCard,
      isFavorite,
      // refreshFavorites,
      updateFavoriteHtml,
      importFavorites,
    ],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
