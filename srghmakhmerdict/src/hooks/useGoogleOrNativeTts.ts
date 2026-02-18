import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAppToast } from '../providers/ToastProvider'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { googleTtsResultToError } from '../utils/tts/google'
import { nativeTtsResultToError } from '../utils/tts/native'
import { executeTtsOrchestrator } from '../utils/tts/googleOrNative'
import { createExternalStore } from '../utils/createExternalStore'

const SPEAKING_STATE = { t: 'speaking' } as const
const DISABLED_STATE = { t: 'disabled' } as const

export type GoogleOrNativeTtsState =
  | typeof SPEAKING_STATE
  | typeof DISABLED_STATE
  | { t: 'ready'; speak: () => Promise<void> }

const speakingStore = createExternalStore<boolean>(false)

/**
 * A hook for manual TTS triggers.
 * Ignores the global 'autoReadMode' setting and uses 'google_then_native' strategy.
 */
export function useGoogleOrNativeTts(
  word: NonEmptyStringTrimmed | undefined,
  language: ToTranslateLanguage,
): GoogleOrNativeTtsState {
  const toast = useAppToast()

  const isSpeaking = useSyncExternalStore(speakingStore.subscribe, speakingStore.getSnapshot)

  const speak = useCallback(async () => {
    if (!word) {
      throw new Error('useGoogleOrNativeTts.speak called with empty word')
    }

    if (speakingStore.getSnapshot()) {
      return // Prevent concurrent playback from same hook instance
    }

    speakingStore.replaceStateWith_emitOnlyIfDifferentRef(true)

    try {
      // We hardcode 'google_then_native' because this is a manual user action
      const result = await executeTtsOrchestrator(word, language, 'google_then_native')

      if (result.t === 'success' || result.t === 'aborted') return

      // Handle Errors
      switch (result.t) {
        case 'google_error': {
          const err = googleTtsResultToError(result.error)
          if (err) toast.error(err.title, err.description)
          break
        }
        case 'native_error': {
          const err = nativeTtsResultToError(result.error)
          if (err) toast.error(err.title, err.description)
          break
        }
        case 'google_then_native_both_error': {
          const gErr = googleTtsResultToError(result.googleError)
          const nErr = nativeTtsResultToError(result.nativeError)
          toast.error(
            nErr?.title ?? ('TTS Failed' as NonEmptyStringTrimmed),
            `${gErr?.description ?? ''} | ${nErr?.description ?? ''}` as NonEmptyStringTrimmed,
          )
          break
        }
      }
    } finally {
      speakingStore.replaceStateWith_emitOnlyIfDifferentRef(false)
    }
  }, [word, language, toast])

  return useMemo(() => {
    if (!word) return DISABLED_STATE
    if (isSpeaking) return SPEAKING_STATE

    return { t: 'ready', speak }
  }, [word, isSpeaking, speak])
}
