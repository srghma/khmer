import { invoke } from '@tauri-apps/api/core'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { NonEmptySet_map } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { strToContainsKhmerOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import type { DictionaryLanguage } from '../../types'
import { getWordDetailEn, getEnWordsDetailFull_Strict } from './en'
import { getWordDetailKm, getKmWordsDetailFull_Strict } from './km'
import { getWordDetailRu, getRuWordsDetailFull_Strict } from './ru'
import type { LanguageToDetailMap } from './types'

export const get_en_km_com_images_ocr = async (ids: NonEmptySet<ValidNonNegativeInt>) => {
  return await invoke<Record<ValidNonNegativeInt, NonEmptyStringTrimmed>>('get_en_km_com_images_ocr', {
    ids: Array.from(ids),
  })
}

export async function getWordDetailByMode<L extends DictionaryLanguage>(
  mode: L,
  word: NonEmptyStringTrimmed,
  useExtensionDb: boolean,
): Promise<LanguageToDetailMap[L] | undefined> {
  switch (mode) {
    case 'en':
      return getWordDetailEn(word, useExtensionDb) as Promise<LanguageToDetailMap[L]>
    case 'km':
      return getWordDetailKm(word) as Promise<LanguageToDetailMap[L]>
    case 'ru':
      return getWordDetailRu(word) as Promise<LanguageToDetailMap[L]>
    default:
      assertNever(mode)
  }
}

export async function getWordDetailsByModeFull_Strict<L extends DictionaryLanguage>(
  mode: L,
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]>> {
  switch (mode) {
    case 'en':
      return getEnWordsDetailFull_Strict(words) as Promise<NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]>>
    case 'km':
      return getKmWordsDetailFull_Strict(NonEmptySet_map(words, strToContainsKhmerOrThrow)) as Promise<NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]>>
    case 'ru':
      return getRuWordsDetailFull_Strict(words) as Promise<NonEmptyRecord<NonEmptyStringTrimmed, LanguageToDetailMap[L]>>
    default:
      assertNever(mode)
  }
}
