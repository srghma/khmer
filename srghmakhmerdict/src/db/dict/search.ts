import { invoke } from '@tauri-apps/api/core'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'

export const searchEnContent = (query: NonEmptyStringTrimmed) =>
  invoke<NonEmptyStringTrimmed[]>('search_en_content', { query })

export const searchKmContent = (query: NonEmptyStringTrimmed) =>
  invoke<NonEmptyStringTrimmed[]>('search_km_content', { query })

export const searchRuContent = (query: NonEmptyStringTrimmed) =>
  invoke<NonEmptyStringTrimmed[]>('search_ru_content', { query })

export const searchContentByMode = async (
  mode: DictionaryLanguage,
  query: NonEmptyStringTrimmed,
): Promise<NonEmptyStringTrimmed[]> => {
  switch (mode) {
    case 'en':
      return searchEnContent(query)
    case 'km':
      return searchKmContent(query)
    case 'ru':
      return searchRuContent(query)
    default:
      assertNever(mode as never)
  }
}
