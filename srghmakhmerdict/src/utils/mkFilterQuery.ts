import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { memoizeSync2_LRU } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import { unknown_to_errorMessage } from './errorMessage'

export type FilterQuery = { isRegex: true; v: RegExp } | { isRegex: false; v: NonEmptyStringTrimmed }

export type MakeFilterQueryResult = { t: 'empty' } | { t: 'ok'; v: FilterQuery } | { t: 'error'; v: string }

export const MakeFilterQueryResult_EMPTY = { t: 'empty' } as const

export function makeFilterQuery(debouncedQuery: string, isRegex: boolean): MakeFilterQueryResult {
  const debouncedQuery_ = String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery)

  if (!debouncedQuery_) return MakeFilterQueryResult_EMPTY

  if (isRegex) {
    try {
      return {
        t: 'ok',
        v: { isRegex: true, v: new RegExp(debouncedQuery, 'i') },
      }
    } catch (e: unknown) {
      return {
        t: 'error',
        v: unknown_to_errorMessage(e) ?? 'Invalid regular expression',
      }
    }
  }

  const v = String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery_.toLowerCase())

  if (!v) return MakeFilterQueryResult_EMPTY

  return {
    t: 'ok',
    v: { isRegex: false, v },
  }
}

export const mkMakeFilterQuery_memoized = () =>
  memoizeSync2_LRU(makeFilterQuery, (query: string, isRegex: boolean) => `${query}__${isRegex ? 'R' : 'S'}`)
