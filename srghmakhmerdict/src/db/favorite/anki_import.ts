import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  isContainsKhmer,
  type TypedContainsKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { getUserDb } from '../core'

import {
  strToCyrillicPhrase_orUndefined_normalize,
  type StringCyrillicPhrase,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-cyrillic-phrase'
import { type Lazy, defer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/lazy'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  Map_assertNonEmptyMap,
  Map_toNonEmptyMap_orUndefined,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'

import { areWordsInDict_map } from '../dict/are_words_in_dict_map'
import { type MaybeFrontBack, MaybeFrontBack_mk } from './bulkInsertFavorites_front_back_html'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { processInAndNotInDbResult, type PartitionedMaps_Split_Imported } from './anki_import/process'
import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'

type PartitionedMaps = {
  en: NonEmptyMap<NonEmptyStringTrimmed, MaybeFrontBack | undefined> | undefined
  km: NonEmptyMap<TypedContainsKhmer, MaybeFrontBack | undefined> | undefined
  ru: NonEmptyMap<NonEmptyStringTrimmed, MaybeFrontBack | undefined> | undefined
}

function partitionByLanguage(words: NonEmptyMap<NonEmptyStringTrimmed, MaybeFrontBack | undefined>): PartitionedMaps {
  type PartitionedMapsInternal = {
    en: Map<NonEmptyStringTrimmed, MaybeFrontBack | undefined>
    km: Map<TypedContainsKhmer, MaybeFrontBack | undefined>
    ru: Map<NonEmptyStringTrimmed, MaybeFrontBack | undefined>
  }

  const partitioned: PartitionedMapsInternal = { en: new Map(), km: new Map(), ru: new Map() }

  for (const [word, value] of words) {
    const ru: Lazy<StringCyrillicPhrase | undefined> = defer(() => strToCyrillicPhrase_orUndefined_normalize(word))

    if (isContainsKhmer(word)) {
      partitioned.km.set(word, value)
    } else if (ru()) {
      partitioned.ru.set(assertIsDefinedAndReturn(ru()), value)
    } else {
      partitioned.en.set(word, value)
    }
  }

  return {
    en: Map_toNonEmptyMap_orUndefined(partitioned.en),
    km: Map_toNonEmptyMap_orUndefined(partitioned.km),
    ru: Map_toNonEmptyMap_orUndefined(partitioned.ru),
  }
}

import { parse } from 'csv-parse/browser/esm/sync'

function parseTsvOrCsv(
  input: NonEmptyStringTrimmed,
  separator: Char,
): NonEmptyMap<NonEmptyStringTrimmed, MaybeFrontBack | undefined> {
  const records = parse(input, {
    delimiter: separator,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  })

  const itemsMap = new Map<NonEmptyStringTrimmed, MaybeFrontBack | undefined>()

  for (const record of records) {
    const wordS = record[0] ?? ''
    const frontS = record[1] ?? ''
    // If there's more than 3 columns, join the rest into back
    const backS = record.slice(2).join('\n')

    const word = String_toNonEmptyString_orUndefined_afterTrim(wordS)

    if (word) {
      const front = String_toNonEmptyString_orUndefined_afterTrim(frontS)
      const back = String_toNonEmptyString_orUndefined_afterTrim(backS)

      const maybeFrontBack: MaybeFrontBack | undefined = MaybeFrontBack_mk(front, back)

      itemsMap.set(word, maybeFrontBack)
    }
  }

  Map_assertNonEmptyMap(itemsMap)

  return itemsMap
}

export type LangImportSuccess = {
  success: number
  skipped: number
}

export type ImportResult = {
  en: LangImportSuccess | NonEmptySet<NonEmptyStringTrimmed> | undefined
  km: LangImportSuccess | NonEmptySet<TypedContainsKhmer> | undefined
  ru: LangImportSuccess | NonEmptySet<NonEmptyStringTrimmed> | undefined
}

export async function importWordsToAnki(
  input: NonEmptyStringTrimmed,
  separator: Char,
): Promise<PartitionedMaps_Split_Imported<MaybeFrontBack | undefined>> {
  const userDb = await getUserDb()
  const now = Date.now()

  // 1. Get Dictionary check result
  const dictCheck = await areWordsInDict_map(partitionByLanguage(parseTsvOrCsv(input, separator)))

  // 2. Process each language
  // EXPLICTLY PASS <MaybeFrontBack | undefined> to fix inference
  const [en, km, ru] = await Promise.all([
    dictCheck.en
      ? processInAndNotInDbResult<NonEmptyStringTrimmed, MaybeFrontBack | undefined>(userDb, 'en', dictCheck.en, now)
      : undefined,
    dictCheck.km
      ? processInAndNotInDbResult<TypedContainsKhmer, MaybeFrontBack | undefined>(userDb, 'km', dictCheck.km, now)
      : undefined,
    dictCheck.ru
      ? processInAndNotInDbResult<NonEmptyStringTrimmed, MaybeFrontBack | undefined>(userDb, 'ru', dictCheck.ru, now)
      : undefined,
  ])

  return { en, km, ru }
}
