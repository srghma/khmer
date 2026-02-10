import { invoke } from '@tauri-apps/api/core'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { WordDetailEnSchema } from './schema'
import type { WordDetailEn } from './types'

export const getEnWords = memoizeAsync0_throwIfInFly(() => invoke<NonEmptyArray<NonEmptyStringTrimmed>>('get_en_words'))

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
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, NonEmptyStringTrimmed | null>> => {
  return invoke('en_for_many__short_description__none_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailShort_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, NonEmptyStringTrimmed>> => {
  return invoke('en_for_many__short_description__throws_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailFull = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailEn | null>> => {
  return invoke('en_for_many__full_details__none_if_word_not_found', { words: Array.from(words) })
}

export const getEnWordsDetailFull_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailEn>> => {
  return invoke('en_for_many__full_details__throws_if_word_not_found', { words: Array.from(words) })
}
