import * as z from 'zod/mini'
import { NonEmptyArraySchema } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array-zod'
import { NonEmptyStringTrimmedSchema } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed-zod'

export const WordDetailKmSchema = z.strictObject({
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
  phonetic: z.optional(NonEmptyStringTrimmedSchema),
  wiktionary: z.optional(NonEmptyStringTrimmedSchema), // html
  from_csv_variants: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_noun_forms: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_pronunciations: z.optional(NonEmptyArraySchema(NonEmptyStringTrimmedSchema)),
  from_csv_raw_html: z.optional(NonEmptyStringTrimmedSchema), // html
  from_chuon_nath: z.optional(NonEmptyStringTrimmedSchema),
  from_chuon_nath_translated: z.optional(NonEmptyStringTrimmedSchema),
  from_russian_wiki: z.optional(NonEmptyStringTrimmedSchema), // html
  gorgoniev: z.optional(NonEmptyStringTrimmedSchema), // html
  en_km_com: z.optional(NonEmptyStringTrimmedSchema), // html
})

export const WordDetailEnSchema = z.strictObject({
  word_display: z.optional(NonEmptyStringTrimmedSchema), // html
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
  desc_en_only: z.optional(NonEmptyStringTrimmedSchema), // html
  en_km_com: z.optional(NonEmptyStringTrimmedSchema), // html
})

export const WordDetailRuSchema = z.strictObject({
  word_display: z.optional(NonEmptyStringTrimmedSchema),
  desc: z.optional(NonEmptyStringTrimmedSchema), // html
})

export const ShortDefinitionEnSourceSchema = z.enum(['Desc', 'EnKmCom', 'DescEnOnly'])
export const ShortDefinitionEnSchema = z.strictObject({
  definition: NonEmptyStringTrimmedSchema,
  source: ShortDefinitionEnSourceSchema,
})

export const ShortDefinitionRuSourceSchema = z.enum(['Desc'])
export const ShortDefinitionRuSchema = z.strictObject({
  definition: NonEmptyStringTrimmedSchema,
  source: ShortDefinitionRuSourceSchema,
})

export const ShortDefinitionKmSourceSchema = z.enum([
  'FromCsvRawHtml',
  'EnKmCom',
  'Desc',
  'FromChuonNathTranslated',
  'Wiktionary',
  'FromRussianWiki',
  'Gorgoniev',
])
export const ShortDefinitionKmSchema = z.strictObject({
  definition: NonEmptyStringTrimmedSchema,
  source: ShortDefinitionKmSourceSchema,
})
