import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  addToHistory as addToHistoryDb,
  removeHistoryItem as removeHistoryItemDb,
  deleteAllHistory as deleteAllHistoryDb,
  getHistory as getHistoryDb,
  type HistoryItem,
} from '../db/history'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useAppToast } from './ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'

interface HistoryContextType {
  history: HistoryItem[]
  loading: boolean
  addToHistory: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<void>
  removeHistoryItem: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
  deleteAllHistory: () => Promise<void>
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export const useHistory = () => {
  const context = useContext(HistoryContext)

  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }

  return context
}

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const mutex = useRef<Promise<unknown>>(Promise.resolve())
  const toast = useAppToast()

  useEffect(() => {
    let mounted = true

    getHistoryDb()
      .then(data => {
        if (mounted) {
          setHistory(data)
          setLoading(false)
        }
      })
      .catch(e => {
        if (mounted) {
          toast.error('Failed to load history' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
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
    mutex.current = resultPromise.catch(() => {})

    return resultPromise
  }, [])

  const addToHistory = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        // Optimistic: Add to top, remove duplicates
        const newItem: HistoryItem = { word, language }
        const prevState = history

        setHistory(prev => [newItem, ...prev.filter(item => !(item.word === word && item.language === language))])

        try {
          await addToHistoryDb(word, language)
        } catch (e) {
          setHistory(prevState)
          throw e
        }
      })
    },
    [history, runMutation],
  )

  const removeHistoryItem = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return runMutation(async () => {
        const prevState = history

        setHistory(prev => prev.filter(item => !(item.word === word && item.language === language)))

        try {
          const result = await removeHistoryItemDb(word, language)

          return result
        } catch (e) {
          setHistory(prevState)
          throw e
        }
      })
    },
    [history, runMutation],
  )

  const deleteAllHistory = useCallback(async () => {
    return runMutation(async () => {
      const prevState = history

      setHistory([])

      try {
        await deleteAllHistoryDb()
      } catch (e) {
        setHistory(prevState)
        throw e
      }
    })
  }, [history, runMutation])

  const value = useMemo(
    () => ({
      history,
      loading,
      addToHistory,
      removeHistoryItem,
      deleteAllHistory,
    }),
    [history, loading, addToHistory, removeHistoryItem, deleteAllHistory],
  )

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}
