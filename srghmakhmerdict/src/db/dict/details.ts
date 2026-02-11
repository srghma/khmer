import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { NonEmptySet_map } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { strToContainsKhmerOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { DictionaryLanguage } from '../../types'
import { getWordDetailEn, getEnWordsDetailFull_Strict, getEnWordsDetailShort_Strict } from './en'
import { getWordDetailKm, getKmWordsDetailFull_Strict, getKmWordsDetailShort_Strict } from './km'
import { getWordDetailRu, getRuWordsDetailFull_Strict, getRuWordsDetailShort_Strict } from './ru'
import type { LanguageToDetailMap, LanguageToShortDefinitionMap } from './types'

export async function getWordDetailByMode<L extends DictionaryLanguage>(
  mode: L,
  word: NonEmptyStringTrimmed,
  useExtensionDb: boolean,
): Promise<LanguageToDetailMap[L] | undefined> {
  switch (mode) {
    case 'en':
      return getWordDetailEn(word, useExtensionDb)
    case 'km':
      return getWordDetailKm(word)
    case 'ru':
      return getWordDetailRu(word)
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
      return getEnWordsDetailFull_Strict(words)
    case 'km':
      return getKmWordsDetailFull_Strict(NonEmptySet_map(words, strToContainsKhmerOrThrow))
    case 'ru':
      return getRuWordsDetailFull_Strict(words)
    default:
      assertNever(mode)
  }
}

export async function getWordDetailsByModeShort_Strict<L extends DictionaryLanguage>(
  mode: L,
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, LanguageToShortDefinitionMap[L]>> {
  switch (mode) {
    case 'en':
      return getEnWordsDetailShort_Strict(words) as any // safe
    case 'km':
      return getKmWordsDetailShort_Strict(NonEmptySet_map(words, strToContainsKhmerOrThrow)) as any // safe
    case 'ru':
      return getRuWordsDetailShort_Strict(words)
    default:
      assertNever(mode)
  }
}
