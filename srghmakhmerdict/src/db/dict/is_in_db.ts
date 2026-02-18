import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { invoke } from '@tauri-apps/api/core'
import type { DictionaryLanguage } from '../../types'

export const isWordInDict = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  return await invoke<boolean>('is_word_in_dict', { word, language })
}
