import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../googleTranslate/toTranslateLanguage'
import { map_ToTranslateLanguage_to_BCP47LanguageTagName } from '../my-bcp-47'
import { executeGoogleTts, type GoogleTtsResult } from './google'
import { executeNativeTts, type NativeTtsExecutionResult } from './native'
import type { AutoReadMode } from '../../providers/SettingsProvider'

export type OrchestratorResult =
  | { t: 'success' }
  | { t: 'google_error'; error: GoogleTtsResult }
  | { t: 'native_error'; error: NativeTtsExecutionResult }
  | { t: 'google_then_native_both_error'; googleError: GoogleTtsResult; nativeError: NativeTtsExecutionResult }
  | { t: 'aborted' }

export const executeTtsOrchestrator = async (
  word: NonEmptyStringTrimmed,
  language: ToTranslateLanguage,
  mode: AutoReadMode,
  signal?: AbortSignal,
): Promise<OrchestratorResult> => {
  if (mode === 'disabled' || signal?.aborted) return { t: 'aborted' }

  const bcp47 = map_ToTranslateLanguage_to_BCP47LanguageTagName[language]

  // Scenario 1: Native Only
  if (mode === 'native_only') {
    const res = await executeNativeTts(word, bcp47)

    if (signal?.aborted) return { t: 'aborted' }

    return res.t.startsWith('success') ? { t: 'success' } : { t: 'native_error', error: res }
  }

  // Scenario 2: Google Only
  if (mode === 'google_only') {
    const res = await executeGoogleTts(word, language)

    if (signal?.aborted) return { t: 'aborted' }

    return res.t === 'success' ? { t: 'success' } : { t: 'google_error', error: res }
  }

  // Scenario 3: Google then Native
  const gRes = await executeGoogleTts(word, language)

  if (signal?.aborted) return { t: 'aborted' }

  if (gRes.t === 'success') return { t: 'success' }

  // Fallback to native
  const nRes = await executeNativeTts(word, bcp47)

  if (signal?.aborted) return { t: 'aborted' }

  return nRes.t.startsWith('success')
    ? { t: 'success' }
    : { t: 'google_then_native_both_error', googleError: gRes, nativeError: nRes }
}
