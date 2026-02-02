import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  strToWithoutKhmer_remove_orUndefined,
  type TypedWithoutKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer'
import type { WordDetailKm } from '../db/dict'

export type WordDetailKm_WithoutKhmer = {
  word: NonEmptyStringTrimmed
  desc: TypedWithoutKhmer | undefined
  phonetic: NonEmptyStringTrimmed | undefined
  wiktionary: TypedWithoutKhmer | undefined // html
  from_csv_variants: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_noun_forms: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_pronunciations: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  from_csv_raw_html: TypedWithoutKhmer | undefined // html
  from_chuon_nath: NonEmptyStringTrimmed | undefined
  from_chuon_nath_translated: NonEmptyStringTrimmed | undefined
  from_russian_wiki: TypedWithoutKhmer | undefined // html
  en_km_com: TypedWithoutKhmer | undefined // html
}

export const wordDetailKm_WithoutKhmer_mk = (x: WordDetailKm): WordDetailKm_WithoutKhmer => {
  return {
    word: x.word,
    desc: x.desc ? strToWithoutKhmer_remove_orUndefined(x.desc) : undefined,
    phonetic: x.phonetic,
    wiktionary: x.wiktionary ? strToWithoutKhmer_remove_orUndefined(x.wiktionary) : undefined,
    from_csv_variants: x.from_csv_variants,
    from_csv_noun_forms: x.from_csv_noun_forms,
    from_csv_pronunciations: x.from_csv_pronunciations,
    from_csv_raw_html: x.from_csv_raw_html ? strToWithoutKhmer_remove_orUndefined(x.from_csv_raw_html) : undefined,
    from_chuon_nath: x.from_chuon_nath,
    from_chuon_nath_translated: x.from_chuon_nath_translated,
    from_russian_wiki: x.from_russian_wiki ? strToWithoutKhmer_remove_orUndefined(x.from_russian_wiki) : undefined,
    en_km_com: x.en_km_com ? strToWithoutKhmer_remove_orUndefined(x.en_km_com) : undefined,
  }
}
