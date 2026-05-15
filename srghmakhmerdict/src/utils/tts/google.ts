const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

async function getFetch() {
  if (isTauri) {
    const { fetch } = await import('@tauri-apps/plugin-http')

    return fetch
  }

  return window.fetch
}

import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import type { ToTranslateLanguage } from '../googleTranslate/toTranslateLanguage'
import { unknown_to_errorMessage } from '../errorMessage'

// We stick to the standard endpoint which works best when not sent from a browser context
export const getGoogleTtsUrl = (text: NonEmptyStringTrimmed, lang: ToTranslateLanguage): NonEmptyStringTrimmed => {
  const params = new URLSearchParams({
    tl: lang,
    q: text,
  })

  if (isTauri) {
    params.set('ie', 'UTF-8')
    params.set('client', 'tw-ob')

    return `https://translate.google.com/translate_tts?${params.toString()}` as NonEmptyStringTrimmed
  }

  // Use local proxy in webapp mode
  return `http://localhost:3001/google_tts?${params.toString()}` as NonEmptyStringTrimmed
}

export type GoogleTtsResult =
  | { t: 'success' }
  | { t: 'error_fetch'; status?: number; statusText?: string; error?: unknown }
  | { t: 'error_playback'; error: unknown; mediaError?: MediaError | null; url: string }
  | { t: 'error_empty_createObjectURL' }

export const executeGoogleTts = async (
  text: NonEmptyStringTrimmed,
  langCode: ToTranslateLanguage,
): Promise<GoogleTtsResult> => {
  const url = getGoogleTtsUrl(text, langCode)
  let audioUrl: string | undefined = undefined
  let audio: HTMLAudioElement | undefined = undefined

  try {
    if (isTauri) {
      // 1. In Tauri, use fetch to bypass CORS and set User-Agent
      const fetch = await getFetch()
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

      const blob = await response.blob()

      audioUrl = URL.createObjectURL(blob)
    } else {
      // 2. In browser, use URL directly to avoid CORS fetch issues
      // Google usually allows direct <audio> src but might block fetch()
      audioUrl = url
    }

    if (!audioUrl) return { t: 'error_empty_createObjectURL' }

    audio = new Audio(audioUrl)
    audio.crossOrigin = 'anonymous'

    // eslint-disable-next-line no-console
    console.log('[GoogleTTS] Playing:', audioUrl)

    return await new Promise<GoogleTtsResult>(resolve => {
      const cleanup = () => {
        if (isTauri && audioUrl) URL.revokeObjectURL(audioUrl)
      }

      audio!.onended = () => {
        cleanup()
        resolve({ t: 'success' })
      }

      audio!.onerror = (e: any) => {
        const mediaError = audio?.error

        cleanup()

        // eslint-disable-next-line no-console
        console.error('[GoogleTTS] audio.onerror', e, mediaError)

        resolve({
          t: 'error_playback',
          error: new Error(mediaError?.message || 'Unknown playback error'),
          mediaError,
          url,
        })
      }

      audio!.play().catch((e: unknown) => {
        cleanup()
        resolve({ t: 'error_playback', error: e, url })
      })
    })
  } catch (error) {
    if (isTauri && audioUrl) URL.revokeObjectURL(audioUrl)

    return { t: 'error_fetch', error }
  }
}

export function googleTtsResultToError(
  result: GoogleTtsResult,
): { title: NonEmptyStringTrimmed; description: NonEmptyStringTrimmed | undefined } | undefined {
  if (result.t === 'success') return undefined

  switch (result.t) {
    case 'error_fetch':
      return {
        title: 'Google TTS Network Error' as NonEmptyStringTrimmed,
        description: result.status
          ? String_toNonEmptyString_orUndefined_afterTrim(`Status ${result.status} ${result.statusText || ''}`)
          : unknown_to_errorMessage(result.error),
      }
    case 'error_playback': {
      let message = unknown_to_errorMessage(result.error)

      if (result.mediaError) {
        const codeMap: Record<number, string> = {
          1: 'MEDIA_ERR_ABORTED',
          2: 'MEDIA_ERR_NETWORK',
          3: 'MEDIA_ERR_DECODE',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
        }
        const code = codeMap[result.mediaError.code] || 'UNKNOWN'

        message = String_toNonEmptyString_orUndefined_afterTrim(
          `${message || ''} (MediaError Code ${result.mediaError.code}: ${code})`,
        )
      }

      return {
        title: 'Google TTS Playback Error' as NonEmptyStringTrimmed,
        description: String_toNonEmptyString_orUndefined_afterTrim(`${message || ''}\nURL: ${result.url}`),
      }
    }
    case 'error_empty_createObjectURL':
      return {
        title: 'Google TTS Error' as NonEmptyStringTrimmed,
        description: 'Unable to process audio data.' as NonEmptyStringTrimmed,
      }
  }
}
