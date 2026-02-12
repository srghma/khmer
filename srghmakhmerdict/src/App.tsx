import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { useNavigation } from './providers/NavigationProvider'
import { useSettings } from './providers/SettingsProvider'

import { isAppTabNonLanguage, type AppTab } from './types'

import { useDictionarySearch } from './hooks/useDictionarySearch'

import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'

import './App.css'
import { useDictionary } from './providers/DictionaryProvider'
import { KhmerAnalyzerModal } from './components/KhmerAnalyzerModal/KhmerAnalyzerModal'
import { KhmerComplexTableModal } from './components/KhmerComplexTableModal/KhmerComplexTableModal'
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler'
import { Modal, ModalContent } from '@heroui/react'
import { AnkiGame } from './components/Anki/AnkiGame'
import { AnkiPulseProvider } from './components/Anki/AnkiPulseContext'
import { AnkiSettingsProvider } from './components/Anki/useAnkiSettings'

const ankiModalClassNames = {
  // body: 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
  header: 'mt-[env(safe-area-inset-top)]',
  closeButton: 'mt-[env(safe-area-inset-top)]',
}

function App() {
  const { theme } = useTheme()
  const dictData = useDictionary()

  const [isAnkiOpen, setIsAnkiOpen] = useState(false)
  const handleOpenAnki = useCallback(() => setIsAnkiOpen(true), [])
  const handleCloseAnki = useCallback(() => setIsAnkiOpen(false), [])

  const { currentNavigationStackItem, resetNavigationAndSetCurrentTo, clearSelection } = useNavigation()

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

  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme])

  const [activeTab, setActiveTab] = useState<AppTab>('en')

  const { onSearch, searchQuery, contentMatches, resultData, resultCount, isSearching } = useDictionarySearch({
    activeTab,
    mode: filters.km.mode,
    isRegex,
    searchInContent,
  })

  useDeepLinkHandler({
    setActiveTab,
    resetNavigation: resetNavigationAndSetCurrentTo,
  })

  const handleTabChange = useCallback(
    (key: AppTab) => {
      setActiveTab(key)
      onSearch(undefined)
    },
    [onSearch],
  )

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

  // --- Memoized Render Prop ---
  const [khmerAnalyzerModalText_setToOpen, setKhmerAnalyzerModalText_setToOpen] = useState<
    NonEmptyStringTrimmed | undefined
  >()

  const khmerAnalyzerModal_onClose = useCallback(() => setKhmerAnalyzerModalText_setToOpen(undefined), [])

  // New handler: Close modal AND Navigate
  const handleKhmerAnalyzerWordSelect = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setKhmerAnalyzerModalText_setToOpen(undefined) // Close modal
      resetNavigationAndSetCurrentTo(word, 'km') // Navigate to detail view
    },
    [resetNavigationAndSetCurrentTo],
  )

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      {/* Khmer Analyzer Modal */}
      {khmerAnalyzerModalText_setToOpen && currentNavigationStackItem && (
        <KhmerAnalyzerModal
          currentMode={currentNavigationStackItem.mode}
          km_map={dictData.km_map}
          maybeColorMode={maybeColorMode}
          textAndOpen={khmerAnalyzerModalText_setToOpen}
          onClose={khmerAnalyzerModal_onClose}
          onNavigate={handleKhmerAnalyzerWordSelect}
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

        <div className="flex-1 flex overflow-hidden relative bg-content1" style={fontSize_ui_}>
          <SidebarContent
            activeTab={activeTab}
            contentMatches={contentMatches}
            handleOpenAnki={handleOpenAnki}
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
        onBack={clearSelection}
        onNavigate={resetNavigationAndSetCurrentTo}
      />

      {dictData.km_map && (
        <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordsMap={dictData.km_map} onClose={onCloseKhmerTable} />
      )}

      <Modal
        classNames={ankiModalClassNames}
        isOpen={isAnkiOpen}
        scrollBehavior="inside"
        size="full"
        onClose={handleCloseAnki}
      >
        <AnkiPulseProvider>
          <AnkiSettingsProvider>
            <ModalContent>
              <AnkiGame />
            </ModalContent>
          </AnkiSettingsProvider>
        </AnkiPulseProvider>
      </Modal>
    </div>
  )
}

export default App
