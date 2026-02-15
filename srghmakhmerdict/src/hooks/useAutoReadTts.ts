import { useEffect, useRef } from 'react'
import { useSettings } from '../providers/SettingsProvider'
import { executeGoogleTts, googleTtsResultToError } from '../utils/tts/google'
import { useAppToast } from '../providers/ToastProvider'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { executeNativeTts, nativeTtsResultToError } from '../utils/tts/native'
import { map_ToTranslateLanguage_to_BCP47LanguageTagName } from '../utils/my-bcp-47'

export const useAutoReadTts = (word: NonEmptyStringTrimmed | undefined, language: ToTranslateLanguage) => {
  const { autoReadMode } = useSettings()
  const toast = useAppToast()
  const lastReadWordRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    let ignore = false

    if (!word || autoReadMode === 'disabled') {
      if (!word) lastReadWordRef.current = undefined

      return
    }

    if (lastReadWordRef.current === word) return

    lastReadWordRef.current = word

    const bcp47Language = map_ToTranslateLanguage_to_BCP47LanguageTagName[language]

    const speakNative = async () => {
      const result = await executeNativeTts(word, bcp47Language)
      const error = nativeTtsResultToError(result)

      if (error && !ignore) {
        toast.error(error.title, error.description)
      }
    }

    const speakGoogle = async () => {
      try {
        const result = await executeGoogleTts(word, language)
        const error = googleTtsResultToError(result)

        if (error && !ignore) {
          if (autoReadMode === 'google_then_native') {
            console.warn('Google TTS failed, falling back to native', error)
            await speakNative()
          } else {
            toast.error(error.title, error.description)
          }
        }
      } catch (e: unknown) {
        console.error('Unexpected error in speakGoogle', e)
        if (autoReadMode === 'google_then_native' && !ignore) {
          await speakNative()
        } else if (!ignore) {
          toast.error('Google TTS Error' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      }
    }

    if (autoReadMode === 'native_only') {
      void speakNative()
    } else if (autoReadMode === 'google_only') {
      void speakGoogle()
    } else if (autoReadMode === 'google_then_native') {
      void speakGoogle()
    }

    return () => {
      ignore = true
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [word, language, autoReadMode, toast])
}
