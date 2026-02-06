import { useState, useCallback } from 'react'
import { translate, type ToTranslateLanguage, type TranslateResult } from '../../utils/googleTranslate'
import {
  memoizeAsync3_LRU_cachePromise,
  memoizeAsync3_LRU_cachePromise__default_keyMaker,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { executeNativeTts, executeGoogleTts } from '../../utils/tts'
import { addToast } from '@heroui/toast' // Assuming this exists, or replace with your toast context

// Cache setup
const cachedTranslate = memoizeAsync3_LRU_cachePromise(translate, memoizeAsync3_LRU_cachePromise__default_keyMaker, 40)

export const useGoogleTranslation = (text: string | undefined, targetLang: ToTranslateLanguage) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TranslateResult | null>(null)

  const performTranslate = useCallback(async () => {
    // Runtime type check instead of casting
    if (typeof text !== 'string') {
      return
    }

    const textToTranslate = String_toNonEmptyString_orUndefined_afterTrim(text)

    if (!textToTranslate) {
      addToast({ title: 'Input empty', description: 'Please enter text to translate', color: 'warning' })

      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await cachedTranslate(textToTranslate, 'auto', targetLang)

      setResult(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)

      let userMsg = `Translation failed. ${msg}`

      if (msg.includes('429') || msg.includes('Too Many Requests')) {
        userMsg = 'Daily limit exceeded (429). Please wait a while.'
      }

      setError(userMsg)
      addToast({ title: 'Translation Error', description: userMsg, color: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [text, targetLang])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { loading, error, result, performTranslate, clearResult }
}

export const useTtsHandlers = () => {
  const handleSpeakNative = useCallback(async (text: string, lang: string) => {
    const res = await executeNativeTts(text, lang)

    if (
      res.t === 'error_using_tauri_plugin_and_no_speechSynthesis' ||
      res.t === 'error_using_tauri_plugin_and_using_speechSynthesis'
    ) {
      addToast({
        title: 'TTS Error',
        description: 'Native Text-to-Speech failed.',
        color: 'danger',
      })
    }
  }, [])

  const handleSpeakGoogle = useCallback(async (text: string, lang: string) => {
    const res = await executeGoogleTts(text, lang)

    if (res.t === 'error_fetch' || res.t === 'error_playback') {
      const errorDetail = 'error' in res ? String(res.error) : res.statusText

      addToast({
        title: 'Google TTS Error',
        description: `Playback failed: ${errorDetail}`,
        color: 'danger',
      })
    }
  }, [])

  return { handleSpeakNative, handleSpeakGoogle }
}
