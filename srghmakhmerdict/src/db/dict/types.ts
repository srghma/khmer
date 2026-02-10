import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import type * as z from 'zod/mini'
import type { WordDetailKmSchema, WordDetailEnSchema, WordDetailRuSchema } from './schema'

export type KhmerWordsMapValue = { isKhmer: boolean; is_verified: boolean }
export type KhmerWordsMap = NonEmptyMap<NonEmptyStringTrimmed, KhmerWordsMapValue>

export type WordDetailKm = z.infer<typeof WordDetailKmSchema>
export type WordDetailEn = z.infer<typeof WordDetailEnSchema>
export type WordDetailRu = z.infer<typeof WordDetailRuSchema>

export interface WordDetailEnOrRuOrKm extends WordDetailKm {
  readonly word_display?: NonEmptyStringTrimmed
  readonly desc_en_only?: NonEmptyStringTrimmed
}

export type LanguageToDetailMap = {
  en: WordDetailEn
  km: WordDetailKm
  ru: WordDetailRu
}
