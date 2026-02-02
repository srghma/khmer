import type { ProcessDataOutputKhmer, AlphabetGroupKhmer } from '../utils/toGroupKhmer'
import type { FlatListItem } from '../components/VirtualizedList'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { GROUP_COLORS } from '../utils/mkColorRotator'
import type { ProcessDataOutputKhmerCursor_OnlyFirstLevel } from '../utils/toGroupKhmer_cursor_onlyFirstLevel'
import type {
  ProcessDataOutputKhmerCursor_FirstAndSecondLevel,
  ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel,
} from '../utils/toGroupKhmer_cursor_full'
import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'

export interface FlattenKhmerResult {
  flatList: FlatListItem[]
  stickyIndexes: number[]
  l1IndexMap: Map<string, number>
  l2IndexMap: Map<string, number>
  indexToL1Cursor: Map<number, ProcessDataOutputKhmerCursor_OnlyFirstLevel>
  exactMatchIndex: number
}

/**
 * Pure function to flatten hierarchical Khmer dictionary data into a linear list.
 */
export function flattenKhmerData(
  data: ProcessDataOutputKhmer,
  searchQuery?: NonEmptyStringTrimmed,
  contentMatches?: NonEmptyStringTrimmed[],
): FlattenKhmerResult {
  const flatList: FlatListItem[] = []
  const stickyIndexes: number[] = []
  const l1IndexMap = new Map<string, number>()
  const l2IndexMap = new Map<string, number>()
  const indexToL1Cursor = new Map<number, ProcessDataOutputKhmerCursor_OnlyFirstLevel>()

  let exactMatchIndex = -1
  let colorIdx = 0

  const addHeader = (label: string, cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel, bgClass: string) => {
    const idx = flatList.length

    flatList.push({ type: 'header', label: label as any, bgClass, index: idx })
    stickyIndexes.push(idx)
    l1IndexMap.set(JSON.stringify(cursor), idx)
    indexToL1Cursor.set(idx, cursor)
  }

  const addWords = (words: readonly NonEmptyStringTrimmed[], bgClass: string) => {
    words.forEach(w => {
      if (exactMatchIndex === -1 && searchQuery && w === searchQuery) {
        exactMatchIndex = flatList.length
      }
      flatList.push({ type: 'word', word: w, bgClass })
    })
  }

  const processMap = (
    map: Map<Char, AlphabetGroupKhmer>,
    type: 'words_consonant' | 'words_vowel' | 'words_independent_vowel' | 'words_diacritic',
  ) => {
    for (const [char, group] of map) {
      const cursorL1: ProcessDataOutputKhmerCursor_OnlyFirstLevel = { t: type, firstChar: char as any }
      const headerBg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx % GROUP_COLORS.length])

      addHeader(char, cursorL1, headerBg)

      // 1. Words with no second char (∅)
      if (group.subGroups_noSecondChar) {
        const cursorL2: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = {
          ...cursorL1,
          secondChar: { t: 'noSecondChar' },
        } as any

        // Map the start of this block
        l2IndexMap.set(JSON.stringify(cursorL2), flatList.length)
        addWords(group.subGroups_noSecondChar, headerBg)
      }

      // 2. Subgroups
      const processSub = (subMap: Map<any, any>, subType: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel['t']) => {
        for (const [subChar, words] of subMap) {
          const bg = assertIsDefinedAndReturn(GROUP_COLORS[colorIdx++ % GROUP_COLORS.length])

          const cursorSub: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel = {
            t: subType,
            v: subChar,
          } as any
          const cursorL2: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = {
            ...cursorL1,
            secondChar: cursorSub,
          } as any

          l2IndexMap.set(JSON.stringify(cursorL2), flatList.length)
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
    const idx = flatList.length
    const bg = 'bg-secondary-50 dark:bg-secondary-900/30'

    flatList.push({ type: 'header', label: 'Found in content' as any, bgClass: bg, index: idx })
    stickyIndexes.push(idx)
    addWords(contentMatches, bg)
  }

  return {
    flatList,
    stickyIndexes,
    l1IndexMap,
    l2IndexMap,
    indexToL1Cursor,
    exactMatchIndex,
  }
}
