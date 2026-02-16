import { useEffect } from 'react'
import { useSettings } from '../providers/SettingsProvider'
import { executeGoogleTts, googleTtsResultToError } from '../utils/tts/google'
import { useAppToast } from '../providers/ToastProvider'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../utils/googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { executeNativeTts, nativeTtsResultToError } from '../utils/tts/native'
import { map_ToTranslateLanguage_to_BCP47LanguageTagName } from '../utils/my-bcp-47'

const globalLastReadWord = { current: undefined as string | undefined }

export const useAutoReadTts = (word: NonEmptyStringTrimmed | undefined, language: ToTranslateLanguage) => {
  const { autoReadMode } = useSettings()
  const toast = useAppToast()

  useEffect(() => {
    let ignore = false
    // const effectId = Math.random().toString(36).substring(7) // Unique ID for this specific effect run

    // console.log(
    //   `[useAutoReadTts][${effectId}] Effect triggered. Word: "${word}", Mode: ${autoReadMode}, Language: ${language}`,
    // )

    if (!word || autoReadMode === 'disabled') {
      // console.log(`[useAutoReadTts][${effectId}] Exit: Word is empty or mode is disabled.`)
      if (!word) globalLastReadWord.current = undefined

      return
    }

    if (globalLastReadWord.current === word) {
      // console.log(
      // `[useAutoReadTts][${effectId}] Exit: Word "${word}" already matches globalLastReadWord. Skipping to prevent duplicate.`,
      // )
      return
    }

    // console.log(
    //   `[useAutoReadTts][${effectId}] New word detected. Updating ref from "${globalLastReadWord.current}" to "${word}"`,
    // )
    globalLastReadWord.current = word

    const bcp47Language = map_ToTranslateLanguage_to_BCP47LanguageTagName[language]

    const speakNative = async () => {
      // console.log(`[useAutoReadTts][${effectId}] Executing Native TTS for: "${word}"`)
      const result = await executeNativeTts(word, bcp47Language)
      const error = nativeTtsResultToError(result)

      if (error && !ignore) {
        // console.error(`[useAutoReadTts][${effectId}] Native TTS Error:`, error)
        toast.error(error.title, error.description)
      }
    }

    const speakGoogle = async () => {
      // console.log(`[useAutoReadTts][${effectId}] Executing Google TTS for: "${word}"`)
      try {
        const result = await executeGoogleTts(word, language)
        const error = googleTtsResultToError(result)

        if (error && !ignore) {
          if (autoReadMode === 'google_then_native') {
            // console.warn(`[useAutoReadTts][${effectId}] Google TTS failed, falling back to native.`, error)
            await speakNative()
          } else {
            toast.error(error.title, error.description)
          }
        }
      } catch (e: unknown) {
        // console.error(`[useAutoReadTts][${effectId}] Google TTS Exception:`, e)
        if (autoReadMode === 'google_then_native' && !ignore) {
          await speakNative()
        } else if (!ignore) {
          toast.error('Google TTS Error' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      }
    }

    // Logic for choosing engine
    if (autoReadMode === 'native_only') {
      void speakNative()
    } else {
      void speakGoogle()
    }

    return () => {
      // console.log(`[useAutoReadTts][${effectId}] Cleanup logic running for: "${word}"`)
      ignore = true
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // console.log(`[useAutoReadTts][${effectId}] window.speechSynthesis.cancel() called.`)
        window.speechSynthesis.cancel()
      }
    }
  }, [word, language, autoReadMode, toast])
}
