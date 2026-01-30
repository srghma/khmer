import { useMemo } from 'react'
import type { ProcessDataOutput } from '../utils/toGroup'
import type { FlatListItem } from '../components/VirtualizedList'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { GROUP_COLORS } from './useColorRotator'

export type GeneralChar = CharUppercaseLatin | CharUppercaseCyrillic

export function useFlattenGeneral(
  data: ProcessDataOutput<GeneralChar>,
  searchQuery?: NonEmptyStringTrimmed,
  contentMatches?: NonEmptyStringTrimmed[],
) {
  return useMemo(() => {
    const flatList: FlatListItem[] = []
    const stickyIndexes: number[] = []
    const l1Map = new Map<GeneralChar | '*', number>()
    let colorIdx = 0
    let exactMatchIndex = -1

    // Helper to check for exact match while adding
    const checkMatch = (w: string, idx: number) => {
      if (exactMatchIndex === -1 && searchQuery && w === searchQuery) {
        exactMatchIndex = idx
      }
    }

    // 1. Main Groups
    data.groups.forEach(g => {
      const start = flatList.length

      l1Map.set(g.letter, start)
      stickyIndexes.push(start)

      flatList.push({
        type: 'header',
        label: g.letter,
        bgClass: assertIsDefinedAndReturn(GROUP_COLORS[colorIdx % GROUP_COLORS.length]),
        index: start,
      })

      g.subGroups.forEach(sg => {
        const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

        sg.words.forEach(w => {
          checkMatch(w, flatList.length)
          flatList.push({ type: 'word', word: w, bgClass: bg })
        })
      })
    })

    // 2. Other/Symbols
    if (data.other.length > 0) {
      const start = flatList.length
      const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

      l1Map.set('*', start)
      stickyIndexes.push(start)
      flatList.push({ type: 'header', label: '*', bgClass: bg, index: start })

      data.other.forEach(w => {
        checkMatch(w, flatList.length)
        flatList.push({ type: 'word', word: w, bgClass: bg })
      })
    }

    // 3. Content Matches
    if (contentMatches && contentMatches.length > 0) {
      const start = flatList.length
      const bg = 'bg-secondary-50 dark:bg-secondary-900/30'

      stickyIndexes.push(start)
      flatList.push({ type: 'header', label: 'Found in content', bgClass: bg, index: start })
      contentMatches.forEach(w => flatList.push({ type: 'word', word: w, bgClass: bg }))
    }

    return { flatList, stickyIndexes, l1Map, exactMatchIndex }
  }, [data, contentMatches, searchQuery])
}
