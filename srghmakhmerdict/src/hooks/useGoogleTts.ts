import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAppToast } from '../providers/ToastProvider'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { executeGoogleTts, googleTtsResultToError } from '../utils/tts/google'
import { createStore } from '../utils/createStore'

const GOOGLE_TTS_OFFLINE = { t: 'offline' } as const
const GOOGLE_TTS_SPEAKING = { t: 'online_and_speaking' } as const

export type GoogleTtsState =
  | typeof GOOGLE_TTS_OFFLINE
  | typeof GOOGLE_TTS_SPEAKING
  | { t: 'online'; speak: () => Promise<void> }

const googleSpeakingStore = createStore<boolean>(false, (x: boolean, y: boolean) => x === y)

export function useGoogleTts(word: NonEmptyStringTrimmed | undefined, mode: ToTranslateLanguage): GoogleTtsState {
  const toast = useAppToast()

  // No useEffect, no manual listener management
  const isSpeaking = useSyncExternalStore(googleSpeakingStore.subscribe, googleSpeakingStore.getSnapshot)

  const speak = useCallback(async () => {
    if (!word) throw new Error('useGoogleTts.speak was called with empty word - expected - disable button')
    if (googleSpeakingStore.getSnapshot()) {
      throw new Error('useGoogleTts.speak was called while speaking - expected - disable button')
    }

    googleSpeakingStore.set(true)
    try {
      const result = await executeGoogleTts(word, mode)
      const err = googleTtsResultToError(result)

      if (err) toast.error(err.title, err.description)
    } finally {
      googleSpeakingStore.set(false)
    }
  }, [word, mode, toast])

  return useMemo(() => {
    if (!word) return GOOGLE_TTS_OFFLINE
    if (isSpeaking) return GOOGLE_TTS_SPEAKING

    return { t: 'online', speak }
  }, [word, isSpeaking, speak])
}
