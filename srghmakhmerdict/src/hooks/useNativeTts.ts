import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { executeNativeTts, nativeTtsResultToError } from '../utils/tts/native'
import { useAppToast } from '../providers/ToastProvider'
import type { BCP47LanguageTagName } from '../utils/my-bcp-47'
import { createStore } from '../utils/createStore'

const NATIVE_TTS_SPEAKING = { isSpeaking: true } as const

export type NativeTtsState = typeof NATIVE_TTS_SPEAKING | { isSpeaking: false; speak: () => Promise<void> }

const nativeSpeakingStore = createStore<boolean>(false, (x: boolean, y: boolean) => x === y)

export function useNativeTts(word: NonEmptyStringTrimmed | undefined, lang: BCP47LanguageTagName): NativeTtsState {
  const toast = useAppToast()

  // Subscribe to the global native speaking state
  const isSpeaking = useSyncExternalStore(nativeSpeakingStore.subscribe, nativeSpeakingStore.getSnapshot)

  const speak = useCallback(async () => {
    if (!word) throw new Error('useNativeTts.speak was called with empty word - expected - disable button')

    if (nativeSpeakingStore.getSnapshot()) {
      throw new Error('useNativeTts.speak was called while speaking - expected - disable button')
    }

    nativeSpeakingStore.set(true)
    try {
      const result = await executeNativeTts(word, lang)

      const err = nativeTtsResultToError(result)

      if (err) {
        toast.error(err.title, err.description)
      }
    } finally {
      nativeSpeakingStore.set(false)
    }
  }, [word, lang, toast])

  return useMemo((): NativeTtsState => {
    if (isSpeaking) return NATIVE_TTS_SPEAKING

    return {
      isSpeaking: false,
      speak,
    }
  }, [isSpeaking, speak])
}
