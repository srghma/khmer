import React, { useMemo, useState, useCallback } from 'react'
import type { ProcessDataOutputKhmer } from '../utils/toGroupKhmer'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { VirtualizedList } from './VirtualizedList'
import { L12SidebarKhmer } from './L12SidebarKhmer'
import { makeShortInfoAboutLengths } from '../utils/toGroupKhmer_lengths'
import {
  processDataOutputKhmerCursor_mkDefaultFor_orUndefined,
  type ProcessDataOutputKhmerCursor_OnlyFirstLevel,
} from '../utils/toGroupKhmer_cursor_onlyFirstLevel'
import type { ProcessDataOutputKhmerCursor_FirstAndSecondLevel } from '../utils/toGroupKhmer_cursor_full'
import { useWordListCommon } from '../hooks/useWordListCommon'
import { flattenKhmerData } from '../utils/flattenKhmerData'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { type FlatListItem } from './VirtualizedList'
import { useSettings, type SearchMode } from '../providers/SettingsProvider'

interface WordListKhmerProps {
  readonly data: ProcessDataOutputKhmer
  readonly onWordClick: (word: NonEmptyStringTrimmed) => void
  readonly searchQuery: NonEmptyStringTrimmed | undefined
  readonly highlightMatch: boolean
  readonly contentMatches: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  readonly searchMode: SearchMode
}

export const WordListKhmerImpl: React.FC<WordListKhmerProps> = ({
  data,
  onWordClick,
  searchQuery,
  highlightMatch,
  contentMatches,
  searchMode,
}: WordListKhmerProps) => {
  const { LL } = useI18nContext()
  // Memoize lengths for sidebar (kept here as it's specific to Sidebar UI prop)
  const lengthsData = useMemo(() => makeShortInfoAboutLengths(data), [data])

  // Initialize cursor
  const [activeL1, setActiveL1] = useState<ProcessDataOutputKhmerCursor_OnlyFirstLevel | undefined>(() =>
    processDataOutputKhmerCursor_mkDefaultFor_orUndefined(data),
  )

  // 1. Flatten Data
  const { flatList, stickyIndexes, l1IndexMap, l2IndexMap, indexToL1Cursor, exactMatchIndex } = useMemo(
    () => flattenKhmerData(data, searchQuery, contentMatches),
    [data, contentMatches, searchQuery],
  )

  // 2. Common List Logic
  const { listRef, renderWordItem, scrollToIndex } = useWordListCommon({
    exactMatchIndex,
    searchQuery,
    highlightMatch,
    searchMode,
  })

  // 3. Header Spy Logic
  const onActiveHeaderChange = useCallback(
    (idx: number) => {
      const cursor = indexToL1Cursor.get(idx)

      if (cursor) {
        setActiveL1(cursor)
      }
    },
    [indexToL1Cursor],
  )

  // 4. Sidebar Handlers
  const handleScrollToLetter = useCallback(
    (cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel) => {
      scrollToIndex(l1IndexMap.get(JSON.stringify(cursor)), 'start')
    },
    [l1IndexMap, scrollToIndex],
  )

  const handleScrollToSubGroup = useCallback(
    (cursor: ProcessDataOutputKhmerCursor_FirstAndSecondLevel) => {
      scrollToIndex(l2IndexMap.get(JSON.stringify(cursor)), 'start')
    },
    [l2IndexMap, scrollToIndex],
  )

  const renderItem = useCallback(
    (item: FlatListItem) => {
      const onClick = () => (item.type === 'header' ? undefined : onWordClick(item.word))

      if (item.type === 'header') {
        return (
          <div
            className={`h-full border-b border-divider flex items-center px-6 py-1 font-bold shadow-sm backdrop-blur-md font-khmer ${item.bgClass} text-xl`}
          >
            {item.label}
          </div>
        )
      }

      return (
        <button
          className={`h-full flex items-center px-6 border-b py-1 border-divider hover:brightness-95 dark:hover:brightness-110 w-full text-left transition-all ${item.bgClass}`}
          onClick={onClick}
        >
          <span className={`text-foreground-900 leading-snug text-base font-khmer`}>{renderWordItem(item.word)}</span>
        </button>
      )
    },
    [onWordClick, renderWordItem],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(
    (idx: number) => {
      const isHeader = flatList[idx]?.type === 'header'
      const baseHeight = isHeader ? 48 : 32

      return (baseHeight * scaling_ui) / 14
    },
    [flatList, scaling_ui],
  )
  const keyExtractor = useCallback(
    (item: FlatListItem) => (item.type === 'header' ? `header-${item.label}` : `word-${item.word}`),
    [],
  )

  return (
    <div className="flex h-full w-full relative">
      {activeL1 ? (
        <L12SidebarKhmer
          activeL1={activeL1}
          data={lengthsData}
          scrollToLetter={handleScrollToLetter}
          scrollToSubGroup={handleScrollToSubGroup}
        />
      ) : (
        <p>{LL.COMMON.NOTHING()}</p>
      )}
      <VirtualizedList
        ref={listRef}
        estimateSize={estimateSize}
        items={flatList}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        stickyIndexes={stickyIndexes}
        onActiveHeaderChange={onActiveHeaderChange}
      />
    </div>
  )
}

export const WordListKhmer = React.memo(WordListKhmerImpl)
