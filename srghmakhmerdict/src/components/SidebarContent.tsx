import { memo, Suspense } from 'react'
import { Spinner } from '@heroui/react'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { type AppTab, type DictionaryLanguage } from '../types'
import type { ProcessedDataState } from '../hooks/useDictionarySearch'
import { WordListGeneral } from './WordListGeneral'
import { usePreloadOnIdle } from '../utils/lazyWithPreload'
import lazyWithPreload from 'react-lazy-with-preload'
import type { KhmerWordsMap } from '../db/dict'
import type { ColorizationMode } from '../utils/text-processing/utils'

// --- LAZY IMPORTS ---
const WordListKhmer = lazyWithPreload(() => import('./WordListKhmer').then(m => ({ default: m.WordListKhmer })))
const HistoryOrFavouritesList = lazyWithPreload(() =>
  import('./HistoryList').then(m => ({ default: m.HistoryOrFavouritesList })),
)
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
  contentMatches: NonEmptyStringTrimmed[]
  highlightInList: boolean
  searchQuery: NonEmptyStringTrimmed | undefined
  refreshHistoryTrigger: number
  km_map: KhmerWordsMap | undefined
  colorMode: ColorizationMode

  onWordClickKm: (w: NonEmptyStringTrimmed) => void
  onWordClickEn: (w: NonEmptyStringTrimmed) => void
  onWordClickRu: (w: NonEmptyStringTrimmed) => void
  onHistorySelect: (w: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const SidebarContent = memo<SidebarContentProps>(props => {
  const { activeTab, loading, isSearching, resultData, km_map, colorMode } = props

  usePreloadOnIdle([WordListKhmer, HistoryOrFavouritesList, SettingsView])

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

  if (activeTab === 'history' || activeTab === 'favorites') {
    return (
      <Suspense fallback={ContentFallback}>
        <HistoryOrFavouritesList
          colorMode={colorMode}
          km_map={km_map}
          refreshTrigger={props.refreshHistoryTrigger}
          type={activeTab}
          onSelect={props.onHistorySelect}
        />
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
                  onWordClick={props.onWordClickKm}
                />
              )
            case 'en':
              return (
                <WordListGeneral
                  contentMatches={props.contentMatches}
                  data={resultData.data}
                  highlightMatch={props.highlightInList}
                  searchQuery={props.searchQuery}
                  onWordClick={props.onWordClickEn}
                />
              )
            case 'ru':
              return (
                <WordListGeneral
                  contentMatches={props.contentMatches}
                  data={resultData.data}
                  highlightMatch={props.highlightInList}
                  searchQuery={props.searchQuery}
                  onWordClick={props.onWordClickRu}
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
