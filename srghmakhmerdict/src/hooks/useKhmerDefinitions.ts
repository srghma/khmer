import { useEffect, useReducer } from 'react'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Set_isNonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { type KhmerDefCoreAction, startKhmerDefinitionFetch } from './useEnhancedSegments/core'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

// --- State Shape ---

export type UseKhmerDefinitionsResult =
  | { t: 'idle' }
  | { t: 'loading' }
  | { t: 'request_error'; e: Error }
  | { t: 'success'; definitions: NonEmptyRecord<TypedKhmerWord, NonEmptyStringTrimmed> }

const initialState: UseKhmerDefinitionsResult = { t: 'idle' }

// --- Hook Actions ---
// Combines Core Actions with Hook-specific lifecycle actions (RESET)
type HookAction = KhmerDefCoreAction | { type: 'RESET' }

// --- Reducer ---

const reducer = (_state: UseKhmerDefinitionsResult, action: HookAction): UseKhmerDefinitionsResult => {
  switch (action.type) {
    // Core Actions
    case 'FETCH_START':
      return { t: 'loading' }
    case 'FETCH_SUCCESS':
      return { t: 'success', definitions: action.payload }
    case 'FETCH_ERROR':
      return { t: 'request_error', e: action.error }

    // Lifecycle Actions
    case 'RESET':
      return initialState

    default:
      assertNever(action)
  }
}

// --- Hook ---

export const useKhmerDefinitions = (
  uniqueWords: ReadonlySet<TypedKhmerWord> | undefined,
): UseKhmerDefinitionsResult => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    // 1. Validation Logic
    if (!uniqueWords || !Set_isNonEmptySet(uniqueWords)) {
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
