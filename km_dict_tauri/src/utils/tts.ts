import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { fetch } from '@tauri-apps/plugin-http' // Use Tauri's native fetch
import type { DictionaryLanguage } from '../types'
import { speak } from 'tauri-plugin-tts-api'

export const mapModeToNativeLang = (mode: DictionaryLanguage): string => {
  switch (mode) {
    case 'km':
      return 'km-KH'
    case 'ru':
      return 'ru-RU'
    case 'en':
      return 'en-US'
    default:
      assertNever(mode)
  }
}

// We stick to the standard endpoint which works best when not sent from a browser context
export const getGoogleTtsUrl = (text: string, lang: string): string => {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    client: 'tw-ob', // This client ID works well with direct backend fetching
    tl: lang,
    q: text,
  })

  return `https://translate.google.com/translate_tts?${params.toString()}`
}

export type TtsExecutionResult =
  | { t: 'success_using_tauri_plugin' }
  | { t: 'success_using_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_no_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_using_speechSynthesis'; tauriError: unknown; browserError: unknown }

export const executeNativeTts = async (text: string, langIso: string): Promise<TtsExecutionResult> => {
  try {
    await speak({
      text: text,
      language: langIso,
      queueMode: 'flush',
      pitch: null,
      rate: null,
      voiceId: null,
      volume: null,
    })

    return { t: 'success_using_tauri_plugin' }
  } catch (tauriError) {
    // Fallback: Try browser API
    // Check if window exists (for SSR safety) and if API is available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)

        u.lang = langIso
        window.speechSynthesis.speak(u)

        return { t: 'success_using_speechSynthesis', tauriError }
      } catch (browserError) {
        return { t: 'error_using_tauri_plugin_and_using_speechSynthesis', tauriError, browserError }
      }
    }

    return { t: 'error_using_tauri_plugin_and_no_speechSynthesis', tauriError }
  }
}

export type GoogleTtsResult =
  | { t: 'success' }
  | { t: 'error_fetch'; status?: number; statusText?: string; error?: unknown }
  | { t: 'error_playback'; error: unknown }

export const executeGoogleTts = async (text: string, langCode: string): Promise<GoogleTtsResult> => {
  let audioUrl: string | null = null

  try {
    const url = getGoogleTtsUrl(text, langCode)

    // 1. Fetch using global fetch (In Tauri, ensure the scope is configured to allow this URL)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return {
        t: 'error_fetch',
        status: response.status,
        statusText: response.statusText,
      }
    }

    // 2. Get the binary data
    const blob = await response.blob()

    // 3. Create a local URL
    audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)

    // 4. Play and wait for completion
    return await new Promise<GoogleTtsResult>(resolve => {
      const cleanup = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl)
      }

      audio.onended = () => {
        cleanup()
        resolve({ t: 'success' })
      }

      audio.onerror = e => {
        cleanup()
        // The event itself (e) usually doesn't contain deep details for Audio elements,
        // but acts as the signal.
        resolve({ t: 'error_playback', error: e })
      }

      audio.play().catch(e => {
        cleanup()
        resolve({ t: 'error_playback', error: e })
      })
    })
  } catch (error) {
    if (audioUrl) URL.revokeObjectURL(audioUrl)

    return { t: 'error_fetch', error }
  }
}
