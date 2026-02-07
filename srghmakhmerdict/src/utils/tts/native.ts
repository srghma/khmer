// Use Tauri's native fetch
import { speak } from 'tauri-plugin-tts-api'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { unknown_to_errorMessage } from '../errorMessage'
import type { BCP47LanguageTagName } from '../my-bcp-47'

export type TtsExecutionResult =
  | { t: 'success_using_tauri_plugin' }
  | { t: 'success_using_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_no_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_using_speechSynthesis'; tauriError: unknown; browserError: unknown }

export const executeNativeTts = async (
  text: NonEmptyStringTrimmed,
  langIso: BCP47LanguageTagName,
): Promise<TtsExecutionResult> => {
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

//////////////////////////////////////////

export function nativeTtsResultToError(result: TtsExecutionResult): { title: string; description: string } | undefined {
  if (result.t === 'success_using_tauri_plugin' || result.t === 'success_using_speechSynthesis') {
    return undefined
  }

  if (result.t === 'error_using_tauri_plugin_and_no_speechSynthesis') {
    return {
      title: 'Native TTS Error',
      description: unknown_to_errorMessage(result.tauriError),
    }
  }

  return {
    title: 'Native TTS Failed',
    description: `Plugin: ${unknown_to_errorMessage(result.tauriError)}. Browser: ${unknown_to_errorMessage(result.browserError)}`,
  }
}
