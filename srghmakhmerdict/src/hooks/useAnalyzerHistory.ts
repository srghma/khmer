import { useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// --- Constants ---

const STORAGE_KEY = 'srghmakhmerdict__analyzer_history'
const MAX_HISTORY_ITEMS = 10

// --- Types ---

export interface AnalyzerHistoryItem {
  text: NonEmptyStringTrimmed
  savedAt: number // Unix timestamp ms
}

// --- Pure utils (exported so they can be unit-tested) ---

/**
 * Add a new entry to the history list, deduplicating and capping at MAX_HISTORY_ITEMS.
 * New items go to the front. Duplicates (same trimmed text) are removed first.
 */
export function analyzerHistory_add(
  history: AnalyzerHistoryItem[],
  text: NonEmptyStringTrimmed,
): AnalyzerHistoryItem[] {
  // Remove existing entry with the same text (case/whitespace-exact)
  const filtered = history.filter(item => item.text !== text)

  const newItem: AnalyzerHistoryItem = { text, savedAt: Date.now() }

  return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
}

/**
 * Remove a specific entry by its savedAt timestamp (used as a stable id).
 */
export function analyzerHistory_remove(history: AnalyzerHistoryItem[], savedAt: number): AnalyzerHistoryItem[] {
  return history.filter(item => item.savedAt !== savedAt)
}
/**
 * Update a specific entry by its savedAt timestamp.
 */
export function analyzerHistory_update(
  history: AnalyzerHistoryItem[],
  savedAt: number,
  newText: NonEmptyStringTrimmed,
): AnalyzerHistoryItem[] {
  return history.map(item => (item.savedAt === savedAt ? { ...item, text: newText } : item))
}

// --- Hook ---

export interface UseAnalyzerHistoryReturn {
  history: AnalyzerHistoryItem[]
  saveToHistory: (text: NonEmptyStringTrimmed) => void
  removeFromHistory: (savedAt: number) => void
  updateHistoryItem: (savedAt: number, newText: NonEmptyStringTrimmed) => void
  clearHistory: () => void
}

export function useAnalyzerHistory(): UseAnalyzerHistoryReturn {
  const [history, setHistory] = useLocalStorageState<AnalyzerHistoryItem[]>(STORAGE_KEY, {
    defaultValue: [],
  })

  const resolvedHistory = history ?? []

  const saveToHistory = useCallback(
    (text: NonEmptyStringTrimmed) => {
      setHistory(prev => analyzerHistory_add(prev ?? [], text))
    },
    [setHistory],
  )

  const removeFromHistory = useCallback(
    (savedAt: number) => {
      setHistory(prev => analyzerHistory_remove(prev ?? [], savedAt))
    },
    [setHistory],
  )

  const updateHistoryItem = useCallback(
    (savedAt: number, newText: NonEmptyStringTrimmed) => {
      setHistory(prev => analyzerHistory_update(prev ?? [], savedAt, newText))
    },
    [setHistory],
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  return { history: resolvedHistory, saveToHistory, removeFromHistory, updateHistoryItem, clearHistory }
}
