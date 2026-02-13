import { useMemo } from 'react'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useSettings } from './providers/SettingsProvider'
import { isAppTabNonLanguage } from './types'
import { useDictionarySearch } from './hooks/useDictionarySearch'
import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'
import { useDictionary } from './providers/DictionaryProvider'
import { KhmerComplexTableModal } from './components/KhmerComplexTableModal/KhmerComplexTableModal'
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
  useAddToHistoryEffect()
  const dictData = useDictionary()

  const currentNavigationStackItem = useCurrentNavigationStackItem()

  const {
    searchMode,
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
    searchMode,
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

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      <div className={divClassName}>
        <SidebarHeader
          activeTab={activeTab}
          resultCount={resultCount}
          searchInitialValue={undefined}
          searchMode={searchMode}
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
            searchMode={searchMode}
            searchQuery={safeSearchQuery}
          />
        </div>
      </div>

      <RightPanel maybeColorMode={maybeColorMode} searchQuery={searchQuery} selectedWord={currentNavigationStackItem} />

      {dictData.km_map && (
        <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordsMap={dictData.km_map} onClose={onCloseKhmerTable} />
      )}
    </div>
  )
}
