import { createContext, useContext, useState, useCallback, type ReactNode, useMemo, useEffect, useRef } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'

interface HistoryItem {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
}

interface NavigationContextType {
  currentHistoryItem: HistoryItem | undefined
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
  const [currentHistoryItem, setCurrentHistoryItem] = useState<HistoryItem | undefined>(undefined)

  // Refs to access latest state inside event listeners without re-binding
  const historyRef = useRef(history)
  const currentHistoryItemRef = useRef(currentHistoryItem)

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    currentHistoryItemRef.current = currentHistoryItem
  }, [currentHistoryItem])

  // --- Internal State Logic ---

  // Performed when 'popstate' fires (Hardware Back) OR when 'goBack' (UI Back) triggers history.back()
  const performInternalPop = useCallback(() => {
    const currentHist = historyRef.current
    const currentHI = currentHistoryItemRef.current

    // Case 1: Stack has items (Internal navigation A -> B)
    if (currentHist.length > 0) {
      setHistory(prev => {
        const newHistory = [...prev]
        const previousItem = newHistory.pop()

        if (previousItem) {
          setCurrentHistoryItem(previousItem)

          return newHistory
        }

        return []
      })

      return
    }

    // Case 2: Stack is empty but Detail View is open (Sidebar -> Detail)
    if (currentHI) {
      setCurrentHistoryItem(undefined)
      setHistory([])
    }
  }, [])

  // --- Event Listener ---

  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      // Intercept the browser/system back action
      // We rely on the fact that if we pushed state, the browser stays on the page
      // and simply fires this event.
      performInternalPop()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [performInternalPop])

  // --- Public API ---

  // 1. Navigate (Push to history)
  const navigateTo = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
      if (currentHistoryItem) {
        if (currentHistoryItem.word === word && currentHistoryItem.mode === mode) return

        // Push current word to internal stack
        setHistory(prev => [...prev, currentHistoryItem])
      }
      setCurrentHistoryItem({ word, mode })

      // Push to Browser History to enable System Back Button
      window.history.pushState({ type: 'internal' }, '', '')
    },
    [currentHistoryItem],
  )

  // 2. Reset (Sidebar click)
  const resetNavigation = useCallback((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    // If we are transitioning from "List View" (null) to "Detail View", push a history state.
    // If we are already in "Detail View" and just clicking another sidebar item,
    // we REPLACE the state (so we don't build an infinite back stack for sidebar clicks),
    // or we can choose to PUSH if we want sidebar clicks to be back-navigable too.
    // Standard Master-Detail pattern usually replaces detail view.
    if (currentHistoryItemRef.current === null) {
      window.history.pushState({ type: 'root' }, '', '')
    } else {
      // Optional: use replaceState if you don't want sidebar navigation to pile up history
      window.history.replaceState({ type: 'root' }, '', '')
    }

    setHistory([])
    setCurrentHistoryItem({ word, mode })
  }, [])

  // 3. Go Back (Trigger System Back)
  const goBack = useCallback(() => {
    // Instead of manipulating state directly, we tell the browser to go back.
    // This triggers 'popstate', which calls 'performInternalPop', which updates React state.
    // This ensures UI Back Button and Hardware Back Button behave identically.
    window.history.back()
  }, [])

  // 4. Clear Selection (Close via X button)
  const clearSelection = useCallback(() => {
    // For the "X" button, we force clear.
    // Note: This leaves "forward" history in the browser if the user had navigated deep.
    // This is generally acceptable for a "Close" action.
    setHistory([])
    setCurrentHistoryItem(undefined)
  }, [])

  const canGoBack = history.length > 0

  const value = useMemo(
    () => ({
      currentHistoryItem,
      canGoBack,
      navigateTo,
      resetNavigation,
      goBack,
      clearSelection,
    }),
    [currentHistoryItem, canGoBack, navigateTo, resetNavigation, goBack, clearSelection],
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)

  if (!context) throw new Error('useNavigation must be used within a NavigationProvider')

  return context
}
