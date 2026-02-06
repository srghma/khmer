import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { listen } from '@tauri-apps/api/event'
import { useToast } from './providers/ToastProvider'
import { useNavigation } from './providers/NavigationProvider'
import { useSettings } from './providers/SettingsProvider'

import { isAppTabNonLanguage, type AppTab, type DictionaryLanguage } from './types'

import { useDictionarySearch } from './hooks/useDictionarySearch'

import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'

import './App.css'
import { useDictionary } from './providers/DictionaryProvider'
import { usePreloadOnIdle } from './utils/lazyWithPreload'
import lazyWithPreload from 'react-lazy-with-preload'
import { detectModeFromText } from './utils/rendererUtils'
import { KhmerAnalyzerModal } from './components/KhmerAnalyzerModal/KhmerAnalyzerModal'

// Replaced static import with Lazy load to reduce initial bundle size
const KhmerComplexTableModal = lazyWithPreload(() =>
  import('./components/KhmerComplexTableModal/KhmerComplexTableModal').then(module => ({
    default: module.KhmerComplexTableModal,
  })),
)

function App() {
  const { theme } = useTheme()
  const dictData = useDictionary()
  const toast = useToast()

  const { currentHistoryItem, resetNavigation, clearSelection } = useNavigation()

  usePreloadOnIdle([KhmerComplexTableModal])

  const {
    isRegex,
    searchInContent,
    highlightInList,
    highlightInDetails,
    uiFontSize,
    detailsFontSize,
    filters,
    isKhmerTableOpen,
    onCloseKhmerTable,
    maybeColorMode,
    setMaybeColorMode,
  } = useSettings()

  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme])

  const [activeTab, setActiveTab] = useState<AppTab>('en')
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0)

  const { onSearch, searchQuery, contentMatches, resultData, resultCount, isSearching } = useDictionarySearch({
    activeTab,
    mode: filters.km.mode,
    isRegex,
    searchInContent,
  })

  useEffect(() => {
    const unlisten = listen<string[]>('deep-link://new-url', event => {
      const url = event.payload[0]

      if (url && url.startsWith('srghmakhmerdict://')) {
        try {
          let wordR = decodeURIComponent(url.substring('srghmakhmerdict://'.length))

          wordR = (wordR.split('?')[0] ?? '').replace(/\/$/, '')
          const word = String_toNonEmptyString_orUndefined_afterTrim(wordR)

          if (word) {
            const targetMode: DictionaryLanguage = detectModeFromText(word, 'en')

            setActiveTab(targetMode)
            resetNavigation(word, targetMode)
            toast.success('Link Opened', `Navigating to "${word}"`)
          }
        } catch (e: any) {
          toast.error('Deep Link Failed', `Could not open the requested word. ${e.message}`)
        }
      }
    })

    return () => {
      unlisten.then(f => f())
    }
  }, [])

  const handleTabChange = useCallback(
    (key: AppTab) => {
      setActiveTab(key)
      onSearch(undefined)
    },
    [onSearch],
  )

  const handleSidebarSelect = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
      resetNavigation(word, mode)
      if (activeTab !== 'history') setRefreshHistoryTrigger(p => p + 1)
    },
    [activeTab, resetNavigation],
  )

  const handleWordClickKm = useCallback(
    (w: NonEmptyStringTrimmed) => handleSidebarSelect(w, 'km'),
    [handleSidebarSelect],
  )
  const handleWordClickEn = useCallback(
    (w: NonEmptyStringTrimmed) => handleSidebarSelect(w, 'en'),
    [handleSidebarSelect],
  )
  const handleWordClickRu = useCallback(
    (w: NonEmptyStringTrimmed) => handleSidebarSelect(w, 'ru'),
    [handleSidebarSelect],
  )

  const safeSearchQuery = useMemo(
    () => (searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery],
  )

  const uiFontSize_ = useMemo(() => ({ fontSize: `${uiFontSize}px`, lineHeight: 1.5 }), [uiFontSize])

  const divClassName = useMemo(
    () =>
      `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] pt-[env(safe-area-inset-top)] ${
        currentHistoryItem ? 'hidden md:flex' : 'w-full'
      }`,
    [currentHistoryItem],
  )

  // --- Memoized Render Prop ---
  // This function is stable, so ReactSelectionPopup won't re-render unless these deps change
  const [khmerAnalyzerModalText_setToOpen, setKhmerAnalyzerModalText_setToOpen] = useState<
    NonEmptyStringTrimmed | undefined
  >()

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      {/* Khmer Analyzer Modal */}
      {khmerAnalyzerModalText_setToOpen && currentHistoryItem && (
        <KhmerAnalyzerModal
          currentMode={currentHistoryItem.mode}
          km_map={dictData.km_map}
          maybeColorMode={maybeColorMode}
          textAndOpen={khmerAnalyzerModalText_setToOpen}
          onClose={() => setKhmerAnalyzerModalText_setToOpen(undefined)}
        />
      )}

      <div className={divClassName}>
        <SidebarHeader
          activeTab={activeTab}
          isRegex={isRegex}
          resultCount={resultCount}
          searchInitialValue={undefined}
          showSearchBar={!isAppTabNonLanguage(activeTab)}
          onSearch={onSearch}
          onTabChange={handleTabChange}
        />

        <div className="flex-1 flex overflow-hidden relative bg-content1" style={uiFontSize_}>
          <SidebarContent
            activeTab={activeTab}
            contentMatches={contentMatches}
            highlightInList={highlightInList}
            isSearching={isSearching}
            km_map={dictData.km_map}
            loading={dictData === undefined}
            maybeColorMode="segmenter"
            refreshHistoryTrigger={refreshHistoryTrigger}
            resultData={resultData}
            searchQuery={safeSearchQuery}
            onHistorySelect={handleSidebarSelect}
            onWordClickEn={handleWordClickEn}
            onWordClickKm={handleWordClickKm}
            onWordClickRu={handleWordClickRu}
          />
        </div>
      </div>

      <RightPanel
        detailsFontSize={detailsFontSize}
        highlightInDetails={highlightInDetails}
        km_map={dictData.km_map}
        maybeColorMode={maybeColorMode}
        searchQuery={searchQuery}
        selectedWord={currentHistoryItem}
        setKhmerAnalyzerModalText_setToOpen={setKhmerAnalyzerModalText_setToOpen}
        setMaybeColorMode={setMaybeColorMode}
        onBack={clearSelection}
        onNavigate={handleSidebarSelect}
      />

      {dictData.km_map && (
        <Suspense fallback={null}>
          <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordsMap={dictData.km_map} onClose={onCloseKhmerTable} />
        </Suspense>
      )}
    </div>
  )
}

export default App
