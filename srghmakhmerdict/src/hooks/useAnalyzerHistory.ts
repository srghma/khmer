import { useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'

// --- Constants ---

const STORAGE_KEY = 'srghmakhmerdict__analyzer_history'
const MAX_HISTORY_ITEMS = 10

// --- Types ---

export interface AnalyzerHistoryItem {
  text: string
  savedAt: number // Unix timestamp ms
}

// --- Pure utils (exported so they can be unit-tested) ---

/**
 * Add a new entry to the history list, deduplicating and capping at MAX_HISTORY_ITEMS.
 * New items go to the front. Duplicates (same trimmed text) are removed first.
 */
export function analyzerHistory_add(history: AnalyzerHistoryItem[], text: string): AnalyzerHistoryItem[] {
  const trimmed = text.trim()

  if (!trimmed) return history

  // Remove existing entry with the same text (case/whitespace-exact)
  const filtered = history.filter(item => item.text !== trimmed)

  const newItem: AnalyzerHistoryItem = { text: trimmed, savedAt: Date.now() }

  return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
}

/**
 * Remove a specific entry by its savedAt timestamp (used as a stable id).
 */
export function analyzerHistory_remove(history: AnalyzerHistoryItem[], savedAt: number): AnalyzerHistoryItem[] {
  return history.filter(item => item.savedAt !== savedAt)
}

// --- Hook ---

export interface UseAnalyzerHistoryReturn {
  history: AnalyzerHistoryItem[]
  saveToHistory: (text: string) => void
  removeFromHistory: (savedAt: number) => void
  clearHistory: () => void
}

export function useAnalyzerHistory(): UseAnalyzerHistoryReturn {
  const [history, setHistory] = useLocalStorageState<AnalyzerHistoryItem[]>(STORAGE_KEY, {
    defaultValue: [],
  })

  const resolvedHistory = history ?? []

  const saveToHistory = useCallback(
    (text: string) => {
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

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  return { history: resolvedHistory, saveToHistory, removeFromHistory, clearHistory }
}
