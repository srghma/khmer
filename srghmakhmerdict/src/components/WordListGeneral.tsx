import React, { useState, useCallback, useMemo } from 'react'
import type { ProcessDataOutput } from '../utils/toGroup'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { VirtualizedList } from './VirtualizedList'
import { L12SidebarGeneral } from './L12SidebarGeneral'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { Char_mkOrThrow, type Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import { isCharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import { isCharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import { useWordListCommon } from '../hooks/useWordListCommon'
import { flattenGeneralData, type GeneralChar } from '../utils/flattenGeneralData'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { SearchMode } from '../providers/SettingsProvider'

type L12SidebarGeneral_activeL1 = GeneralChar | '*'

export const isL12SidebarGeneral_activeL1 = (value: Char | '*'): value is L12SidebarGeneral_activeL1 =>
  isCharUppercaseLatin(value as Char) || isCharUppercaseCyrillic(value as Char) || value === '*'

export const stringToL12SidebarGeneral_activeL1OrThrow = (value: Char | '*'): L12SidebarGeneral_activeL1 => {
  if (isL12SidebarGeneral_activeL1(value)) return value

  throw new Error(`'${value}' is not a valid L12SidebarGeneral_activeL1`)
}

interface WordListGeneralProps {
  readonly data: ProcessDataOutput<GeneralChar>
  readonly onWordClick: (word: NonEmptyStringTrimmed) => void
  readonly searchQuery: NonEmptyStringTrimmed | undefined
  readonly highlightMatch: boolean
  readonly contentMatches: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  readonly searchMode: SearchMode
}

const WordListGeneralImpl: React.FC<WordListGeneralProps> = ({
  data,
  onWordClick,
  searchQuery,
  highlightMatch,
  contentMatches,
  searchMode,
}) => {
  const [activeL1, setActiveL1] = useState<GeneralChar | '*'>(assertIsDefinedAndReturn(data.groups[0]?.letter ?? '*'))

  // 1. Flatten Data
  const { flatList, stickyIndexes, l1Map, exactMatchIndex } = useMemo(
    () => flattenGeneralData(data, searchQuery, contentMatches),
    [data, contentMatches, searchQuery],
  )

  // 2. Common List Logic (Refs, Scrolling, Rendering)
  const { listRef, renderWordItem, scrollToIndex } = useWordListCommon({
    exactMatchIndex,
    searchQuery,
    highlightMatch,
    searchMode,
  })

  // 3. Header Spy Logic
  const onActiveHeaderChange = useCallback(
    (idx: number) => {
      const item = flatList[idx]

      if (item?.type === 'header') {
        try {
          if (item.label === 'Found in content') return
          if (item.label === '*') {
            setActiveL1('*')

            return
          }
          const char = Char_mkOrThrow(item.label)

          if (isL12SidebarGeneral_activeL1(char)) {
            setActiveL1(char)
          }
        } catch {
          /* Ignore */
        }
      }
    },
    [flatList],
  )

  // 4. Sidebar Handler
  const scrollToSubGroup = (l2Key: string) => {
    const group = data.groups.find(g => g.letter === activeL1)
    const sub = group?.subGroups.find(sg => sg.letter === l2Key)

    if (!sub) return
    const idx = flatList.findIndex(f => f.type === 'word' && f.word === sub.words[0])

    scrollToIndex(idx)
  }

  return (
    <div className="flex h-full w-full relative">
      <L12SidebarGeneral
        activeL1={activeL1}
        data={data}
        scrollToLetter={key => scrollToIndex(l1Map.get(key as GeneralChar | '*'))}
        scrollToSubGroup={scrollToSubGroup}
      />
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

export const WordListGeneral = React.memo(WordListGeneralImpl)
