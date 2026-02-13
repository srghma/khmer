import { useEffect, useRef } from 'react'
import { useSettings } from '../providers/SettingsProvider'
import { executeGoogleTts, googleTtsResultToError } from '../utils/tts/google'
import { useAppToast } from '../providers/ToastProvider'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../utils/errorMessage'

export const useAutoReadTts = (word: NonEmptyStringTrimmed | undefined, language: ToTranslateLanguage) => {
  const { autoReadMode } = useSettings()
  const toast = useAppToast()
  // track the last word AND the last mode, so if settings change, we might re-read?
  // Actually usually users change settings then navigate. Re-reading on setting change might be annoying.
  // let's stick to reading when 'word' changes.
  const lastReadWordRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!word || autoReadMode === 'disabled') {
      // Reset if word is cleared, so if same word comes back it reads again
      if (!word) lastReadWordRef.current = undefined

      return
    }

    if (lastReadWordRef.current === word) return

    lastReadWordRef.current = word

    const speakNative = () => {
      if ('speechSynthesis' in window) {
        // Cancel any current speaking
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(word)

        utterance.lang = language
        window.speechSynthesis.speak(utterance)
      } else {
        toast.error(
          'Native TTS Error' as NonEmptyStringTrimmed,
          'Native Text-to-Speech not supported in this browser' as NonEmptyStringTrimmed,
        )
      }
    }

    const speakGoogle = async () => {
      try {
        const result = await executeGoogleTts(word, language)
        const error = googleTtsResultToError(result)

        if (error) {
          if (autoReadMode === 'google_then_native') {
            console.warn('Google TTS failed, falling back to native', error)
            speakNative()
          } else {
            toast.error(error.title, error.description)
          }
        }
      } catch (e: unknown) {
        console.error('Unexpected error in speakGoogle', e)
        if (autoReadMode === 'google_then_native') {
          speakNative()
        } else {
          toast.error('Google TTS Error' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      }
    }

    if (autoReadMode === 'native_only') {
      speakNative()
    } else if (autoReadMode === 'google_only') {
      void speakGoogle()
    } else if (autoReadMode === 'google_then_native') {
      void speakGoogle()
    }
  }, [word, language, autoReadMode, toast])
}
