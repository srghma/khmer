import {
  strToWithoutKhmerAndHtml_remove_orUndefined,
  type TypedWithoutKhmerAndHtml,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer-and-html'
import { wiktionary_km__get_short_info__only_en_or_ru_text_without_html } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-short-description-km-extractor'
import { wiktionary_ru__get_short_info__only_ru_text_without_html } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-short-description-ru-extractor'
import type { ShortDefinitionKm, WordDetailKm } from '../db/dict'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

type Processor<K extends keyof WordDetailKm> = (x: WordDetailKm[K]) => TypedWithoutKhmerAndHtml | undefined

const strToWithoutKhmerAndHtml_remove_orUndefined_ = undefined_lift(strToWithoutKhmerAndHtml_remove_orUndefined)

export const processors: { [K in keyof WordDetailKm]-?: Processor<K> } = {
  desc: x => strToWithoutKhmerAndHtml_remove_orUndefined_(x),
  phonetic: () => undefined,
  wiktionary: x =>
    strToWithoutKhmerAndHtml_remove_orUndefined_(
      undefined_lift(wiktionary_km__get_short_info__only_en_or_ru_text_without_html)(x),
    ),
  from_csv_variants: () => undefined,
  from_csv_noun_forms: () => undefined,
  from_csv_pronunciations: () => undefined,
  from_csv_raw_html: x => strToWithoutKhmerAndHtml_remove_orUndefined_(x),
  from_chuon_nath: () => undefined,
  from_chuon_nath_translated: x => strToWithoutKhmerAndHtml_remove_orUndefined_(x),
  from_russian_wiki: x =>
    strToWithoutKhmerAndHtml_remove_orUndefined_(
      undefined_lift(wiktionary_ru__get_short_info__only_ru_text_without_html)(x),
    ),
  gorgoniev: x => {
    if (x === undefined) return undefined
    const ipaTag = 'pre' as NonEmptyStringTrimmed

    return strToWithoutKhmerAndHtml_remove_orUndefined(x, [ipaTag])
  },
  en_km_com: x => strToWithoutKhmerAndHtml_remove_orUndefined_(x),
}

// Helper to pick the best HTML source from the DB object
export const getBestDefinitionEnOrRuFromKm = (
  detail: WordDetailKm,
): { t: ShortDefinitionKm['source']; v: TypedWithoutKhmerAndHtml } | undefined => {
  const desc = processors.desc(detail.desc)

  if (desc) return { t: 'Desc', v: desc }

  const en_km_com = processors.en_km_com(detail.en_km_com)

  if (en_km_com) return { t: 'EnKmCom', v: en_km_com }

  const from_csv_raw_html = processors.from_csv_raw_html(detail.from_csv_raw_html)

  if (from_csv_raw_html) return { t: 'FromCsvRawHtml', v: from_csv_raw_html }

  const wiktionary = processors.wiktionary(detail.wiktionary)

  if (wiktionary) return { t: 'Wiktionary', v: wiktionary }

  const from_russian_wiki = processors.from_russian_wiki(detail.from_russian_wiki)

  if (from_russian_wiki) return { t: 'FromRussianWiki', v: from_russian_wiki }

  const from_chuon_nath_translated = processors.from_chuon_nath_translated(detail.from_chuon_nath_translated)

  if (from_chuon_nath_translated) return { t: 'FromChuonNathTranslated', v: from_chuon_nath_translated }

  return undefined
}

export const getBestDefinitionEnOrRuFromKm_fromShort = (
  shortDef: ShortDefinitionKm,
): TypedWithoutKhmerAndHtml | undefined => {
  switch (shortDef.source) {
    case 'Wiktionary':
      return processors.wiktionary(shortDef.definition)
    case 'FromRussianWiki':
      return processors.from_russian_wiki(shortDef.definition)
    case 'Gorgoniev':
      return processors.gorgoniev(shortDef.definition)
    case 'FromCsvRawHtml':
      return processors.from_csv_raw_html(shortDef.definition)
    case 'EnKmCom':
      return processors.en_km_com(shortDef.definition)
    case 'Desc':
      return processors.desc(shortDef.definition)
    case 'FromChuonNathTranslated':
      return processors.from_chuon_nath_translated(shortDef.definition)
    default:
      assertNever(shortDef.source)
  }
}
