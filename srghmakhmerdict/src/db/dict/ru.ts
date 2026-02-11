import { invoke } from '@tauri-apps/api/core'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { WordDetailRuSchema } from './schema'
import type { WordDetailRu, ShortDefinitionRu } from './types'

export const getRuWords = memoizeAsync0_throwIfInFly(() => invoke<NonEmptyArray<NonEmptyStringTrimmed>>('get_ru_words'))

export const getWordDetailRu = async (word: NonEmptyStringTrimmed): Promise<WordDetailRu | undefined> => {
  const res = await invoke<unknown>('get_word_detail_ru', { word })

  if (res === undefined) throw new Error('undefined is unexpected')
  if (res === null) return undefined

  return WordDetailRuSchema.parse(res)
}

export const getRuWordsDetailShort = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, ShortDefinitionRu | null>> => {
  return invoke('ru_for_many_short_description_none_if_word_not_found', { words: Array.from(words) })
}

export const getRuWordsDetailShort_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, ShortDefinitionRu>> => {
  return invoke('ru_for_many_short_description_throws_if_word_not_found', { words: Array.from(words) })
}

export const getRuWordsDetailFull = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailRu | null>> => {
  return invoke('ru_for_many_full_details_none_if_word_not_found', { words: Array.from(words) })
}

export const getRuWordsDetailFull_Strict = async (
  words: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<NonEmptyRecord<NonEmptyStringTrimmed, WordDetailRu>> => {
  return invoke('ru_for_many_full_details_throws_if_word_not_found', { words: Array.from(words) })
}
