import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict/index'
import type { DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

// add a component that tests all 3
// srghmakhmerdict / src / utils / WordDetailEn_OnlyKhmerAndWithoutHtml.ts
// srghmakhmerdict / src / utils / WordDetailKm_WithoutKhmerAndHtml.ts
// srghmakhmerdict / src / utils / WordDetailRu_OnlyKhmerAndWithoutHtml.ts
// it takes DetailSectionsProps and for all 3 if there is a field in a processor that matches the field in props - process and show result. Test this way all 3

export interface DetailSectionsProps {
  desc: NonEmptyStringTrimmed | undefined //can have km
  desc_en_only: NonEmptyStringTrimmed | undefined // cannot have km
  en_km_com: NonEmptyStringTrimmed | undefined //can have km
  from_csv_raw_html: NonEmptyStringTrimmed | undefined //can have km
  from_csv_variants: NonEmptyArray<NonEmptyStringTrimmed> | undefined //can have km
  from_csv_noun_forms: NonEmptyArray<NonEmptyStringTrimmed> | undefined //can have km
  from_csv_pronunciations: NonEmptyArray<NonEmptyStringTrimmed> | undefined // cannot have km
  wiktionary: NonEmptyStringTrimmed | undefined //can have km
  from_russian_wiki: NonEmptyStringTrimmed | undefined //can have km
  gorgoniev: NonEmptyStringTrimmed | undefined //can have km
  from_chuon_nath: NonEmptyStringTrimmed | undefined //can have km
  from_chuon_nath_translated: NonEmptyStringTrimmed | undefined // cannot have km
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap
  mode: DictionaryLanguage
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
    | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
    | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
}
