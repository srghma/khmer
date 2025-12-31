import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'

interface HistoryItem {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
}

interface NavigationContextType {
  currentWord: HistoryItem | null
  canGoBack: boolean
  /** Pushes a new word onto the stack (used for internal links/search) */
  navigateTo: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  /** Clears stack and sets the word (used for Sidebar selection) */
  resetNavigation: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  /** Pops the stack */
  goBack: () => void
  /** Clears everything (closes the detail view) */
  clearSelection: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [currentWord, setCurrentWord] = useState<HistoryItem | null>(null)

  // 1. Navigate (Push to history) - Internal links / Selection Search
  const navigateTo = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
      if (currentWord) {
        // Prevent pushing duplicate if clicking the same word repeatedly
        if (currentWord.word === word && currentWord.mode === mode) return

        setHistory(prev => [...prev, currentWord])
      }
      setCurrentWord({ word, mode })
    },
    [currentWord],
  )

  // 2. Reset (Sidebar click) - Clear history, start fresh
  const resetNavigation = useCallback((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    setHistory([])
    setCurrentWord({ word, mode })
  }, [])

  // 3. Go Back (Pop from history)
  const goBack = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev]
      const previousItem = newHistory.pop()

      if (previousItem) {
        setCurrentWord(previousItem)

        return newHistory
      }

      // If history is empty, deciding whether to close or stay is handled by clearSelection,
      // but strictly 'goBack' on empty history implies clearing if we consider
      // the "list view" as the root.
      setCurrentWord(null)

      return []
    })
  }, [])

  // 4. Clear Selection (Close Detail View)
  const clearSelection = useCallback(() => {
    setHistory([])
    setCurrentWord(null)
  }, [])

  const canGoBack = history.length > 0

  return (
    <NavigationContext.Provider
      value={{
        currentWord,
        canGoBack,
        navigateTo,
        resetNavigation,
        goBack,
        clearSelection,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)

  if (!context) throw new Error('useNavigation must be used within a NavigationProvider')

  return context
}
