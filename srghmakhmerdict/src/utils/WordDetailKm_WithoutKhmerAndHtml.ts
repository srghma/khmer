import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  strToWithoutKhmerAndHtml_remove_orUndefined,
  type TypedWithoutKhmerAndHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer-and-html'
import type { WordDetailKm } from '../db/dict'

export type WordDetailKm_WithoutKhmerAndHtml = {
  word: NonEmptyStringTrimmed
  desc: TypedWithoutKhmerAndHtml | undefined
  phonetic: NonEmptyStringTrimmed | undefined
  wiktionary: TypedWithoutKhmerAndHtml | undefined // html
  from_csv_variants: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_noun_forms: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_pronunciations: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_raw_html: TypedWithoutKhmerAndHtml | undefined // html
  // from_chuon_nath: NonEmptyStringTrimmed | undefined
  // from_chuon_nath_translated: NonEmptyStringTrimmed | undefined
  from_russian_wiki: TypedWithoutKhmerAndHtml | undefined // html
  en_km_com: TypedWithoutKhmerAndHtml | undefined // html
}

const strToWithoutKhmerAndHtml_remove_orUndefined_ = (
  value: string | undefined,
): TypedWithoutKhmerAndHtml | undefined => (value ? strToWithoutKhmerAndHtml_remove_orUndefined(value) : undefined)

export const wordDetailKm_WithoutKhmerAndHtml_mk = (x: WordDetailKm): WordDetailKm_WithoutKhmerAndHtml => {
  return {
    word: x.word,
    desc: strToWithoutKhmerAndHtml_remove_orUndefined_(x.desc),
    phonetic: x.phonetic,
    wiktionary: strToWithoutKhmerAndHtml_remove_orUndefined_(x.wiktionary),
    from_csv_variants: x.from_csv_variants,
    from_csv_noun_forms: x.from_csv_noun_forms,
    from_csv_pronunciations: x.from_csv_pronunciations,
    from_csv_raw_html: strToWithoutKhmerAndHtml_remove_orUndefined_(x.from_csv_raw_html),
    // from_chuon_nath: x.from_chuon_nath,
    // from_chuon_nath_translated: x.from_chuon_nath_translated,
    from_russian_wiki: strToWithoutKhmerAndHtml_remove_orUndefined_(x.from_russian_wiki),
    en_km_com: strToWithoutKhmerAndHtml_remove_orUndefined_(x.en_km_com),
  }
}

// Helper to pick the best HTML source from the DB object
export const getBestDefinitionHtml = (detail: WordDetailKm): TypedWithoutKhmerAndHtml | undefined => {
  return (
    strToWithoutKhmerAndHtml_remove_orUndefined_(detail.desc) ||
    strToWithoutKhmerAndHtml_remove_orUndefined_(detail.en_km_com) ||
    strToWithoutKhmerAndHtml_remove_orUndefined_(detail.from_csv_raw_html) ||
    strToWithoutKhmerAndHtml_remove_orUndefined_(detail.from_russian_wiki)
  )
}
