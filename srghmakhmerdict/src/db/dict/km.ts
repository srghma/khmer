import { invoke } from '@tauri-apps/api/core'
import { isKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { Map_toNonEmptyMap_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { WordDetailKmSchema } from './schema'
import type { KhmerWordsMap, KhmerWordsMapValue, WordDetailKm, ShortDefinitionKm } from './types'

type KhmerWordRow_Raw = { word: NonEmptyStringTrimmed; is_verified: boolean }

export const getKmWords = memoizeAsync0_throwIfInFly(async (): Promise<KhmerWordsMap> => {
  const words = await invoke<KhmerWordRow_Raw[]>('get_km_words')
  const map: Map<NonEmptyStringTrimmed, KhmerWordsMapValue> = new Map()

  words.forEach(({ word, is_verified }) => {
    map.set(word, { isKhmer: isKhmerWord(word), is_verified })
  })

  return Map_toNonEmptyMap_orThrow(map)
})

export function* yieldOnlyVerifiedKhmerWords(map: KhmerWordsMap): Generator<NonEmptyStringTrimmed> {
  for (const [word, value] of map.entries()) {
    if (value.isKhmer && value.is_verified) {
      yield word
    }
  }
}

export const getWordDetailKm = async (word: NonEmptyStringTrimmed): Promise<WordDetailKm | undefined> => {
  const res = await invoke<unknown>('get_word_detail_km', { word })

  if (res === undefined) throw new Error('undefined is unexpected')
  if (res === null) return undefined

  return WordDetailKmSchema.parse(res)
}

export const getKmWordsDetailShort = async (
  words: NonEmptySet<TypedContainsKhmer>,
): Promise<NonEmptyRecord<TypedContainsKhmer, ShortDefinitionKm | null>> => {
  return invoke('km_for_many_short_description_none_if_word_not_found', { words: Array.from(words) })
}

export const getKmWordsDetailShort_Strict = async (
  words: NonEmptySet<TypedContainsKhmer>,
): Promise<NonEmptyRecord<TypedContainsKhmer, ShortDefinitionKm>> => {
  return invoke('km_for_many_short_description_throws_if_word_not_found', { words: Array.from(words) })
}

export const getKmWordsDetailFull = async (
  words: NonEmptySet<TypedContainsKhmer>,
): Promise<NonEmptyRecord<TypedContainsKhmer, WordDetailKm | null>> => {
  return invoke('km_for_many_full_details_none_if_word_not_found', { words: Array.from(words) })
}

export const getKmWordsDetailFull_Strict = async (
  words: NonEmptySet<TypedContainsKhmer>,
): Promise<NonEmptyRecord<TypedContainsKhmer, WordDetailKm>> => {
  return invoke('km_for_many_full_details_throws_if_word_not_found', { words: Array.from(words) })
}
