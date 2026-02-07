import { useState, useEffect, useCallback } from 'react'

// Types & Utils
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useAppToast } from '../../providers/ToastProvider'
import {
  type NonEmptyMap,
  Map_toNonEmptyMap_orUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'

const LIST_CACHE: Record<'history' | 'favorites', NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined> =
  { history: undefined, favorites: undefined }

type DbFetchFn = () => Promise<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined>
type DbDeleteFn = (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
type DbClearFn = () => Promise<void>

export function useListLogic(
  fetchFn: DbFetchFn,
  deleteFn: DbDeleteFn,
  clearFn: DbClearFn,
  typeLabel: 'history' | 'favorites',
) {
  const toast = useAppToast()
  const [items, setItems] = useState<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined>(
    () => LIST_CACHE[typeLabel],
  )
  const [loading, setLoading] = useState(() => !LIST_CACHE[typeLabel])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!LIST_CACHE[typeLabel]) setLoading(true)
      try {
        const res = await fetchFn()

        LIST_CACHE[typeLabel] = res
        if (active) setItems(res)
      } catch (e: any) {
        toast.error(`Loading ${typeLabel} failed`, e.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [fetchFn, toast, typeLabel])

  const handleDelete = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      if (!items) return

      const prevItems = items
      // Create new map to trigger React re-render
      const nextMap = new Map(items)

      nextMap.delete(word)

      const nextNonEmpty = Map_toNonEmptyMap_orUndefined(nextMap)

      setItems(nextNonEmpty)
      LIST_CACHE[typeLabel] = nextNonEmpty

      try {
        await deleteFn(word, language)
      } catch (e: any) {
        toast.error('Failed to delete item', e.message)
        setItems(prevItems)
        LIST_CACHE[typeLabel] = prevItems
      }
    },
    [items, deleteFn, toast, typeLabel],
  )

  const handleClearAll = useCallback(async () => {
    if (!items || items.size === 0) return
    if (!window.confirm('Are you sure you want to clear all items?')) return

    const prevItems = items

    setItems(undefined)
    LIST_CACHE[typeLabel] = undefined

    try {
      await clearFn()
      toast.success('Cleared successfully')
    } catch (e: any) {
      setItems(prevItems)
      LIST_CACHE[typeLabel] = prevItems
      toast.error('Failed to clear items', e.message)
    }
  }, [items, typeLabel, clearFn, toast])

  return { items, loading, handleDelete, handleClearAll }
}
