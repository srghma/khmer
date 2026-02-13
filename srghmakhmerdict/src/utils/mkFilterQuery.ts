import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { memoizeSync2_LRU } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import { unknown_to_errorMessage } from './errorMessage'
import type { SearchMode } from '../providers/SettingsProvider'

export type FilterQuery =
  | { t: 'regex'; v: RegExp }
  | { t: 'starts_with'; v: NonEmptyStringTrimmed }
  | { t: 'includes'; v: NonEmptyStringTrimmed }

export type MakeFilterQueryResult = { t: 'empty' } | { t: 'ok'; v: FilterQuery } | { t: 'error'; v: string }

export const MakeFilterQueryResult_EMPTY = { t: 'empty' } as const

export function makeFilterQuery(debouncedQuery: string, searchMode: SearchMode): MakeFilterQueryResult {
  const debouncedQuery_ = String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery)

  if (!debouncedQuery_) return MakeFilterQueryResult_EMPTY

  if (searchMode === 'regex') {
    try {
      return {
        t: 'ok',
        v: { t: 'regex', v: new RegExp(debouncedQuery, 'i') },
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
    v: { t: searchMode, v },
  }
}

export const mkMakeFilterQuery_memoized = () =>
  memoizeSync2_LRU(makeFilterQuery, (query: string, searchMode: SearchMode) => `${query}__${searchMode}`)
