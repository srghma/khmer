import { useCallback } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useAppToast } from '../../providers/ToastProvider'
import { unknown_to_errorMessage } from '../../utils/errorMessage'

type DbDeleteFn = (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<boolean>
type DbClearFn = () => Promise<void>

export function useListLogic(deleteFn: DbDeleteFn, clearFn: DbClearFn) {
  const toast = useAppToast()

  // 1. Handle Delete
  const handleDelete = useCallback(
    async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      try {
        const success = await deleteFn(word, language)

        if (!success) throw new Error('Action was not successful. Nothing to delete?')
      } catch (e: unknown) {
        toast.error('Failed to delete item' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      }
    },
    [deleteFn, toast],
  )

  // 2. Handle Clear All
  const handleClearAll = useCallback(async () => {
    try {
      await clearFn()
      toast.success('Cleared successfully' as NonEmptyStringTrimmed)
    } catch (e: unknown) {
      toast.error('Failed to clear items' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    }
  }, [clearFn, toast])

  return {
    handleDelete,
    handleClearAll,
  }
}
