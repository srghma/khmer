import { invoke } from '@tauri-apps/api/core'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { WordDetailEnSchema } from './schema'
import type { WordDetailEn, ShortDefinitionEn } from './types'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'

export const getEnWords = memoizeAsync0_throwIfInFly(() => invoke<NonEmptyArray<NonEmptyStringTrimmed>>('get_en_words'))

// only en db has images (with khmer text)
export const get_en_km_com_images_ocr = async (ids: NonEmptySet<ValidNonNegativeInt>) => {
  return await invoke<Record<ValidNonNegativeInt, NonEmptyStringTrimmed>>('get_en_km_com_images_ocr', {
    ids: Array.from(ids),
  })
}

export const getWordDetailEn = async (
  word: NonEmptyStringTrimmed,
  useExtensionDb: boolean,
): Promise<WordDetailEn | undefined> => {
  const res = await invoke<unknown>('get_word_detail_en', {
    word,
    useExtensionDb,
  })

  if (res === undefined) throw new Error('undefined is unexpected')
  if (res === null) return undefined

  return WordDetailEnSchema.parse(res)
}

export const getEnWordsDetailShort = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, ShortDefinitionEn | null>> => {
  return invoke('en_for_many_short_description_none_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailShort_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, ShortDefinitionEn>> => {
  return invoke('en_for_many_short_description_throws_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailFull = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailEn | null>> => {
  return invoke('en_for_many_full_details_none_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailFull_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailEn>> => {
  return invoke('en_for_many_full_details_throws_if_word_not_found', { words: Array.from(words) })
}
