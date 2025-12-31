import { useState, useEffect } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// DB & Utils
import * as DictDb from '../db/dict'
import { processData, type ProcessDataOutput } from '../utils/toGroup'
import { processDataKhmer, type ProcessDataOutputKhmer } from '../utils/toGroupKhmer'
import { extractKeysEn, extractKeysRu } from '../utils/keyExtractionGeneric'
import { extractKeysKhmer } from '../utils/keyExtractionKhmer'
import type { DictionaryLanguage } from '../types'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import { useToast } from '../providers/ToastProvider'

export type ProcessedDataState =
  | { mode: 'en'; data: ProcessDataOutput<CharUppercaseLatin> }
  | { mode: 'ru'; data: ProcessDataOutput<CharUppercaseCyrillic> }
  | { mode: 'km'; data: ProcessDataOutputKhmer }

const performProcessing = (words: NonEmptyStringTrimmed[], mode: DictionaryLanguage): ProcessedDataState => {
  if (mode === 'en') {
    return { mode: 'en', data: processData(extractKeysEn, words) }
  }
  if (mode === 'ru') {
    return { mode: 'ru', data: processData(extractKeysRu, words) }
  }
  const khmerInput = words.map(w => [w, extractKeysKhmer(w)] as const)

  return { mode: 'km', data: processDataKhmer(khmerInput) }
}

const isTab_NonDictionaryLanguage = (s: string) => s === 'history' || s === 'favorites' || s === 'settings'

interface UseDictionarySearchProps {
  activeTab: string
  dictData: Record<DictionaryLanguage, NonEmptyStringTrimmed[]>
  isRegex: boolean
  searchInContent: boolean
}

export function useDictionarySearch({ activeTab, dictData, isRegex, searchInContent }: UseDictionarySearchProps) {
  // This state now receives updates ONLY when the user stops typing
  const toast = useToast()
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const [contentMatches, setContentMatches] = useState<NonEmptyStringTrimmed[]>([])
  const [resultData, setResultData] = useState<ProcessedDataState | undefined>(undefined)
  const [resultCount, setResultCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // 1. Handle Deep Content Search (Async)
  useEffect(() => {
    let active = true
    const q = debouncedQuery.trim()

    if (!searchInContent || !q || isTab_NonDictionaryLanguage(activeTab)) {
      setContentMatches([])

      return
    }

    const fetchContent = async () => {
      try {
        // @ts-ignore
        const results = await DictDb.searchContentByMode(activeTab as DictionaryLanguage, q)

        if (active) setContentMatches(results)
      } catch (e: any) {
        toast.error('Search contnent by mode failed', e.message)
      }
    }

    fetchContent()

    return () => {
      active = false
    }
  }, [debouncedQuery, searchInContent, activeTab])

  // 2. Main Filtering with AbortController to allow cancellation
  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    if (isTab_NonDictionaryLanguage(activeTab)) {
      setResultData(undefined)
      setResultCount(0)

      return
    }

    const mode = activeTab as DictionaryLanguage
    const sourceArr = dictData[mode]

    if (sourceArr.length === 0) {
      setResultData(undefined)
      setResultCount(0)

      return
    }

    // If query is empty, process all data immediately (cheap enough usually, or memoized by effect dep)
    if (!debouncedQuery) {
      setResultData(performProcessing(sourceArr, mode))
      setResultCount(sourceArr.length)

      return
    }

    // --- Heavy Filtering Starts ---
    setIsSearching(true)

    // Wrap in a promise to push to next tick/allow abort logic
    const runSearch = async () => {
      // Yield to main thread to allow UI to show spinner if needed
      await new Promise(resolve => setTimeout(resolve, 0))

      if (signal.aborted) return

      let filteredList: NonEmptyStringTrimmed[] = sourceArr

      // Chunked processing could go here if extremely large, but standard filter is usually blocked.
      // We rely on the fact that this runs in an async wrapper so it doesn't freeze the *input* (which is now uncontrolled).
      if (isRegex) {
        try {
          const regex = new RegExp(debouncedQuery, 'i')

          filteredList = filteredList.filter(w => regex.test(w))
        } catch {
          filteredList = []
        }
      } else {
        const q = debouncedQuery.toLowerCase()

        // Optimization: Plain includes is fast, but for 100k items, it takes ~50ms.
        filteredList = filteredList.filter(w => w.toLowerCase().includes(q))
      }

      if (signal.aborted) return

      try {
        const processed = performProcessing(filteredList, mode)

        if (signal.aborted) return

        setResultData(processed)
        setResultCount(filteredList.length + contentMatches.length)
      } catch (e: any) {
        toast.error('Converting data to tree failed', e.message)
      } finally {
        if (!signal.aborted) setIsSearching(false)
      }
    }

    runSearch()

    return () => {
      abortController.abort()
      setIsSearching(false)
    }
  }, [debouncedQuery, activeTab, dictData, isRegex, contentMatches])

  return {
    onSearch: setDebouncedQuery, // Pass this to the SearchBar
    searchQuery: debouncedQuery, // For highlighting
    contentMatches,
    resultData,
    resultCount,
    isSearching,
  }
}
