import { useState, useEffect, useReducer, useMemo } from 'react'
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
import { useAppToast } from '../providers/ToastProvider'
import type { DictFilterSettings_Km_Mode } from '../providers/SettingsProvider'
import { useDictionary } from '../providers/DictionaryProvider'
import { useDebounce } from 'use-debounce'
import type { DictData } from '../initDictionary'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  Array_toNonEmptyArray_orUndefined,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

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
  query: FilterQuery | undefined,
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
  map: ReadonlyMap<NonEmptyStringTrimmed, { is_verified: boolean }>,
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

/**
 * Extracted Logic: Determines source iterable based on tab and settings.
 */
function getSourceIterator(
  lang: DictionaryLanguage,
  dictData: DictData,
  mode: DictFilterSettings_Km_Mode,
): Iterable<NonEmptyStringTrimmed> | undefined {
  switch (lang) {
    case 'en':
      return dictData.en
    case 'ru':
      return dictData.ru
    case 'km':
      return dictData.km_map ? getKhmerSourceIterator(dictData.km_map, mode) : undefined
    default:
      return assertNever(lang)
  }
}

// --- Reducer Logic ---

interface SearchState {
  contentMatches: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  resultData: ProcessedDataState | undefined
  dictMatchCount: number
  isSearching: boolean
  regexError: string | undefined
}

const INITIAL_STATE: SearchState = {
  contentMatches: undefined,
  resultData: undefined,
  dictMatchCount: 0,
  isSearching: false,
  regexError: undefined,
}

type SearchAction =
  | { type: 'RESET' }
  | { type: 'SET_REGEX_ERROR'; error: string }
  | { type: 'START_SEARCH' }
  | { type: 'SEARCH_SUCCESS'; data: ProcessedDataState; count: number }
  | { type: 'SET_CONTENT_MATCHES'; matches: NonEmptyArray<NonEmptyStringTrimmed> | undefined }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'RESET': {
      return INITIAL_STATE
    }

    case 'SET_REGEX_ERROR': {
      if (
        state.regexError === action.error &&
        state.resultData === undefined &&
        state.dictMatchCount === 0 &&
        state.isSearching === false
      ) {
        return state
      }

      return {
        ...state,
        regexError: action.error,
        resultData: undefined,
        dictMatchCount: 0,
        isSearching: false,
      }
    }

    case 'START_SEARCH': {
      if (state.isSearching === true && state.regexError === undefined) {
        return state
      }

      return {
        ...state,
        isSearching: true,
        regexError: undefined,
      }
    }

    case 'SEARCH_SUCCESS': {
      if (state.isSearching === false && state.dictMatchCount === action.count && state.resultData === action.data) {
        return state
      }

      return {
        ...state,
        isSearching: false,
        resultData: action.data,
        dictMatchCount: action.count,
      }
    }

    case 'SET_CONTENT_MATCHES': {
      // Critical optimization:
      // If matches are undefined (cleared) and already undefined, return state.
      // If matches are the same reference, return state.
      if (state.contentMatches === action.matches) {
        return state
      }

      return {
        ...state,
        contentMatches: action.matches,
      }
    }

    default:
      return state
  }
}

// --- Hook ---

interface UseDictionarySearchProps {
  activeTab: AppTab
  mode: DictFilterSettings_Km_Mode
  isRegex: boolean
  searchInContent: boolean
}

export function useDictionarySearch({ activeTab, mode, isRegex, searchInContent }: UseDictionarySearchProps) {
  const toast = useAppToast()
  const dictData = useDictionary()

  // Controlled input state
  const [query, setQuery] = useState<NonEmptyStringTrimmed | undefined>(undefined)
  const [debouncedQuery] = useDebounce(query, 300)
  const debouncedQueryNonEmpty = useMemo(
    () => (debouncedQuery ? String_toNonEmptyString_orUndefined_afterTrim(debouncedQuery) : undefined),
    [debouncedQuery],
  )

  // Reducer for complex search state
  const [state, dispatch] = useReducer(searchReducer, INITIAL_STATE)

  // 1. Handle Deep Content Search (Async)
  useEffect(() => {
    let active = true

    if (!searchInContent || !debouncedQueryNonEmpty || !isDictionaryLanguage(activeTab)) {
      dispatch({ type: 'SET_CONTENT_MATCHES', matches: undefined })

      return
    }

    const fetchContent = async () => {
      const l = stringToDictionaryLanguageOrThrow(activeTab)
      let results

      try {
        results = await DictDb.searchContentByMode(l, debouncedQueryNonEmpty)
      } catch (e: any) {
        toast.error('Search content by mode failed', e.message)

        return
      }
      if (active) {
        dispatch({ type: 'SET_CONTENT_MATCHES', matches: Array_toNonEmptyArray_orUndefined(results) })
      }
    }

    fetchContent()

    return () => {
      active = false
    }
  }, [debouncedQueryNonEmpty, searchInContent, activeTab, toast])

  // 2. Main Filtering
  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    // Step A: Validate prerequisites
    if (!isDictionaryLanguage(activeTab)) {
      dispatch({ type: 'RESET' })

      return
    }

    const sourceIter = getSourceIterator(activeTab, dictData, mode)

    if (!sourceIter) {
      dispatch({ type: 'RESET' })

      return
    }

    const filterQuery: FilterQuery | undefined = (() => {
      if (!debouncedQuery) return

      // Step B: Validate Query
      const queryResult = makeFilterQueryWithCache(debouncedQuery, isRegex)

      if (queryResult.t === 'error') {
        dispatch({ type: 'SET_REGEX_ERROR', error: queryResult.v })

        return
      }

      let filterQuery: FilterQuery | undefined = undefined

      if (queryResult.t === 'ok') filterQuery = queryResult.v

      return filterQuery
    })()

    // Step C: Execute Search
    dispatch({ type: 'START_SEARCH' })

    const runSearch = async () => {
      // Yield to main thread to avoid blocking UI immediately
      await new Promise(resolve => setTimeout(resolve, 0))
      if (signal.aborted) return

      // 1. Filter
      const filteredIter = filterDictionaryWords(sourceIter, filterQuery)

      // 2. Count
      let count = 0
      const countingIter = (function* () {
        for (const item of filteredIter) {
          count++
          yield item
        }
      })()

      // 3. Process
      const processed = performProcessing(countingIter, activeTab)

      if (signal.aborted) return

      dispatch({ type: 'SEARCH_SUCCESS', data: processed, count })
    }

    runSearch()

    return () => {
      abortController.abort()
      // Note: We don't explicitly dispatch 'RESET' or 'STOP' here to prevent flashing,
      // subsequent effects will handle state transitions.
    }
  }, [debouncedQuery, activeTab, dictData, mode, isRegex])

  // Derived result count
  const totalResultCount = state.dictMatchCount + (state.contentMatches?.length ?? 0)

  return {
    onSearch: setQuery,
    searchQuery: query,
    contentMatches: state.contentMatches,
    resultData: state.resultData,
    resultCount: totalResultCount,
    isSearching: state.isSearching,
    regexError: state.regexError,
  }
}
