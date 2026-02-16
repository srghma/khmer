import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import type * as z from 'zod/mini'
import type {
  WordDetailKmSchema,
  WordDetailEnSchema,
  WordDetailRuSchema,
  ShortDefinitionEnSchema,
  ShortDefinitionRuSchema,
  ShortDefinitionKmSchema,
} from './schema'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { KhmerToRussianOutput } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmerToRussianOutput'

export type KhmerWordsMapValue = {
  isKhmer: boolean
  is_verified: boolean
  ru_translit: KhmerToRussianOutput | undefined
  en_translit: NonEmptyStringTrimmed | undefined
}
export type KhmerWordsMap = NonEmptyMap<TypedContainsKhmer, KhmerWordsMapValue>

export type WordDetailKm = z.infer<typeof WordDetailKmSchema>
export type WordDetailEn = z.infer<typeof WordDetailEnSchema>
export type WordDetailRu = z.infer<typeof WordDetailRuSchema>

export type ShortDefinitionEn = z.infer<typeof ShortDefinitionEnSchema>
export type ShortDefinitionRu = z.infer<typeof ShortDefinitionRuSchema>
export type ShortDefinitionKm = z.infer<typeof ShortDefinitionKmSchema>

export type ShortDefinition = ShortDefinitionEn | ShortDefinitionRu | ShortDefinitionKm

export interface WordDetailEnOrRuOrKm extends WordDetailKm {
  readonly word_display?: NonEmptyStringTrimmed
  readonly desc_en_only?: NonEmptyStringTrimmed
  readonly gorgoniev?: NonEmptyStringTrimmed
}

export type LanguageToDetailMap = {
  en: WordDetailEn
  km: WordDetailKm
  ru: WordDetailRu
}

export type LanguageToShortDefinitionMap = {
  en: ShortDefinitionEn
  km: ShortDefinitionKm
  ru: ShortDefinitionRu
}

export type LanguageToShortDefinitionSum =
  | { t: 'en'; v: ShortDefinitionEn }
  | { t: 'km'; v: ShortDefinitionKm }
  | { t: 'ru'; v: ShortDefinitionRu }
