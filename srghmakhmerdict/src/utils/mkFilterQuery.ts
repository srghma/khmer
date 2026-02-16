import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { memoizeSync3_LRU } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import { unknown_to_errorMessage } from './errorMessage'
import type { SearchMode } from '../providers/SettingsProvider'
import type { DictionaryLanguage } from '../types'
import { isStringLowercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-lowercase-cyrillic'
import { russianToKhmerRegex } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/russianToKhmerRegex'
// import { isStringLowercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-lowercase-latin'

export type FilterQuery =
  | { t: 'regex'; v: RegExp }
  | { t: 'starts_with'; v: NonEmptyStringTrimmed }
  | { t: 'includes'; v: NonEmptyStringTrimmed }

export type MakeFilterQueryResult = { t: 'empty' } | { t: 'ok'; v: FilterQuery } | { t: 'error'; v: string }

export const MakeFilterQueryResult_EMPTY = { t: 'empty' } as const

export function makeFilterQuery(
  debouncedQuery: string,
  searchMode: SearchMode,
  dictionaryLanguage: DictionaryLanguage,
): MakeFilterQueryResult {
  const debouncedQuery_ = String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery)

  if (!debouncedQuery_) return MakeFilterQueryResult_EMPTY

  // Check if we're searching Khmer with Cyrillic (Russian) input
  // Convert Russian to Khmer regex pattern for pronunciation-based search
  if (dictionaryLanguage === 'km' && searchMode !== 'regex') {
    const lowercased = debouncedQuery_.toLowerCase()

    if (isStringLowercaseCyrillic(lowercased)) {
      try {
        const khmerPattern = russianToKhmerRegex(lowercased)

        return {
          t: 'ok',
          v: {
            t: 'regex',
            v: searchMode === 'starts_with' ? new RegExp(`^${khmerPattern}`) : new RegExp(khmerPattern, 'i'),
          },
        }
      } catch (e: unknown) {
        return {
          t: 'error',
          v: unknown_to_errorMessage(e) ?? 'Failed to convert Russian to Khmer pattern',
        }
      }
    }

    // if (isStringLowercaseLatin(lowercased)) {
    //   try {
    //     const khmerPattern = englishToKhmerRegex(lowercased)

    //     return {
    //       t: 'ok',
    //       v: {
    //         t: 'regex',
    //         v: searchMode === 'starts_with' ? new RegExp(`^${khmerPattern}`) : new RegExp(khmerPattern, 'i'),
    //       },
    //     }
    //   } catch (e: unknown) {
    //     return {
    //       t: 'error',
    //       v: unknown_to_errorMessage(e) ?? 'Failed to convert English to Khmer pattern',
    //     }
    //   }
    // }
  }

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
  memoizeSync3_LRU(
    makeFilterQuery,
    (query: string, searchMode: SearchMode, lang: DictionaryLanguage) => `${query}__${searchMode}__${lang}`,
  )
