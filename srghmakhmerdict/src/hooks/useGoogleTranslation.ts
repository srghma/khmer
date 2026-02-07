import { useCallback, useReducer } from 'react'
import {
  memoizeAsync3_LRU_cachePromise,
  memoizeAsync3_LRU_cachePromise__default_keyMaker,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { translate, type TranslateResultSuccess } from '../utils/googleTranslate/googleTranslate'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import type { FromTranslateLanguage } from '../utils/googleTranslate/fromTranslateLanguage'

// Cache setup
const cachedTranslate = memoizeAsync3_LRU_cachePromise(translate, memoizeAsync3_LRU_cachePromise__default_keyMaker, 40)

const STATE_IDLE = { t: 'idle' } as const
const STATE_LOADING = { t: 'loading' } as const

export type GoogleTranslationState =
  | typeof STATE_IDLE
  | typeof STATE_LOADING
  | { t: 'success'; result: TranslateResultSuccess }
  | { t: 'error'; title: string; description?: string }

type Action =
  | { type: 'INIT' }
  | { type: 'SUCCESS'; result: TranslateResultSuccess }
  | { type: 'ERROR'; title: string; description?: string }
  | { type: 'CLEAR' }

function reducer(_state: GoogleTranslationState, action: Action): GoogleTranslationState {
  switch (action.type) {
    case 'INIT':
      return STATE_LOADING
    case 'SUCCESS':
      return { t: 'success', result: action.result }
    case 'ERROR':
      return { t: 'error', title: action.title, description: action.description }
    case 'CLEAR':
      return STATE_IDLE
    default:
      assertNever(action)
  }
}

export const useGoogleTranslation = (
  text: NonEmptyStringTrimmed | undefined,
  from: FromTranslateLanguage,
  to: ToTranslateLanguage,
) => {
  const [state, dispatch] = useReducer(reducer, STATE_IDLE)

  const performTranslate = useCallback(async () => {
    if (!text) throw new Error('Button should be disabled if text is empty')

    dispatch({ type: 'INIT' })

    try {
      const res = await cachedTranslate(text, from, to)

      // UNWRAP the Except type
      if (res.t === 'ok') {
        // res.v is the TranslateResultSuccess
        dispatch({ type: 'SUCCESS', result: res.v })
      } else {
        // res.error is the TranslateResultError { status, statusText }
        const title = 'Translation Error'
        const description = `Server Error (${res.error.status}): ${res.error.statusText}`

        dispatch({ type: 'ERROR', title, description })
      }
    } catch (err: unknown) {
      const msg = unknown_to_errorMessage(err)
      const title = 'Translation Error'

      dispatch({ type: 'ERROR', title, description: msg })
    }
  }, [text, from, to])

  const clearResult = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  // Return the enhanced state object directly
  return {
    state,
    performTranslate,
    clearResult,
  }
}
