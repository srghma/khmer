import { invoke } from '@tauri-apps/api/core'
import { isKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { Map_toNonEmptyMap_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { memoizeAsync0_throwIfInFly } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { type TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { WordDetailKmSchema } from './schema'
import type { KhmerWordsMap, KhmerWordsMapValue, WordDetailKm, ShortDefinitionKm } from './types'

type KhmerWordRow_Raw = { word: TypedContainsKhmer; is_verified: boolean }

export const getKmWords = memoizeAsync0_throwIfInFly(async (): Promise<KhmerWordsMap> => {
  const words = await invoke<KhmerWordRow_Raw[]>('get_km_words')
  const map: Map<TypedContainsKhmer, KhmerWordsMapValue> = new Map()

  words.forEach(({ word, is_verified }) => {
    // Transliterations are computed lazily in the background after initial load
    map.set(word, {
      isKhmer: isKhmerWord(word),
      ru_translit: undefined,
      en_translit: undefined,
      is_verified,
    } satisfies KhmerWordsMapValue)
  })

  return Map_toNonEmptyMap_orThrow(map)
})

/**
 * Populates transliterations for all words in the map.
 * This should be called after initial load when the app is idle.
 */
export const populateTransliterations = async (map: KhmerWordsMap): Promise<KhmerWordsMap> => {
  const { strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined } =
    await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word')
  const { khmerToRussian } = await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/khmerToRussian')
  const { slugify } = await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/slugifyKhmer')
  const { String_toNonEmptyString_orUndefined_afterTrim } =
    await import('@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed')

  // Cast to writable Map to allow modifications
  const writableMap: Map<TypedContainsKhmer, KhmerWordsMapValue> = new Map()

  for (const [word, value] of map.entries()) {
    // Skip if already populated
    if (value.ru_translit !== undefined || value.en_translit !== undefined) continue

    const ru_translit_ = strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined(word)
    const ru_translit = ru_translit_ ? khmerToRussian(ru_translit_) : undefined
    const en_translit = String_toNonEmptyString_orUndefined_afterTrim(slugify(word, ' '))

    // Update the map entry in-place
    writableMap.set(word, {
      ...value,
      ru_translit,
      en_translit,
    })
  }

  return Map_toNonEmptyMap_orThrow(writableMap)
}

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
