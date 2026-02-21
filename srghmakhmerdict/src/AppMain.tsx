import { useMemo, useEffect, useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useSettings } from './providers/SettingsProvider'
import { isAppTabNonLanguage, type DictionaryLanguage } from './types'
import { useDictionarySearch } from './hooks/useDictionarySearch'
import { SidebarHeader } from './components/SidebarHeader'
import { SidebarContent } from './components/SidebarContent'
import { RightPanel } from './components/RightPanel'
import { useDictionary } from './providers/DictionaryProvider'
import { AboutView } from './components/About/AboutView'
import { KhmerAnalyzerView } from './components/KhmerAnalyzerView'
import { useAddToHistoryEffect } from './hooks/useAddToHistoryEffect'
import { useAppMainView, useAppActiveTab } from './hooks/useAppMainView'
import { detectModeFromText } from './utils/detectModeFromText'
import { useAppToast } from './providers/ToastProvider'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

export function AppMain() {
  useAddToHistoryEffect()
  const currentView = useAppMainView()
  const dictData = useDictionary()

  const currentNavigationStackItem = useMemo(() => {
    if (currentView.type === 'history' || currentView.type === 'favorites' || currentView.type === 'dashboard') {
      return currentView.word ? { word: currentView.word, mode: currentView.mode } : undefined
    }

    return undefined
  }, [currentView])

  const [lastSelectedWord, setLastSelectedWord] = useLocalStorageState<
    { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | undefined
  >('lastSelectedWord')

  useEffect(() => {
    if (currentNavigationStackItem) {
      setLastSelectedWord(currentNavigationStackItem)
    }
  }, [currentNavigationStackItem, setLastSelectedWord])

  const { searchMode, searchInContent, highlightInList, filters, maybeColorMode } = useSettings()
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

  const { km_map, en, ru } = useDictionary()

  const divClassName = useMemo(
    () =>
      `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[25rem] lg:w-[28rem] max-md:max-w-full md:max-w-[40vw] pt-[env(safe-area-inset-top)] ${
        currentNavigationStackItem ? 'hidden md:flex' : 'w-full'
      }`,
    [currentNavigationStackItem],
  )
  const toast = useAppToast()

  const onTryToOpenWord = useCallback(
    (word: NonEmptyStringTrimmed) => {
      const wordLanguage = detectModeFromText(word)

      if (!wordLanguage) {
        toast.error(
          'Cannot open word' as NonEmptyStringTrimmed,
          'Cannot detect language of word' as NonEmptyStringTrimmed,
        )

        return
      }
      switch (wordLanguage) {
        case 'km': {
          if (km_map.has(word as TypedContainsKhmer)) {
            setLastSelectedWord({ word, mode: 'km' })
          } else {
            toast.error(
              'Cannot open word' as NonEmptyStringTrimmed,
              'Cannot find word in khmer dictionary' as NonEmptyStringTrimmed,
            )
          }
          break
        }
        case 'en': {
          if (en.has(word as TypedContainsKhmer)) {
            setLastSelectedWord({ word, mode: 'en' })
          } else {
            toast.error(
              'Cannot open word' as NonEmptyStringTrimmed,
              'Cannot find word in english dictionary' as NonEmptyStringTrimmed,
            )
          }
          break
        }
        case 'ru': {
          if (ru.has(word as TypedContainsKhmer)) {
            setLastSelectedWord({ word, mode: 'ru' })
          } else {
            toast.error(
              'Cannot open word' as NonEmptyStringTrimmed,
              'Cannot find word in russian dictionary' as NonEmptyStringTrimmed,
            )
          }
          break
        }
        default: {
          assertNever(wordLanguage)
        }
      }
    },
    [setLastSelectedWord],
  )

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      <div className={`${divClassName} text-base`}>
        <SidebarHeader
          activeTab={activeTab}
          resultCount={resultCount}
          searchInitialValue={undefined}
          searchMode={searchMode}
          showSearchBar={!isAppTabNonLanguage(activeTab)}
          onEnter={onTryToOpenWord}
          onSearch={onSearch}
        />

        <div className="flex-1 flex overflow-hidden relative bg-content1">
          <SidebarContent
            activeTab={activeTab}
            contentMatches={contentMatches}
            highlightInList={highlightInList}
            isSearching={isSearching}
            loading={dictData === undefined}
            maybeColorMode="segmenter"
            resultData={resultData}
            searchMode={searchMode}
            searchQuery={safeSearchQuery}
          />
        </div>
      </div>

      {(() => {
        switch (currentView.type) {
          case 'about':
            return (
              <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none scaling-details h-[100dvh]">
                <AboutView />
              </div>
            )
          case 'khmer-analyzer':
            return (
              <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none scaling-details h-[100dvh]">
                <KhmerAnalyzerView initialText={currentView.text} />
              </div>
            )
          case 'history':
          case 'favorites':
          case 'dashboard':
          case 'history-list':
          case 'favorites-list':
          case 'settings':
            return (
              <div className="flex-1 overflow-hidden scaling-details h-[100dvh]">
                <RightPanel
                  lastSelectedWord={lastSelectedWord}
                  maybeColorMode={maybeColorMode}
                  searchQuery={searchQuery}
                  selectedWord={currentNavigationStackItem}
                />
              </div>
            )
          default:
            return null
        }
      })()}
    </div>
  )
}
