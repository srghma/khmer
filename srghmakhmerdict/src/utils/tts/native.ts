import { speak, isSpeaking as tauriIsSpeaking } from 'tauri-plugin-tts-api'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { unknown_to_errorMessage } from '../errorMessage'
import type { BCP47LanguageTagName } from '../my-bcp-47'

export type TtsExecutionResult =
  | { t: 'success_using_tauri_plugin' }
  | { t: 'success_using_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_no_speechSynthesis'; tauriError: unknown }
  | { t: 'error_using_tauri_plugin_and_using_speechSynthesis'; tauriError: unknown; browserError: unknown }

/**
 * Polls the Tauri plugin until it reports it has finished speaking.
 */
async function waitForTauriTts(): Promise<void> {
  // Give the OS a moment to start the speech engine
  await new Promise(resolve => setTimeout(resolve, 150))

  return new Promise(resolve => {
    const interval = setInterval(async () => {
      const active = await tauriIsSpeaking()

      if (!active) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

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

    // BLOCK until the audio actually finishes
    await waitForTauriTts()

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

export function nativeTtsResultToError(
  result: TtsExecutionResult,
): { title: NonEmptyStringTrimmed; description: NonEmptyStringTrimmed | undefined } | undefined {
  if (result.t === 'success_using_tauri_plugin' || result.t === 'success_using_speechSynthesis') {
    return undefined
  }

  if (result.t === 'error_using_tauri_plugin_and_no_speechSynthesis') {
    return {
      title: 'Native TTS Error' as NonEmptyStringTrimmed,
      description: unknown_to_errorMessage(result.tauriError),
    }
  }

  return {
    title: 'Native TTS Failed' as NonEmptyStringTrimmed,
    description: String_toNonEmptyString_orUndefined_afterTrim(
      `Plugin: ${unknown_to_errorMessage(result.tauriError)}. Browser: ${unknown_to_errorMessage(result.browserError)}`,
    ),
  }
}
