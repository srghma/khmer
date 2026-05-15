import { invoke } from '../invoke'
import { isKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { Map_toNonEmptyMap_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { type TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { WordDetailKmSchema } from './schema'
import type { KhmerWordsMap, KhmerWordsMapValue, WordDetailKm, ShortDefinitionKm } from './types'
import type { KhmerToRussianOutput } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmerToRussianOutput'

type KhmerWordRow_Raw = {
  word: TypedContainsKhmer
  is_verified: boolean
  my_ru_translit: KhmerToRussianOutput | null
  my_en_translit: NonEmptyStringTrimmed | null
  Wiktionary_ipa_or_from_csv_pronunciations: NonEmptyStringTrimmed | null
}

export const getKmWords = memoizeAsync0_throwIfInFly(async (): Promise<KhmerWordsMap> => {
  // const { String_toNonEmptyString_orUndefined_afterTrim } =
  //   await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed')
  // const { strToLowercaseCyrillicWithGroups_orUndefined } =
  //   await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/khmerToRussianOutput')

  const words = await invoke<KhmerWordRow_Raw[]>('get_km_words')
  const map: Map<TypedContainsKhmer, KhmerWordsMapValue> = new Map()

  words.forEach(({ word, is_verified, my_ru_translit, my_en_translit, Wiktionary_ipa_or_from_csv_pronunciations }) => {
    const obj: KhmerWordsMapValue = {
      isKhmer: isKhmerWord(word),
      // Use the transliterations from the database, converting to proper branded types
      is_verified,
    }

    if (my_ru_translit) obj.ru_translit = my_ru_translit
    if (my_en_translit) obj.en_translit = my_en_translit
    if (Wiktionary_ipa_or_from_csv_pronunciations) {
      obj.Wiktionary_ipa_or_from_csv_pronunciations = Wiktionary_ipa_or_from_csv_pronunciations
    }

    map.set(word, obj)
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
