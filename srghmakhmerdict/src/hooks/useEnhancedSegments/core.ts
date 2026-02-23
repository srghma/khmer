import { getKmWordsDetailShort, type ShortDefinitionKm } from '../../db/dict'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { memoizeAsyncSetOfStringsLru } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'

// --- Actions (Core Fetch Cycle) ---

export type KhmerDefCoreAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: NonEmptyRecord<TypedKhmerWord, ShortDefinitionKm | null> }
  | { type: 'FETCH_ERROR'; error: NonEmptyStringTrimmed | undefined }

// --- Types ---

export type CoreDispatcher = (action: KhmerDefCoreAction) => void
export type Unsubscribe = () => void

// --- Core Implementation ---

const getKmWordsDetailShort_memoized = memoizeAsyncSetOfStringsLru(getKmWordsDetailShort, 3000)

/**
 * Starts the fetch process for a valid set of words.
 * Emits strictly fetch-related actions.
 */
export const startKhmerDefinitionFetch = (
  uniqueWords: NonEmptySet<TypedKhmerWord>,
  dispatch: CoreDispatcher,
): Unsubscribe => {
  let active = true

  // 1. Emit Start Event
  dispatch({ type: 'FETCH_START' })

  // 2. Perform Async Work
  getKmWordsDetailShort_memoized(uniqueWords)
    .then(res => {
      if (active) {
        dispatch({ type: 'FETCH_SUCCESS', payload: res })
      }
    })
    .catch((e: unknown) => {
      if (active) {
        dispatch({ type: 'FETCH_ERROR', error: unknown_to_errorMessage(e) })
      }
    })

  // 3. Return Cancellation
  return () => {
    active = false
  }
}
