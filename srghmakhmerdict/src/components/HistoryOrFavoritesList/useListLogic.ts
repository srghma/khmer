import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useAppToast } from '../../providers/ToastProvider'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import type { ExternalStore } from '../../utils/createExternalStore'

type DbFetchFn<T> = () => Promise<T[]>
type DbDeleteFn = (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
type DbClearFn = () => Promise<void>

export function useListLogic<
  T extends {
    readonly word: NonEmptyStringTrimmed
    readonly language: DictionaryLanguage
  },
>(
  fetchFn: DbFetchFn<T>,
  deleteFn: DbDeleteFn,
  clearFn: DbClearFn,
  typeLabel: 'history' | 'favorites',
  store: ExternalStore<T[]>,
) {
  const toast = useAppToast()

  // 1. Subscribe to the external store
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot)

  // 2. Local loading state
  const [loading, setLoading] = useState(!items)

  // 3. Initial Fetch (only if store is empty)
  useEffect(() => {
    let active = true

    if (items !== undefined) return // Already cached

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchFn()

        if (active) store.replaceStateWith_emitOnlyIfDifferentRef(data)
      } catch (e: unknown) {
        toast.error(`Failed to load ${typeLabel}` as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [fetchFn, typeLabel, store, toast, items])

  // 4. Handle Delete (Manual Optimistic Update)
  const handleDelete = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      const prevItems = store.getSnapshot()

      if (!prevItems) return

      // Optimistic Update
      const nextItems = prevItems.filter(item => !(item.word === word && item.language === language))

      store.replaceStateWith_emitOnlyIfDifferentRef(nextItems)

      try {
        const success = await deleteFn(word, language)

        if (!success) throw new Error('Action was not successful. Nothing to delete?')
      } catch (e: unknown) {
        // Rollback on error
        store.replaceStateWith_emitOnlyIfDifferentRef(prevItems)
        toast.error('Failed to delete item' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      }
    },
    [deleteFn, store, toast],
  )

  // 5. Handle Clear All
  const handleClearAll = useCallback(async () => {
    const prevItems = store.getSnapshot()

    store.replaceStateWith_emitOnlyIfDifferentRef([]) // Optimistic clear

    try {
      await clearFn()
      toast.success('Cleared successfully' as NonEmptyStringTrimmed)
    } catch (e: unknown) {
      store.replaceStateWith_emitOnlyIfDifferentRef(prevItems) // Rollback
      toast.error('Failed to clear items' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    }
  }, [clearFn, store, toast])

  return {
    items,
    loading,
    handleDelete,
    handleClearAll,
  }
}
