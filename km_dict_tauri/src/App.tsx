import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { listen } from '@tauri-apps/api/event'
import { useToast } from './providers/ToastProvider'
import { useNavigation } from './providers/NavigationProvider' // Import

import { type DictionaryLanguage } from './types'
import { type DictFilterSettings } from './components/SettingsView'
import { KhmerComplexTableModal } from './components/KhmerComplexTableModal'
import { useDictionarySearch } from './hooks/useDictionarySearch'
import { useDictionaryData } from './hooks/useDictionaryData'

import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'

import './App.css'

const DEFAULT_FILTERS: DictFilterSettings = {
  km: {
    desc: 'all',
    phonetic: 'all',
    wiktionary: 'all',
    from_csv: 'all',
    from_chuon_nath: 'all',
    from_russian_wiki: 'all',
  },
  en: { desc: 'all' },
  ru: { desc: 'all' },
}

function App() {
  const { theme } = useTheme()
  const { loading, dictData } = useDictionaryData()
  const toast = useToast()

  // Use Global Navigation Hook instead of local state
  const { currentWord, resetNavigation, clearSelection } = useNavigation()

  // --- Theme Effect ---
  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme])

  // --- State ---
  const [activeTab, setActiveTab] = useState<string>('en')
  // selectedWord state removed in favor of useNavigation
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0)

  // Settings state
  const [isRegex, setIsRegex] = useState(false)
  const [highlightInList, setHighlightInList] = useState(true)
  const [highlightInDetails, setHighlightInDetails] = useState(true)
  const [searchInContent, setSearchInContent] = useState(false)
  const [uiFontSize, setUiFontSize] = useState(14)
  const [detailsFontSize, setDetailsFontSize] = useState(16)
  const [filters, setFilters] = useState<DictFilterSettings>(DEFAULT_FILTERS)
  const [isKhmerTableOpen, setIsKhmerTableOpen] = useState(false)

  // --- Hooks ---
  const { onSearch, searchQuery, contentMatches, resultData, resultCount, isSearching } = useDictionarySearch({
    activeTab,
    dictData,
    isRegex,
    searchInContent,
  })

  // --- Deep Link Listener ---
  useEffect(() => {
    const unlisten = listen<string[]>('deep-link://new-url', event => {
      const url = event.payload[0]

      if (url && url.startsWith('srghmakhmerdict://')) {
        try {
          let wordR = decodeURIComponent(url.substring('srghmakhmerdict://'.length))

          wordR = (wordR.split('?')[0] ?? '').replace(/\/$/, '')
          const word = String_toNonEmptyString_orUndefined_afterTrim(wordR)

          if (word) {
            const firstChar = word.charAt(0)
            let targetMode: DictionaryLanguage = 'en'

            if (/\p{Script=Khmer}/u.test(firstChar)) targetMode = 'km'
            else if (/\p{Script=Cyrillic}/u.test(firstChar)) targetMode = 'ru'

            setActiveTab(targetMode)

            // Use resetNavigation for deep links to start a fresh stack
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

  // --- Handlers ---
  const handleTabChange = useCallback(
    (key: React.Key) => {
      setActiveTab(key as string)
      onSearch('')
    },
    [onSearch],
  )

  // Used by Sidebar: Resets stack (standard 2-pane behavior)
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

  const handleOpenKhmerTable = useCallback(() => setIsKhmerTableOpen(true), [])
  const handleCloseKhmerTable = useCallback(() => setIsKhmerTableOpen(false), [])

  const settingsProps = useMemo(
    () => ({
      filters,
      setFilters,
      detailsFontSize,
      setDetailsFontSize,
      uiFontSize,
      setUiFontSize,
      isRegex,
      setIsRegex,
      highlightInDetails,
      setHighlightInDetails,
      highlightInList,
      setHighlightInList,
      searchInContent,
      setSearchInContent,
      onOpenKhmerTable: handleOpenKhmerTable,
    }),
    [
      filters,
      detailsFontSize,
      uiFontSize,
      isRegex,
      highlightInDetails,
      highlightInList,
      searchInContent,
      handleOpenKhmerTable,
    ],
  )

  const safeSearchQuery = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(searchQuery), [searchQuery])
  const isSettingsTab = activeTab === 'history' || activeTab === 'favorites' || activeTab === 'settings'

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      {/* LEFT PANEL */}
      <div
        className={`flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all ${
          currentWord ? 'hidden md:flex' : 'w-full'
        } md:w-[400px] lg:w-[450px]`}
      >
        <SidebarHeader
          activeTab={activeTab}
          isRegex={isRegex}
          resultCount={resultCount}
          showSearchBar={!isSettingsTab}
          onSearch={onSearch}
          onTabChange={handleTabChange}
        />

        <div
          className="flex-1 flex overflow-hidden relative bg-content1"
          style={{ fontSize: `${uiFontSize}px`, lineHeight: 1.5 }}
        >
          <SidebarContent
            activeTab={activeTab}
            contentMatches={contentMatches}
            highlightInList={highlightInList}
            isSearching={isSearching}
            loading={loading}
            refreshHistoryTrigger={refreshHistoryTrigger}
            resultData={resultData}
            searchQuery={safeSearchQuery}
            settingsProps={settingsProps}
            onHistorySelect={handleSidebarSelect}
            onWordClickEn={handleWordClickEn}
            onWordClickKm={handleWordClickKm}
            onWordClickRu={handleWordClickRu}
          />
        </div>
      </div>

      {/* RIGHT PANEL - Now uses Context internally for navigation, just passing props for display */}
      <RightPanel
        detailsFontSize={detailsFontSize}
        highlightInDetails={highlightInDetails}
        km_setOfPureKhmerWords={dictData.km_setOfPureKhmerWords}
        searchQuery={searchQuery}
        // Pass null if no word selected
        selectedWord={currentWord}
        onBack={clearSelection} // Only used for 'Closing' via prop, internal nav uses context
        onNavigate={handleSidebarSelect} // This prop is legacy/fallback, RightPanel will use hook
      />

      <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordList={dictData.km} onClose={handleCloseKhmerTable} />
    </div>
  )
}

export default App
