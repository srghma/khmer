import { invoke } from '@tauri-apps/api/core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import { type TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

export type InAndNotInDb<T> = { inDb: T[]; notInDb: T[] }

export type AreWordsInDictResponse = {
  en: InAndNotInDb<NonEmptyStringTrimmed>
  ru: InAndNotInDb<NonEmptyStringTrimmed>
  km: InAndNotInDb<TypedContainsKhmer>
}

export const isWordInDict = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  return await invoke<boolean>('is_word_in_dict', { word, language })
}

export const areWordsInDict = async (payload: {
  en: ReadonlySet<NonEmptyStringTrimmed>
  ru: ReadonlySet<NonEmptyStringTrimmed>
  km: ReadonlySet<TypedContainsKhmer>
}): Promise<AreWordsInDictResponse> => {
  const res = await invoke<any>('are_words_in_dict', {
    en: Array.from(payload.en),
    ru: Array.from(payload.ru),
    km: Array.from(payload.km),
  })

  return {
    en: { inDb: res.en.in_db, notInDb: res.en.not_in_db },
    ru: { inDb: res.ru.in_db, notInDb: res.ru.not_in_db },
    km: { inDb: res.km.in_db, notInDb: res.km.not_in_db },
  }
}
