import { createContext, useContext, useState, useCallback, type ReactNode, useMemo, useEffect, useRef } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { useAppToast } from './ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { useHistory } from './HistoryProvider'

interface NavigationStackItem {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
}

interface NavigationContextType {
  currentNavigationStackItem: NavigationStackItem | undefined
  canGoBack: boolean
  /** Pushes a new word onto the stack (used for internal links/search) */
  navigateTo: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  /** Clears stack and sets the word (used for Sidebar selection) */
  resetNavigationAndSetCurrentTo: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  /** Pops the stack */
  goBack: () => void
  /** Clears everything (closes the detail view) */
  clearSelection: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const { addToHistory } = useHistory()
  // Internal Stack for "Back" functionality within the app (e.g. following links)
  const [navigationStack, setNavigationStack] = useState<NavigationStackItem[]>([])
  const [currentNavigationStackItem, setCurrentNavigationStackItem] = useState<NavigationStackItem | undefined>(undefined)

  // Refs to access latest state inside event listeners without re-binding
  const navigationStackRef = useRef(navigationStack)
  const currentNavigationStackItemRef = useRef(currentNavigationStackItem)

  useEffect(() => {
    navigationStackRef.current = navigationStack
  }, [navigationStack])

  useEffect(() => {
    currentNavigationStackItemRef.current = currentNavigationStackItem
  }, [currentNavigationStackItem])

  // --- Internal State Logic ---

  // Performed when 'popstate' fires (Hardware Back) OR when 'goBack' (UI Back) triggers history.back()
  const toast = useAppToast()
  const performInternalPop = useCallback(() => {
    const currentStack = navigationStackRef.current
    const currentItem = currentNavigationStackItemRef.current

    // Case 1: Stack has items (Internal navigation A -> B)
    if (currentStack.length > 0) {
      const newStack = [...currentStack]
      const previousItem = newStack.pop()

      if (previousItem) {
        setNavigationStack(newStack)
        setCurrentNavigationStackItem(previousItem)
      } else {
        // Fallback: Clear everything if stack was somehow empty/invalid
        setNavigationStack([])
        setCurrentNavigationStackItem(undefined)
      }
      return
    }

    // Case 2: Stack is empty but Detail View is open (Sidebar -> Detail)
    if (currentItem) {
      setCurrentNavigationStackItem(undefined)
      setNavigationStack([])
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

  // --- Sync with Persistent History ---
  useEffect(() => {
    if (currentNavigationStackItem) {
      addToHistory(currentNavigationStackItem.word, currentNavigationStackItem.mode).catch(e => {
        toast.error('Error adding to history' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      })
    }
  }, [currentNavigationStackItem, addToHistory, toast])

  // --- Public API ---

  // 1. Navigate (Push to history)
  const navigateTo = useCallback(
    async (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
      // Prevent duplicate navigation
      if (currentNavigationStackItem?.word === word && currentNavigationStackItem?.mode === mode) return

      // If we have a current item, push it to stack before navigating
      if (currentNavigationStackItem) {
        setNavigationStack(prev => [...prev, currentNavigationStackItem])
      }

      setCurrentNavigationStackItem({ word, mode })

      // Push to Browser History to enable System Back Button
      window.history.pushState({ type: 'internal' }, '', '')
    },
    [currentNavigationStackItem],
  )

  // 2. Reset (Sidebar click)
  const resetNavigationAndSetCurrentTo = useCallback((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    // If we are currently showing NOTHING (e.g. initial load or cleared selection),
    // we PUSH state so the back button works to return to "nothing".
    // Otherwise, we REPLACE state to avoid building up a huge stack of sidebar clicks.
    if (!currentNavigationStackItemRef.current) {
      window.history.pushState({ type: 'root' }, '', '')
    } else {
      window.history.replaceState({ type: 'root' }, '', '')
    }

    setNavigationStack([])
    setCurrentNavigationStackItem({ word, mode })
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
    setNavigationStack([])
    setCurrentNavigationStackItem(undefined)
  }, [])

  const canGoBack = navigationStack.length > 0

  const value = useMemo(
    () => ({
      currentNavigationStackItem,
      canGoBack,
      navigateTo,
      resetNavigationAndSetCurrentTo,
      goBack,
      clearSelection,
    }),
    [currentNavigationStackItem, canGoBack, navigateTo, resetNavigationAndSetCurrentTo, goBack, clearSelection],
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)

  if (!context) throw new Error('useNavigation must be used within a NavigationProvider')

  return context
}
