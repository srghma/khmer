import { memo, Suspense, useCallback } from 'react'
import { Spinner } from '@heroui/spinner'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { type AppTab } from '../types'
import type { ProcessedDataState } from '../hooks/useDictionarySearch'
import { WordListGeneral } from './WordListGeneral'
import { usePreloadOnIdle } from '../utils/lazyWithPreload'
import lazyWithPreload from 'react-lazy-with-preload'
import type { KhmerWordsMap } from '../db/dict'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { HistoryListOnly } from './HistoryOrFavouritesList/HistoryListOnly'
import { FavouritesListOnly } from './HistoryOrFavouritesList/FavouritesListOnly'
import { useNavigation } from '../providers/NavigationProvider'

// --- LAZY IMPORTS ---
const WordListKhmer = lazyWithPreload(() => import('./WordListKhmer').then(m => ({ default: m.WordListKhmer })))
const SettingsView = lazyWithPreload(() => import('./SettingsView').then(m => ({ default: m.SettingsView })))

// --- FALLBACK COMPONENT ---
const ContentFallback = (
  <div className="flex-1 flex items-center justify-center">
    <Spinner color="default" size="sm" />
  </div>
)

interface SidebarContentProps {
  loading: boolean
  activeTab: AppTab
  isSearching: boolean
  resultData: ProcessedDataState | undefined
  contentMatches: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  highlightInList: boolean
  searchQuery: NonEmptyStringTrimmed | undefined
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const SidebarContent = memo<SidebarContentProps>(props => {
  const { activeTab, loading, isSearching, resultData, km_map, maybeColorMode } = props

  const { resetNavigationAndSetCurrentTo } = useNavigation()

  const handleWordClickKm = useCallback(
    (w: NonEmptyStringTrimmed) => resetNavigationAndSetCurrentTo(w, 'km'),
    [resetNavigationAndSetCurrentTo],
  )
  const handleWordClickEn = useCallback(
    (w: NonEmptyStringTrimmed) => resetNavigationAndSetCurrentTo(w, 'en'),
    [resetNavigationAndSetCurrentTo],
  )
  const handleWordClickRu = useCallback(
    (w: NonEmptyStringTrimmed) => resetNavigationAndSetCurrentTo(w, 'ru'),
    [resetNavigationAndSetCurrentTo],
  )

  usePreloadOnIdle([WordListKhmer, SettingsView])

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-content1/80 z-20 gap-4 backdrop-blur-sm">
        <Spinner color="primary" size="lg" />
        <div className="text-default-400 text-xs tracking-wider font-medium uppercase">Loading Dictionary...</div>
      </div>
    )
  }

  if (activeTab === 'settings') {
    return (
      <Suspense fallback={ContentFallback}>
        <SettingsView />
      </Suspense>
    )
  }

  if (activeTab === 'history') {
    return (
      <Suspense fallback={ContentFallback}>
        <HistoryListOnly km_map={km_map} maybeColorMode={maybeColorMode} onSelect={resetNavigationAndSetCurrentTo} />
      </Suspense>
    )
  }

  if (activeTab === 'favorites') {
    return (
      <Suspense fallback={ContentFallback}>
        <FavouritesListOnly km_map={km_map} maybeColorMode={maybeColorMode} onSelect={resetNavigationAndSetCurrentTo} />
      </Suspense>
    )
  }

  if (isSearching) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-default-400 gap-3">
        <Spinner color="warning" size="md" />
        <span className="text-xs tracking-wider opacity-70">Filtering...</span>
      </div>
    )
  }

  if (resultData) {
    return (
      <Suspense fallback={ContentFallback}>
        {(() => {
          switch (resultData.mode) {
            case 'km':
              return (
                <WordListKhmer
                  contentMatches={props.contentMatches}
                  data={resultData.data}
                  highlightMatch={props.highlightInList}
                  searchQuery={props.searchQuery}
                  onWordClick={handleWordClickKm}
                />
              )
            case 'en':
              return (
                <WordListGeneral
                  contentMatches={props.contentMatches}
                  data={resultData.data}
                  highlightMatch={props.highlightInList}
                  searchQuery={props.searchQuery}
                  onWordClick={handleWordClickEn}
                />
              )
            case 'ru':
              return (
                <WordListGeneral
                  contentMatches={props.contentMatches}
                  data={resultData.data}
                  highlightMatch={props.highlightInList}
                  searchQuery={props.searchQuery}
                  onWordClick={handleWordClickRu}
                />
              )
            default:
              assertNever(resultData)
          }
        })()}
      </Suspense>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-default-400 gap-2">
      <span className="text-4xl opacity-20">📚</span>
      <p>Dictionary not loaded or empty</p>
    </div>
  )
})

SidebarContent.displayName = 'SidebarContent'
