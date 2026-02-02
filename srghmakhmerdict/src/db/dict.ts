import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'

import * as z from 'zod/mini'
import { invoke } from '@tauri-apps/api/core'
import { type NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { NonEmptyArraySchema } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array-zod'
import { NonEmptyStringTrimmedSchema } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed-zod'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { isKhmerWord, type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  Map_toNonEmptyMap_orThrow,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

// --- Lists ---

export const getEnWords = memoizeAsync0_throwIfInFly(() => invoke<NonEmptyArray<NonEmptyStringTrimmed>>('get_en_words'))
export const getRuWords = memoizeAsync0_throwIfInFly(() => invoke<NonEmptyArray<NonEmptyStringTrimmed>>('get_ru_words'))

type KhmerWordRow_Raw = { word: NonEmptyStringTrimmed; is_verified: boolean }

export type KhmerWordsMapValue = { isKhmer: boolean; is_verified: boolean }
export type KhmerWordsMap = NonEmptyMap<NonEmptyStringTrimmed, KhmerWordsMapValue>

export const getKmWords = memoizeAsync0_throwIfInFly(async (): Promise<KhmerWordsMap> => {
  const words = await invoke<KhmerWordRow_Raw[]>('get_km_words')
  // console.log('words', words)
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

// --- Details ---

export const WordDetailKmSchema = z.strictObject({
  word: NonEmptyStringTrimmedSchema,
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
  phonetic: z.optional(NonEmptyStringTrimmedSchema),
  wiktionary: z.optional(NonEmptyStringTrimmedSchema), // html
  from_csv_variants: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_noun_forms: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_pronunciations: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_raw_html: z.optional(NonEmptyStringTrimmedSchema), // html
  from_chuon_nath: z.optional(NonEmptyStringTrimmedSchema),
  from_chuon_nath_translated: z.optional(NonEmptyStringTrimmedSchema),
  from_russian_wiki: z.optional(NonEmptyStringTrimmedSchema), // html
  en_km_com: z.optional(NonEmptyStringTrimmedSchema), // html
})

export const WordDetailEnSchema = z.strictObject({
  word: NonEmptyStringTrimmedSchema,
  word_display: z.optional(NonEmptyStringTrimmedSchema), // html
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
  desc_en_only: z.optional(NonEmptyStringTrimmedSchema), // html
  en_km_com: z.optional(NonEmptyStringTrimmedSchema), // html
})

export const WordDetailRuSchema = z.strictObject({
  word: NonEmptyStringTrimmedSchema,
  word_display: z.optional(NonEmptyStringTrimmedSchema),
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
})

export type WordDetailKm = z.infer<typeof WordDetailKmSchema>
export type WordDetailEn = z.infer<typeof WordDetailEnSchema>
export type WordDetailRu = z.infer<typeof WordDetailRuSchema>

export const getWordDetailKm = async (word: NonEmptyStringTrimmed): Promise<WordDetailKm | undefined> => {
  const res = await invoke<unknown>('get_word_detail_km', { word })

  if (res === undefined) throw new Error('undefined is unexpected')
  if (res === null) return undefined

  // console.log('getWordDetailKm', res)

  return WordDetailKmSchema.parse(res)
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

  // console.log('getWordDetailEn', res)

  return WordDetailEnSchema.parse(res)
}

export const getWordDetailRu = async (word: NonEmptyStringTrimmed): Promise<WordDetailRu | undefined> => {
  const res = await invoke<unknown>('get_word_detail_ru', { word })

  if (res === undefined) throw new Error('undefined is unexpected')
  if (res === null) return undefined

  // console.log('getWordDetailRu', res)

  return WordDetailRuSchema.parse(res)
}

export interface WordDetailEnOrRuOrKm extends WordDetailKm {
  readonly word_display?: NonEmptyStringTrimmed
  readonly desc_en_only?: NonEmptyStringTrimmed
}

export const getWordDetailByMode = async (
  mode: DictionaryLanguage,
  word: NonEmptyStringTrimmed,
  useExtensionDb: boolean,
): Promise<WordDetailEnOrRuOrKm | undefined> => {
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

// --- Content Search ---

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
      assertNever(mode)
  }
}

export const get_en_km_com_images_ocr = async (ids: NonEmptySet<ValidNonNegativeInt>) => {
  return await invoke<Record<ValidNonNegativeInt, NonEmptyStringTrimmed>>('get_en_km_com_images_ocr', {
    ids: Array.from(ids),
  })
}

export const getKmWordsDetailShort = async (
  words: NonEmptySet<TypedKhmerWord>, // TypedKhmerWord
): Promise<NonEmptyRecord<TypedKhmerWord, NonEmptyStringTrimmed | null>> => {
  return invoke('get_km_words_detail_short', { words: Array.from(words) })
}

export const getKmWordsDetailFull = async (
  words: NonEmptySet<TypedContainsKhmer>,
): Promise<NonEmptyRecord<TypedContainsKhmer, WordDetailKm | null>> => {
  return invoke('get_km_words_detail_full', { words: Array.from(words) })
}
