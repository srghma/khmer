import React, { useMemo, useState, useRef, useCallback } from 'react'
import type { ProcessDataOutput } from '../utils/toGroup'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { VirtualizedList, type FlatListItem, type VirtualizedListHandle } from './VirtualizedList'
import { L12SidebarGeneral } from './L12SidebarGeneral'
import { GROUP_COLORS } from '../hooks/useColorRotator'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { Char_mkOrThrow, type Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import {
  isCharUppercaseCyrillic,
  type CharUppercaseCyrillic,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import {
  isCharUppercaseLatin,
  type CharUppercaseLatin,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import { renderWordMatch } from './WordList.utils'

type GeneralChar = CharUppercaseLatin | CharUppercaseCyrillic

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
  readonly searchQuery?: NonEmptyStringTrimmed
  readonly highlightMatch?: boolean
  readonly contentMatches?: NonEmptyStringTrimmed[]
}

const WordListGeneralImpl: React.FC<WordListGeneralProps> = ({
  data,
  onWordClick,
  searchQuery,
  highlightMatch,
  contentMatches,
}) => {
  const listRef = useRef<VirtualizedListHandle>(null)
  const [activeL1, setActiveL1] = useState<GeneralChar | '*'>(assertIsDefinedAndReturn(data.groups[0]?.letter ?? '*'))

  const { flatList, stickyIndexes, l1Map } = useMemo(
    () =>
      (() => {
        const flat: FlatListItem[] = []
        const stickies: number[] = []
        const mapping = new Map<GeneralChar | '*', number>()
        let colorIdx = 0

        data.groups.forEach(g => {
          const start = flat.length

          mapping.set(g.letter, start)
          stickies.push(start)

          flat.push({
            type: 'header',
            label: g.letter,
            bgClass: assertIsDefinedAndReturn(GROUP_COLORS[colorIdx % GROUP_COLORS.length]),
            index: start,
          })

          g.subGroups.forEach(sg => {
            const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

            sg.words.forEach(w => flat.push({ type: 'word', word: w, bgClass: bg }))
          })
        })

        if (data.other.length > 0) {
          const start = flat.length
          const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

          mapping.set('*', start)
          stickies.push(start)
          flat.push({ type: 'header', label: '*', bgClass: bg, index: start })
          data.other.forEach(w => flat.push({ type: 'word', word: w, bgClass: bg }))
        }

        if (contentMatches && contentMatches.length > 0) {
          const start = flat.length
          const bg = 'bg-secondary-50 dark:bg-secondary-900/30'

          stickies.push(start)
          flat.push({ type: 'header', label: 'Found in content', bgClass: bg, index: start })
          contentMatches.forEach(w => flat.push({ type: 'word', word: w, bgClass: bg }))
        }

        return { flatList: flat, stickyIndexes: stickies, l1Map: mapping }
      })(),
    [data, contentMatches],
  )

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
          // Ignore
        }
      }
    },
    [flatList],
  )

  const scrollToSubGroup = (l2Key: string) => {
    const group = data.groups.find(g => g.letter === activeL1)
    const sub = group?.subGroups.find(sg => sg.letter === l2Key)

    if (!sub) return
    const idx = flatList.findIndex(f => f.type === 'word' && f.word === sub.words[0])

    if (idx !== -1) listRef.current?.scrollToIndex(idx)
  }

  // Memoize this function so VirtualizedList doesn't re-render on every parent render
  const renderWordItem = useCallback(
    (w: NonEmptyStringTrimmed) => renderWordMatch(w, searchQuery, highlightMatch),
    [searchQuery, highlightMatch],
  )

  return (
    <div className="flex h-full w-full relative">
      <L12SidebarGeneral
        activeL1={activeL1}
        data={data}
        scrollToLetter={key => {
          const idx = l1Map.get(key as GeneralChar | '*')

          if (idx !== undefined) listRef.current?.scrollToIndex(idx)
        }}
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
