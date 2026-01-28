import { useState, useEffect, useCallback, useMemo } from 'react'
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

import { isAppTabNonLanguage, stringToAppTabOrThrow, type AppTab, type DictionaryLanguage } from './types'
import { KhmerComplexTableModal } from './components/KhmerComplexTableModal'
import { useDictionarySearch } from './hooks/useDictionarySearch'
// import { useDictionaryData } from './hooks/useDictionaryData'

import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'

import './App.css'
import { useDictionary } from './providers/DictionaryProvider'

function App() {
  const { theme } = useTheme()
  const dictData = useDictionary()
  const toast = useToast()

  const { currentWord, resetNavigation, clearSelection } = useNavigation()

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
            const firstChar = word.charAt(0)
            let targetMode: DictionaryLanguage = 'en'

            if (/\p{Script=Khmer}/u.test(firstChar)) targetMode = 'km'
            else if (/\p{Script=Cyrillic}/u.test(firstChar)) targetMode = 'ru'

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
    (key: React.Key) => {
      setActiveTab(stringToAppTabOrThrow(String(key)))
      onSearch('')
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

  const safeSearchQuery = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(searchQuery), [searchQuery])

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      <div
        className={`flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all ${
          currentWord ? 'hidden md:flex' : 'w-full'
        } md:w-[400px] lg:w-[450px]`}
      >
        <SidebarHeader
          activeTab={activeTab}
          isRegex={isRegex}
          resultCount={resultCount}
          showSearchBar={!isAppTabNonLanguage(activeTab)}
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
            loading={dictData === undefined}
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
        searchQuery={searchQuery}
        selectedWord={currentWord}
        onBack={clearSelection}
        onNavigate={handleSidebarSelect}
      />

      {dictData.km_map && (
        <KhmerComplexTableModal isOpen={isKhmerTableOpen} wordsMap={dictData.km_map} onClose={onCloseKhmerTable} />
      )}
    </div>
  )
}

export default App
