import { invoke } from '../invoke'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  Array_toNonEmptyArray_orUndefined,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { type NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

export type InAndNotInDb<T> =
  | { inDb: NonEmptyArray<T>; notInDb: NonEmptyArray<T> | undefined }
  | { inDb: NonEmptyArray<T> | undefined; notInDb: NonEmptyArray<T> }

export type AreWordsInDictResponse = {
  en: InAndNotInDb<NonEmptyStringTrimmed> | undefined
  ru: InAndNotInDb<NonEmptyStringTrimmed> | undefined
  km: InAndNotInDb<TypedContainsKhmer> | undefined
}

type InAndNotInDbRaw<T> = { in_db: T[]; not_in_db: T[] }

/**
 * Validates backend response and converts raw arrays to NonEmpty equivalents.
 */
function rawResponse_to_InAndNotInDb<T>(
  input: NonEmptySet<T> | undefined,
  raw: InAndNotInDbRaw<T>,
): InAndNotInDb<T> | undefined {
  if (input === undefined) {
    if (raw.in_db.length !== 0 || raw.not_in_db.length !== 0) {
      throw Error(
        `IMPOSSIBLE: input was empty, but backend returned words. in_db: ${raw.in_db.length}, not_in_db: ${raw.not_in_db.length}`,
      )
    }

    return undefined
  }

  const inDb = Array_toNonEmptyArray_orUndefined(raw.in_db)
  const notInDb = Array_toNonEmptyArray_orUndefined(raw.not_in_db)

  // Since input was a NonEmptySet, the backend MUST return at least one word
  // distributed between inDb or notInDb.
  if (inDb === undefined && notInDb === undefined) {
    throw Error('IMPOSSIBLE: input was non-empty, but backend returned empty results for both inDb and notInDb')
  }

  return { inDb, notInDb } as InAndNotInDb<T>
}

export const areWordsInDict = async (payload: {
  en: NonEmptySet<NonEmptyStringTrimmed> | undefined
  ru: NonEmptySet<NonEmptyStringTrimmed> | undefined
  km: NonEmptySet<TypedContainsKhmer> | undefined
}): Promise<AreWordsInDictResponse> => {
  type AreWordsInDictRaw = {
    en: InAndNotInDbRaw<NonEmptyStringTrimmed>
    ru: InAndNotInDbRaw<NonEmptyStringTrimmed>
    km: InAndNotInDbRaw<TypedContainsKhmer>
  }

  const res = await invoke<AreWordsInDictRaw>('are_words_in_dict', {
    en: payload.en ? Array.from(payload.en) : [],
    ru: payload.ru ? Array.from(payload.ru) : [],
    km: payload.km ? Array.from(payload.km) : [],
  })

  return {
    en: rawResponse_to_InAndNotInDb(payload.en, res.en),
    ru: rawResponse_to_InAndNotInDb(payload.ru, res.ru),
    km: rawResponse_to_InAndNotInDb(payload.km, res.km),
  }
}
