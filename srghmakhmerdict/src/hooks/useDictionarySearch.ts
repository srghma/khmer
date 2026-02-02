import { useState, useEffect } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// DB & Utils
import * as DictDb from '../db/dict'
import { processData, type ProcessDataOutput } from '../utils/toGroup'
import { processDataKhmer, type ProcessDataOutputKhmer } from '../utils/toGroupKhmer'
import { extractKeysEn, extractKeysRu } from '../utils/keyExtractionGeneric'
import { extractKeysKhmer } from '../utils/keyExtractionKhmer'
import { mkMakeFilterQuery_memoized, type FilterQuery } from '../utils/mkFilterQuery'
import { isDictionaryLanguage, stringToDictionaryLanguageOrThrow, type AppTab, type DictionaryLanguage } from '../types'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import { useToast } from '../providers/ToastProvider'
import type { DictFilterSettings_Km_Mode } from '../providers/SettingsProvider'
import { useDictionary } from '../providers/DictionaryProvider'

export type ProcessedDataState =
  | { mode: 'en'; data: ProcessDataOutput<CharUppercaseLatin> }
  | { mode: 'ru'; data: ProcessDataOutput<CharUppercaseCyrillic> }
  | { mode: 'km'; data: ProcessDataOutputKhmer }

// Initialize memoized filter query maker (LRU Cache of 20)
// We do this outside the hook so the cache persists across component re-renders
const makeFilterQueryWithCache = mkMakeFilterQuery_memoized()

// Helper generator to map Khmer words to [word, keys] without creating an array
function* mapKhmerInput(words: Iterable<NonEmptyStringTrimmed>) {
  // console.log('words', words)
  for (const w of words) {
    // try {
    yield [w, extractKeysKhmer(w)] as const
    // } catch (e: any) {
    //   console.error('extractKeysKhmer error', JSON.stringify(w), toHex(w), e)
    // }
  }
}

const performProcessing = (words: Iterable<NonEmptyStringTrimmed>, mode: DictionaryLanguage): ProcessedDataState => {
  if (mode === 'en') {
    return { mode: 'en', data: processData(extractKeysEn, words) }
  }
  if (mode === 'ru') {
    return { mode: 'ru', data: processData(extractKeysRu, words) }
  }

  const data = processDataKhmer(mapKhmerInput(words))
  // console.log('performProcessing data khmer', data)

  return { mode: 'km', data }
}

/**
 * Generator function to filter words.
 * The query object is pre-validated, so no try/catch is needed here.
 */
function* filterDictionaryWords(
  source: Iterable<NonEmptyStringTrimmed>,
  query: FilterQuery | null,
): Generator<NonEmptyStringTrimmed> {
  // If no query, yield everything
  if (!query) {
    yield* source

    return
  }

  if (query.isRegex) {
    const regex = query.v

    for (const word of source) {
      if (regex.test(word)) yield word
    }
  } else {
    // We expect query.v to be lowercased by the caller for performance
    const q = query.v

    for (const word of source) {
      if (word.toLowerCase().includes(q)) yield word
    }
  }
}

/**
 * Generator to iterate Khmer map based on verification mode.
 */
function* getKhmerSourceIterator(
  map: Map<NonEmptyStringTrimmed, { is_verified: boolean }>,
  mode: DictFilterSettings_Km_Mode,
): Generator<NonEmptyStringTrimmed> {
  if (mode === 'only_verified') {
    for (const [word, val] of map) {
      if (val.is_verified) yield word
    }
  } else {
    for (const word of map.keys()) {
      yield word
    }
  }
}

interface UseDictionarySearchProps {
  activeTab: AppTab
  mode: DictFilterSettings_Km_Mode
  isRegex: boolean
  searchInContent: boolean
}

export function useDictionarySearch({ activeTab, mode, isRegex, searchInContent }: UseDictionarySearchProps) {
  const toast = useToast()
  const dictData = useDictionary()
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const [contentMatches, setContentMatches] = useState<NonEmptyStringTrimmed[]>([])
  const [resultData, setResultData] = useState<ProcessedDataState | undefined>(undefined)
  const [resultCount, setResultCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [regexError, setRegexError] = useState<string | null>(null)

  // 1. Handle Deep Content Search (Async)
  useEffect(() => {
    let active = true
    const q = String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery)

    // Reset regex error here as well if query changes?
    // Usually main effect handles it, but deep search doesn't use regex currently.

    if (!searchInContent || !q || !isDictionaryLanguage(activeTab)) {
      setContentMatches([])

      return
    }

    const fetchContent = async () => {
      const l = stringToDictionaryLanguageOrThrow(activeTab)

      let results

      try {
        results = await DictDb.searchContentByMode(l, q)
      } catch (e: any) {
        toast.error('Search content by mode failed', e.message)

        return
      }
      if (active) setContentMatches(results)
    }

    fetchContent()

    return () => {
      active = false
    }
  }, [debouncedQuery, searchInContent, activeTab])

  // 2. Main Filtering
  useEffect(() => {
    // console.log('something updated', debouncedQuery, activeTab, mode, isRegex, contentMatches)
    const abortController = new AbortController()
    const signal = abortController.signal

    // Reset Error State
    setRegexError(null)

    if (!isDictionaryLanguage(activeTab)) {
      // console.log('!isDictionaryLanguage(activeTab)')
      setResultData(undefined)
      setResultCount(0)

      return
    }

    // Determine source iterable
    let sourceIter: Iterable<NonEmptyStringTrimmed> | null = null

    if (activeTab === 'en') sourceIter = dictData.en
    else if (activeTab === 'ru') sourceIter = dictData.ru
    else if (activeTab === 'km') {
      // console.log('dictData.km_map', dictData.km_map)
      if (dictData.km_map) {
        sourceIter = getKhmerSourceIterator(dictData.km_map, mode)
      }
    }

    if (!sourceIter) {
      // console.log('!sourceIter')
      setResultData(undefined)
      setResultCount(0)

      return
    }

    // ---------------------------------------------------------
    // Validate Regex / Prepare Query Object BEFORE async/yield
    // ---------------------------------------------------------
    // Use the memoized function to generate the query object
    const queryResult = makeFilterQueryWithCache(debouncedQuery, isRegex)

    // console.log('queryResult', queryResult)

    if (queryResult.t === 'error') {
      // If regex is invalid, show error and do not search
      setRegexError(queryResult.v)
      setResultData(undefined)
      setResultCount(0)

      return
    }

    let filterQuery: FilterQuery | null = null

    if (queryResult.t === 'ok') filterQuery = queryResult.v

    // If 'empty', filterQuery remains null (and filterDictionaryWords yields all)

    setIsSearching(true)

    const runSearch = async () => {
      // console.log('runSearch')
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0))
      if (signal.aborted) return

      // 1. Create Filter Generator using the pre-validated query object
      const filteredIter = filterDictionaryWords(sourceIter, filterQuery)

      // 2. Create a "Tap" generator to count items
      let count = 0
      const countingIter = (function* () {
        for (const item of filteredIter) {
          count++
          yield item
        }
      })()

      // 3. Process Data
      // console.log('activeTab', activeTab)
      const processed = performProcessing(countingIter, activeTab)

      // console.log('processed', processed)

      if (signal.aborted) return

      setResultData(processed)
      setResultCount(count + contentMatches.length)
      if (!signal.aborted) setIsSearching(false)
    }

    runSearch()

    return () => {
      abortController.abort()
      setIsSearching(false)
    }
  }, [debouncedQuery, activeTab, dictData, mode, isRegex, contentMatches])

  return {
    onSearch: setDebouncedQuery,
    searchQuery: debouncedQuery,
    contentMatches,
    resultData,
    resultCount,
    isSearching,
    regexError, // expose error to UI
  }
}
