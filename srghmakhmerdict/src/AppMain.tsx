import { useMemo, useCallback, useState, useEffect } from 'react'
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
import { AboutView } from './components/About/AboutView'
import { KhmerAnalyzerView } from './components/KhmerAnalyzerView'
import { useAddToHistoryEffect } from './hooks/useAddToHistoryEffect'
import { useAppMainView, useAppActiveTab } from './hooks/useAppMainView'
import { useAppToast } from './providers/ToastProvider'
import { DictData_isWordInEitherOf3Dictionaries_caseInsensitive } from './initDictionary'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useLocation } from 'wouter'

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

  const { searchMode, searchInContent, highlightInList, filters, maybeColorMode } = useSettings()
  const activeTab = useAppActiveTab()
  const [, setLocation] = useLocation()

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

  const leftClassName = useMemo(
    () =>
      `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[25rem] lg:w-[28rem] max-md:max-w-full md:max-w-[40vw] pt-[env(safe-area-inset-top)] text-base ${currentNavigationStackItem ? 'hidden md:flex' : 'w-full'
      }`,
    [currentNavigationStackItem],
  )
  const toast = useAppToast()

  const onTryToOpenWord = useCallback(
    (word: NonEmptyStringTrimmed) => {
      const value = DictData_isWordInEitherOf3Dictionaries_caseInsensitive(dictData, word)

      if (!value) {
        toast.error(
          'Cannot open word' as NonEmptyStringTrimmed,
          'Cannot find word in any dictionary' as NonEmptyStringTrimmed,
        )

        return
      }
      setLocation(`~/${value[1]}/${value[0]}`)
    },
    [setLocation],
  )

  const detailViewOrNull = useMemo(() => {
    switch (currentView.type) {
      case 'about':
      case 'khmer-analyzer':
        return currentView
      case 'history':
      case 'favorites':
      case 'dashboard':
        return currentView.word ? currentView : null
      default:
        return null
    }
  }, [currentView])

  const [lastDetailView, setLastDetailView] = useState<typeof currentView | null>(null)

  useEffect(() => {
    if (detailViewOrNull) {
      setLastDetailView(detailViewOrNull)
    }
  }, [detailViewOrNull])

  const viewToRender = detailViewOrNull || lastDetailView || currentView

  return (
    <div className="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
      <div className={leftClassName}>
        <SidebarHeader
          activeTab={activeTab}
          resultCount={resultCount}
          searchInitialValue={searchQuery}
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

      <div className="flex-1 overflow-hidden scaling-details h-[100dvh] bg-background">
        {(() => {
          const detailClass = `fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none`
          const isMobileDetailActive = detailViewOrNull !== null
          const mobileVisibilityClass = !isMobileDetailActive ? 'hidden md:flex' : 'flex'

          switch (viewToRender.type) {
            case 'about':
              return (
                <div className={`${detailClass} ${mobileVisibilityClass}`}>
                  <AboutView />
                </div>
              )
            case 'khmer-analyzer':
              return (
                <div className={`${detailClass} ${mobileVisibilityClass}`}>
                  <KhmerAnalyzerView initialText={viewToRender.text} />
                </div>
              )
            case 'history':
            case 'favorites':
            case 'dashboard':
            case 'history-list':
            case 'favorites-list':
            case 'settings': {
              const viewWordItem =
                (viewToRender.type === 'history' ||
                  viewToRender.type === 'favorites' ||
                  viewToRender.type === 'dashboard') &&
                  viewToRender.word
                  ? { word: viewToRender.word, mode: viewToRender.mode }
                  : undefined

              return (
                <div className={`${detailClass} ${mobileVisibilityClass}`}>
                  <RightPanel
                    lastSelectedWord={viewWordItem}
                    maybeColorMode={maybeColorMode}
                    searchQuery={searchQuery}
                    selectedWord={viewWordItem}
                  />
                </div>
              )
            }
            default:
              assertNever(viewToRender)
          }
        })()}
      </div>
    </div>
  )
}
