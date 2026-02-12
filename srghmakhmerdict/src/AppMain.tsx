import { useState, useCallback, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useSettings } from './providers/SettingsProvider'
import { isAppTabNonLanguage } from './types'
import { useDictionarySearch } from './hooks/useDictionarySearch'
import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'
import { useDictionary } from './providers/DictionaryProvider'
import { KhmerAnalyzerModal } from './components/KhmerAnalyzerModal/KhmerAnalyzerModal'
import { KhmerComplexTableModal } from './components/KhmerComplexTableModal/KhmerComplexTableModal'
import { useLocation } from 'wouter'
import { useAddToHistoryEffect } from './hooks/useAddToHistoryEffect'
import { useAppMainView, useAppActiveTab } from './hooks/useAppMainView'

function useCurrentNavigationStackItem() {
  const currentView = useAppMainView()

  return useMemo(() => {
    if (currentView.type === 'history' || currentView.type === 'favorites' || currentView.type === 'dashboard') {
      return currentView.word ? { word: currentView.word, mode: currentView.mode } : undefined
    }

    return undefined
  }, [currentView])
}

export function AppMain() {
  const [_, setLocation] = useLocation()

  useAddToHistoryEffect()
  const dictData = useDictionary()

  const currentNavigationStackItem = useCurrentNavigationStackItem()

  const {
    isRegex,
    searchInContent,
    highlightInList,
    fontSize_ui,
    filters,
    isKhmerTableOpen,
    onCloseKhmerTable,
    maybeColorMode,
  } = useSettings()
  const activeTab = useAppActiveTab()

  const { onSearch, searchQuery, contentMatches, resultData, resultCount, isSearching } = useDictionarySearch({
    activeTab,
    mode: filters.km.mode,
    isRegex,
    searchInContent,
  })

  const safeSearchQuery = useMemo(
    () => (searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery],
  )

  const fontSize_ui_ = useMemo(() => ({ fontSize: `${fontSize_ui}px`, lineHeight: 1.5 }), [fontSize_ui])

  const divClassName = useMemo(
    () =>
      `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] pt-[env(safe-area-inset-top)] ${
        currentNavigationStackItem ? 'hidden md:flex' : 'w-full'
      }`,
    [currentNavigationStackItem],
  )

  const [khmerAnalyzerModalText_setToOpen, setKhmerAnalyzerModalText_setToOpen] = useState<
    NonEmptyStringTrimmed | undefined
  >()

  const khmerAnalyzerModal_onClose = useCallback(() => setKhmerAnalyzerModalText_setToOpen(undefined), [])

  const handleKhmerAnalyzerWordSelect = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setKhmerAnalyzerModalText_setToOpen(undefined)
      setLocation(`/km/${encodeURIComponent(word)}`)
    },
    [setLocation],
  )

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      {/* Khmer Analyzer Modal */}
      {khmerAnalyzerModalText_setToOpen && currentNavigationStackItem ? (
        <KhmerAnalyzerModal
          currentMode={currentNavigationStackItem.mode}
          km_map={dictData.km_map}
          maybeColorMode={maybeColorMode}
          textAndOpen={khmerAnalyzerModalText_setToOpen}
          onClose={khmerAnalyzerModal_onClose}
          onNavigate={handleKhmerAnalyzerWordSelect}
        />
      ) : null}

      <div className={divClassName}>
        <SidebarHeader
          activeTab={activeTab}
          isRegex={isRegex}
          resultCount={resultCount}
          searchInitialValue={undefined}
          showSearchBar={!isAppTabNonLanguage(activeTab)}
          onSearch={onSearch}
        />

        <div className="flex-1 flex overflow-hidden relative bg-content1" style={fontSize_ui_}>
          <SidebarContent
            activeTab={activeTab}
            contentMatches={contentMatches}
            highlightInList={highlightInList}
            isSearching={isSearching}
            km_map={dictData.km_map}
            loading={dictData === undefined}
            maybeColorMode="segmenter"
            resultData={resultData}
            searchQuery={safeSearchQuery}
          />
        </div>
      </div>

      <RightPanel
        km_map={dictData.km_map}
        maybeColorMode={maybeColorMode}
        searchQuery={searchQuery}
        selectedWord={currentNavigationStackItem}
        setKhmerAnalyzerModalText_setToOpen={setKhmerAnalyzerModalText_setToOpen}
      />

      {dictData.km_map && (
        <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordsMap={dictData.km_map} onClose={onCloseKhmerTable} />
      )}
    </div>
  )
}
