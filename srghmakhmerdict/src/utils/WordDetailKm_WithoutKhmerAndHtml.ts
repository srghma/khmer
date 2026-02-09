import {
  strToWithoutKhmerAndHtml_remove_orUndefined,
  type TypedWithoutKhmerAndHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer-and-html'
import type { WordDetailKm } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import { type Lazy, defer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/lazy'

export type WordDetailKm_WithoutKhmerAndHtml = {
  // word: NonEmptyStringTrimmed // contains khmer, not needed
  desc: Lazy<TypedWithoutKhmerAndHtml | undefined>
  // phonetic: NonEmptyStringTrimmed | undefined // not needed
  wiktionary: Lazy<TypedWithoutKhmerAndHtml | undefined> // html
  // from_csv_variants: NonEmptyArray<NonEmptyStringTrimmed> | undefined // fully khmer
  // from_csv_noun_forms: NonEmptyArray<NonEmptyStringTrimmed> | undefined // fully khmer
  // from_csv_pronunciations: NonEmptyArray<NonEmptyStringTrimmed> | undefined // not needed
  from_csv_raw_html: Lazy<TypedWithoutKhmerAndHtml | undefined> // html
  // from_chuon_nath: NonEmptyStringTrimmed | undefined // fully khmer
  from_chuon_nath_translated: Lazy<TypedWithoutKhmerAndHtml | undefined>
  from_russian_wiki: Lazy<TypedWithoutKhmerAndHtml | undefined> // html
  en_km_com: Lazy<TypedWithoutKhmerAndHtml | undefined> // html
}

const strToWithoutKhmerAndHtml_remove_orUndefined_ = undefined_lift(strToWithoutKhmerAndHtml_remove_orUndefined)

export const wordDetailKm_WithoutKhmerAndHtml_mk = (x: WordDetailKm): WordDetailKm_WithoutKhmerAndHtml => {
  return {
    // word: x.word,

    // Expensive fields -> wrapped in defer (memoized thunks)
    desc: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.desc)),
    wiktionary: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.wiktionary)),
    from_csv_raw_html: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.from_csv_raw_html)),
    from_russian_wiki: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.from_russian_wiki)),
    en_km_com: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.en_km_com)),
    from_chuon_nath_translated: defer(() => strToWithoutKhmerAndHtml_remove_orUndefined_(x.from_chuon_nath_translated)),

    // Cheap fields -> passed directly
    // phonetic: x.phonetic,
    // from_csv_variants: x.from_csv_variants,
    // from_csv_noun_forms: x.from_csv_noun_forms,
    // from_csv_pronunciations: x.from_csv_pronunciations,
  }
}

// Helper to pick the best HTML source from the DB object
// Because of Lazy, the first valid result prevents subsequent HTML processing.
export const getBestDefinitionHtml = (detail: WordDetailKm): TypedWithoutKhmerAndHtml | undefined => {
  const lazy = wordDetailKm_WithoutKhmerAndHtml_mk(detail)

  return (
    lazy.desc() ||
    lazy.en_km_com() ||
    lazy.from_csv_raw_html() ||
    lazy.wiktionary() || // needs special treatment
    lazy.from_russian_wiki() || // needs special treatment
    lazy.from_chuon_nath_translated()
  )
}
