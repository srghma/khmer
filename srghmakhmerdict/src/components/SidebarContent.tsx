import { memo } from 'react'
import { Spinner } from '@heroui/spinner'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { type AppTab, type DictionaryLanguage } from '../types'
import { WordListGeneral } from './WordListGeneral'
import { WordListKhmer } from './WordListKhmer'
import { HistoryList } from './HistoryList'
import { SettingsView } from './SettingsView'
import type { ProcessedDataState } from '../hooks/useDictionarySearch'

// Define exact props to ensure memoization works
interface SidebarContentProps {
  loading: boolean
  activeTab: AppTab
  isSearching: boolean
  resultData: ProcessedDataState | undefined
  contentMatches: NonEmptyStringTrimmed[]
  highlightInList: boolean
  searchQuery?: NonEmptyStringTrimmed // The safe, debounced query
  refreshHistoryTrigger: number

  // Handlers
  onWordClickKm: (w: NonEmptyStringTrimmed) => void
  onWordClickEn: (w: NonEmptyStringTrimmed) => void
  onWordClickRu: (w: NonEmptyStringTrimmed) => void
  onHistorySelect: (w: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const SidebarContent = memo<SidebarContentProps>(props => {
  const { activeTab, loading, isSearching, resultData } = props

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-content1/80 z-20 gap-4 backdrop-blur-sm">
        <Spinner color="primary" size="lg" />
        <div className="text-default-400 text-xs tracking-wider font-medium uppercase">Loading Dictionary...</div>
      </div>
    )
  }

  if (activeTab === 'settings') {
    return <SettingsView />
  }

  if (activeTab === 'history' || activeTab === 'favorites') {
    return (
      <HistoryList refreshTrigger={props.refreshHistoryTrigger} type={activeTab} onSelect={props.onHistorySelect} />
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
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-default-400 gap-2">
      <span className="text-4xl opacity-20">📚</span>
      <p>Dictionary not loaded or empty</p>
    </div>
  )
})

SidebarContent.displayName = 'SidebarContent'
