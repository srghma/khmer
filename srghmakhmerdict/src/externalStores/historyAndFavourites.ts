import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { type NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { createExternalStore } from '../utils/createExternalStore'

// We store the full Map to sync between the detail view and the favorites list
export const favoritesStore = createExternalStore<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined>(
  undefined,
  (x, y) => x === y,
)

export const historyStore = createExternalStore<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined>(
  undefined,
  (x, y) => x === y,
)
