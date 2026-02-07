import { fetch } from '@tauri-apps/plugin-http' // Use Tauri's native fetch
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import type { ToTranslateLanguage } from '../googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../errorMessage'

// We stick to the standard endpoint which works best when not sent from a browser context
// TODO: use https://github.com/dahlia/iso639-1/blob/main/src/narrowers.ts ?
export const getGoogleTtsUrl = (text: NonEmptyStringTrimmed, lang: ToTranslateLanguage): NonEmptyStringTrimmed => {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    client: 'tw-ob', // This client ID works well with direct backend fetching
    tl: lang,
    q: text,
  })

  return `https://translate.google.com/translate_tts?${params.toString()}` as NonEmptyStringTrimmed
}

export type GoogleTtsResult =
  | { t: 'success' }
  | { t: 'error_fetch'; status?: number; statusText?: string; error?: unknown }
  | { t: 'error_playback'; error: unknown }
  | { t: 'error_empty_createObjectURL' }

export const executeGoogleTts = async (
  text: NonEmptyStringTrimmed,
  langCode: ToTranslateLanguage,
): Promise<GoogleTtsResult> => {
  let audioUrl: NonEmptyStringTrimmed | undefined = undefined

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
    audioUrl = String_toNonEmptyString_orUndefined_afterTrim(URL.createObjectURL(blob))
    if (!audioUrl) return { t: 'error_empty_createObjectURL' }
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

export function googleTtsResultToError(result: GoogleTtsResult): { title: string; description: string } | undefined {
  if (result.t === 'success') return undefined

  switch (result.t) {
    case 'error_fetch':
      return {
        title: 'Google TTS Network Error',
        description: result.status
          ? `Status ${result.status} ${result.statusText || ''}`.trim()
          : unknown_to_errorMessage(result.error),
      }
    case 'error_playback':
      return {
        title: 'Google TTS Playback Error',
        description: unknown_to_errorMessage(result.error),
      }
    case 'error_empty_createObjectURL':
      return {
        title: 'Google TTS Error',
        description: 'Unable to process audio data.',
      }
  }
}
