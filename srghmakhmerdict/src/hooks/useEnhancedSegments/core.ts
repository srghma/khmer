import { getKmWordsDetailShort } from '../../db/dict'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { Record_stripNullValuesOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'

// --- Actions (Core Fetch Cycle) ---

export type KhmerDefCoreAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: NonEmptyRecord<TypedKhmerWord, NonEmptyStringTrimmed> }
  | { type: 'FETCH_ERROR'; error: Error }

// --- Types ---

export type CoreDispatcher = (action: KhmerDefCoreAction) => void
export type Unsubscribe = () => void

// --- Core Implementation ---

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
  getKmWordsDetailShort(uniqueWords)
    .then(res => {
      const cleanRes = Record_stripNullValuesOrThrow(res) // all words should be found

      if (active) {
        dispatch({ type: 'FETCH_SUCCESS', payload: cleanRes })
      }
    })
    .catch(err => {
      if (active) {
        dispatch({ type: 'FETCH_ERROR', error: err })
      }
    })

  // 3. Return Cancellation
  return () => {
    active = false
  }
}
