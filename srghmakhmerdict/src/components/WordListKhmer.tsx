import React, { useMemo, useState, useRef, useCallback } from 'react'
import type { ProcessDataOutputKhmer, AlphabetGroupKhmer } from '../utils/toGroupKhmer'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { VirtualizedList, type FlatListItem, type VirtualizedListHandle } from './VirtualizedList'
import { L12SidebarKhmer } from './L12SidebarKhmer'
import { GROUP_COLORS } from '../hooks/useColorRotator'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { renderWordMatch } from './WordList.utils'
import { makeShortInfoAboutLengths } from '../utils/toGroupKhmer_lengths'
import {
  processDataOutputKhmerCursor_mkDefaultFor_orThrow,
  type ProcessDataOutputKhmerCursor_OnlyFirstLevel,
} from '../utils/toGroupKhmer_cursor_onlyFirstLevel'
import type {
  ProcessDataOutputKhmerCursor_FirstAndSecondLevel,
  ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel,
} from '../utils/toGroupKhmer_cursor_full'

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
  const listRef = useRef<VirtualizedListHandle>(null)

  // Memoize lengths for sidebar
  const lengthsData = useMemo(() => makeShortInfoAboutLengths(data), [data])

  // Initialize cursor
  const [activeL1, setActiveL1] = useState<ProcessDataOutputKhmerCursor_OnlyFirstLevel>(() =>
    processDataOutputKhmerCursor_mkDefaultFor_orThrow(data),
  )

  const { flatList, stickyIndexes, l1IndexMap, l2IndexMap, indexToL1Cursor } = useMemo(
    () =>
      (() => {
        const flat: FlatListItem[] = []
        const stickies: number[] = []
        const l1Map = new Map<string, number>()
        const l2Map = new Map<string, number>()
        const idxToL1 = new Map<number, ProcessDataOutputKhmerCursor_OnlyFirstLevel>()

        let colorIdx = 0

        const addHeader = (label: string, cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel, bgClass: string) => {
          const idx = flat.length

          flat.push({ type: 'header', label: label as any, bgClass, index: idx })
          stickies.push(idx)
          l1Map.set(JSON.stringify(cursor), idx)
          idxToL1.set(idx, cursor)
        }

        const addWords = (words: readonly NonEmptyStringTrimmed[], bgClass: string) => {
          words.forEach(w => flat.push({ type: 'word', word: w, bgClass }))
        }

        const processMap = (
          map: Map<any, AlphabetGroupKhmer>,
          type: 'words_consonant' | 'words_vowel' | 'words_independent_vowel' | 'words_diacritic',
        ) => {
          for (const [char, group] of map) {
            const cursorL1: ProcessDataOutputKhmerCursor_OnlyFirstLevel = { t: type, firstChar: char }
            const headerBg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx % GROUP_COLORS.length])

            addHeader(char, cursorL1, headerBg)

            // 1. Words with no second char (∅)
            if (group.subGroups_noSecondChar) {
              const cursorL2: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = {
                ...cursorL1,
                secondChar: { t: 'noSecondChar' },
              } as any

              // Map the start of this block
              l2Map.set(JSON.stringify(cursorL2), flat.length)
              addWords(group.subGroups_noSecondChar, headerBg)
            }

            // 2. Subgroups
            const processSub = (
              subMap: Map<any, any>,
              subType: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel['t'],
            ) => {
              for (const [subChar, words] of subMap) {
                const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

                const cursorSub: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel = { t: subType, v: subChar } as any
                const cursorL2: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = {
                  ...cursorL1,
                  secondChar: cursorSub,
                } as any

                l2Map.set(JSON.stringify(cursorL2), flat.length)
                addWords(words, bg)
              }
            }

            processSub(group.subGroups_consonant, 'consonant')
            processSub(group.subGroups_independent_vowel, 'independent_vowel')
            processSub(group.subGroups_vowel, 'vowel')
            processSub(group.subGroups_diacritic, 'diacritic')
            processSub(group.subGroups_extraConsonant, 'extraConsonant')
            processSub(group.subGroups_vowelCombination, 'vowelCombination')
          }
        }

        processMap(data.words_consonant, 'words_consonant')
        processMap(data.words_independent_vowel, 'words_independent_vowel')
        processMap(data.words_vowel, 'words_vowel')
        processMap(data.words_diacritic, 'words_diacritic')

        const addSpecial = (
          label: string,
          words: readonly NonEmptyStringTrimmed[] | undefined,
          cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel,
          bg: string,
        ) => {
          if (!words) return
          addHeader(label, cursor, bg)
          addWords(words, bg)
        }

        addSpecial('NUM', data.numbers, { t: 'numbers' }, 'bg-blue-50 dark:bg-blue-950/30')
        addSpecial('PUN', data.punctuation, { t: 'punctuation' }, 'bg-orange-50 dark:bg-orange-950/30')
        addSpecial('LUN', data.lunarDates, { t: 'lunarDates' }, 'bg-purple-50 dark:bg-purple-950/30')
        addSpecial('OTH', data.others_known, { t: 'others_known' }, 'bg-slate-50 dark:bg-slate-950/30')

        if (contentMatches && contentMatches.length > 0) {
          const idx = flat.length
          const bg = 'bg-secondary-50 dark:bg-secondary-900/30'

          flat.push({ type: 'header', label: 'Found in content' as any, bgClass: bg, index: idx })
          stickies.push(idx)
          addWords(contentMatches, bg)
        }

        return {
          flatList: flat,
          stickyIndexes: stickies,
          l1IndexMap: l1Map,
          l2IndexMap: l2Map,
          indexToL1Cursor: idxToL1,
        }
      })(),
    [data, contentMatches],
  )

  const onActiveHeaderChange = useCallback(
    (idx: number) => {
      const cursor = indexToL1Cursor.get(idx)

      if (cursor) {
        setActiveL1(cursor)
      }
    },
    [indexToL1Cursor],
  )

  const handleScrollToLetter = useCallback(
    (cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel) => {
      const idx = l1IndexMap.get(JSON.stringify(cursor))

      if (idx !== undefined) {
        listRef.current?.scrollToIndex(idx, 'start')
      }
    },
    [l1IndexMap],
  )

  const handleScrollToSubGroup = useCallback(
    (cursor: ProcessDataOutputKhmerCursor_FirstAndSecondLevel) => {
      const idx = l2IndexMap.get(JSON.stringify(cursor))

      if (idx !== undefined) {
        listRef.current?.scrollToIndex(idx, 'start')
      }
    },
    [l2IndexMap],
  )

  // Memoize this function so VirtualizedList doesn't re-render on every parent render
  const renderWordItem = useCallback(
    (w: NonEmptyStringTrimmed) => renderWordMatch(w, searchQuery, highlightMatch),
    [searchQuery, highlightMatch],
  )

  return (
    <div className="flex h-full w-full relative">
      <L12SidebarKhmer
        activeL1={activeL1}
        data={lengthsData}
        scrollToLetter={handleScrollToLetter}
        scrollToSubGroup={handleScrollToSubGroup}
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

export const WordListKhmer = React.memo(WordListKhmerImpl)
