import { useCallback, useEffect, useRef } from 'react'
import { useSettings, type AutoReadMode } from '../providers/SettingsProvider'
import { useAppToast } from '../providers/ToastProvider'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { googleTtsResultToError } from '../utils/tts/google'
import { nativeTtsResultToError } from '../utils/tts/native'
import { executeTtsOrchestrator } from '../utils/tts/googleOrNative'

const globalLastReadWord = { current: undefined as NonEmptyStringTrimmed | undefined }

export const useAutoReadCaller = (
  autoReadModeOverride?: AutoReadMode,
  autoReadLangsOverride?: Partial<Record<ToTranslateLanguage, boolean>>,
) => {
  const toast = useAppToast()
  const { autoReadMode: settingsAutoReadMode, autoReadLangs: settingsAutoReadLangs } = useSettings()

  const autoReadMode = autoReadModeOverride ?? settingsAutoReadMode
  const autoReadLangs = autoReadLangsOverride ?? settingsAutoReadLangs

  return useCallback(
    async (word: NonEmptyStringTrimmed, language: ToTranslateLanguage, signal?: AbortSignal) => {
      if (!word || autoReadMode === 'disabled' || !(autoReadLangs as Record<string, boolean>)[language] || globalLastReadWord.current === word) {
        return
      }
      globalLastReadWord.current = word

      const result = await executeTtsOrchestrator(word, language, autoReadMode, signal)

      if (signal?.aborted || result.t === 'success' || result.t === 'aborted') return

      // Map orchestrator results back to toast-friendly errors
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
    },
    [autoReadMode, autoReadLangs, toast],
  )
}

export const useAutoReadTts = (word: NonEmptyStringTrimmed | undefined, language: ToTranslateLanguage) => {
  const speak = useAutoReadCaller()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortControllerRef.current?.abort()

    if (!word) {
      globalLastReadWord.current = undefined
    } else {
      const controller = new AbortController()

      abortControllerRef.current = controller
      void speak(word, language, controller.signal)
    }

    return () => {
      abortControllerRef.current?.abort()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [word, language, speak])
}
