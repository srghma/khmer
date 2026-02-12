import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { DictionaryLanguage } from '../types'

const LANGUAGE_PREFERENCE_ORDER: DictionaryLanguage[] = ['km', 'en', 'ru']

export function getBestAvailableLanguage(splitted: {
  [P in DictionaryLanguage]: NonEmptyArray<unknown> | undefined
}): DictionaryLanguage {
  // Find the first language in the preference list that actually has items
  const best = LANGUAGE_PREFERENCE_ORDER.find(lang => !!splitted[lang])

  // Fallback (should theoretically never be hit given your non-empty assertion)
  return best ?? 'km'
}
