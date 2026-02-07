import useSWR from 'swr'
import { useCallback } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useAppToast } from '../../providers/ToastProvider'
import {
  type NonEmptyMap,
  Map_toNonEmptyMap_orUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { unknown_to_errorMessage } from '../../utils/errorMessage'

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

  // 1. Fetching & Cache Management
  const {
    data: items,
    mutate,
    isLoading,
  } = useSWR(typeLabel, fetchFn, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  // 2. Delete with Boolean handling & Optimistic UI
  const handleDelete = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      if (!items) return

      const nextMap = new Map(items)

      nextMap.delete(word)
      const nextData = Map_toNonEmptyMap_orUndefined(nextMap)

      try {
        await mutate(
          async () => {
            const success = await deleteFn(word, language)

            // If deleteFn returns false, throw to trigger rollback
            if (!success) throw new Error('Action was not successful. Nothing to delete?')

            return nextData
          },
          {
            optimisticData: nextData,
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          },
        )
      } catch (e: unknown) {
        toast.error('Failed to delete item', unknown_to_errorMessage(e))
      }
    },
    [items, deleteFn, mutate, toast],
  )

  // 3. Clear All Logic (Triggered by Modal)
  const handleClearAll = useCallback(async () => {
    try {
      await mutate(
        async () => {
          await clearFn()

          return undefined
        },
        {
          optimisticData: undefined,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      )
      toast.success('Cleared successfully')
    } catch (e: unknown) {
      toast.error('Failed to clear items', unknown_to_errorMessage(e))
    }
  }, [clearFn, mutate, toast])

  return {
    items,
    loading: isLoading,
    handleDelete,
    handleClearAll,
  }
}
