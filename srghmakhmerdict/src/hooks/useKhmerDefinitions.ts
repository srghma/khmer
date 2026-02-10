import { useEffect, useReducer } from 'react'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { type KhmerDefCoreAction, startKhmerDefinitionFetch } from './useEnhancedSegments/core'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { ShortDefinition } from '../db/dict'

// --- State Shape ---

export type UseKhmerDefinitionsResult =
  | { t: 'idle' }
  | { t: 'loading' }
  | { t: 'request_error'; e: NonEmptyStringTrimmed | undefined }
  | { t: 'success'; definitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> }

const UseKhmerDefinitionsResult_idle: UseKhmerDefinitionsResult = { t: 'idle' }
const UseKhmerDefinitionsResult_loading: UseKhmerDefinitionsResult = { t: 'loading' }

// --- Hook Actions ---
// Combines Core Actions with Hook-specific lifecycle actions (RESET)
type HookAction = KhmerDefCoreAction | { type: 'RESET' }

// --- Reducer ---

const reducer = (state: UseKhmerDefinitionsResult, action: HookAction): UseKhmerDefinitionsResult => {
  switch (action.type) {
    // Core Actions
    case 'FETCH_START':
      return UseKhmerDefinitionsResult_loading

    case 'FETCH_SUCCESS':
      // Optimization: If already success with exact same definitions object
      if (state.t === 'success' && state.definitions === action.payload) return state

      return { t: 'success', definitions: action.payload }

    case 'FETCH_ERROR':
      // Optimization: If already error with exact same error object
      if (state.t === 'request_error' && state.e === action.error) return state

      return { t: 'request_error', e: action.error }

    // Lifecycle Actions
    case 'RESET':
      return UseKhmerDefinitionsResult_idle

    default:
      assertNever(action)
  }
}

// --- Hook ---

export const useKhmerDefinitions = (
  uniqueWords: NonEmptySet<TypedKhmerWord> | undefined,
): UseKhmerDefinitionsResult => {
  const [state, dispatch] = useReducer(reducer, UseKhmerDefinitionsResult_idle)

  useEffect(() => {
    // 1. Validation Logic
    if (!uniqueWords) {
      if (state.t !== 'idle') dispatch({ type: 'RESET' })

      return
    }

    // 2. Delegate to Core Logic
    // We pass the dispatch function. The Core emits CoreActions, which are a subset of HookActions.
    const unsubscribe = startKhmerDefinitionFetch(uniqueWords, dispatch)

    // 3. Cleanup
    return () => {
      unsubscribe()
    }
  }, [uniqueWords])

  return state
}
