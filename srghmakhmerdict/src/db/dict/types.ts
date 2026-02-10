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

export type KhmerWordsMapValue = { isKhmer: boolean; is_verified: boolean }
export type KhmerWordsMap = NonEmptyMap<NonEmptyStringTrimmed, KhmerWordsMapValue>

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
