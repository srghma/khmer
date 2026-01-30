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
import { useFlattenKhmer } from '../hooks/useFlattenKhmer'

interface WordListKhmerProps {
  readonly data: ProcessDataOutputKhmer
  readonly onWordClick: (word: NonEmptyStringTrimmed) => void
  readonly searchQuery?: NonEmptyStringTrimmed
  readonly highlightMatch?: boolean
  readonly contentMatches?: NonEmptyStringTrimmed[]
}

export const WordListKhmerImpl: React.FC<WordListKhmerProps> = ({
  data,
  onWordClick,
  searchQuery,
  highlightMatch,
  contentMatches,
}: WordListKhmerProps) => {
  // Memoize lengths for sidebar (kept here as it's specific to Sidebar UI prop)
  const lengthsData = useMemo(() => makeShortInfoAboutLengths(data), [data])

  // Initialize cursor
  const [activeL1, setActiveL1] = useState<ProcessDataOutputKhmerCursor_OnlyFirstLevel | undefined>(() =>
    processDataOutputKhmerCursor_mkDefaultFor_orUndefined(data),
  )

  // 1. Flatten Data
  const { flatList, stickyIndexes, l1IndexMap, l2IndexMap, indexToL1Cursor, exactMatchIndex } = useFlattenKhmer(
    data,
    searchQuery,
    contentMatches,
  )

  // 2. Common List Logic
  const { listRef, renderWordItem, scrollToIndex } = useWordListCommon({
    exactMatchIndex,
    searchQuery,
    highlightMatch,
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
        <p>Nothing</p>
      )}
      <VirtualizedList
        ref={listRef}
        items={flatList}
        renderWord={renderWordItem}
        stickyIndexes={stickyIndexes}
        onActiveHeaderChange={onActiveHeaderChange}
        onWordClick={onWordClick}
      />
    </div>
  )
}

export const WordListKhmer = React.memo(WordListKhmerImpl)
