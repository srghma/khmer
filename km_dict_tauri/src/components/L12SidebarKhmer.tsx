import React, { useMemo, useState, useCallback } from 'react'
import { NavButton, SidebarHeader, sidebarClass } from './SidebarCommon'
import type { ProcessDataOutputKhmer_Lengths, AlphabetGroupKhmer_Lengths } from '../utils/toGroupKhmer_lengths'
import {
  ProcessDataOutputKhmerCursor_OnlyFirstLevel_eq,
  type ProcessDataOutputKhmerCursor_OnlyFirstLevel,
} from '../utils/toGroupKhmer_cursor_onlyFirstLevel'
import type {
  ProcessDataOutputKhmerCursor_FirstAndSecondLevel,
  ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel,
} from '../utils/toGroupKhmer_cursor_full'
import { KhmerInfoModal } from './KhmerInfoModal'

interface L12SidebarKhmerProps {
  data: ProcessDataOutputKhmer_Lengths
  activeL1: ProcessDataOutputKhmerCursor_OnlyFirstLevel
  scrollToLetter: (key: ProcessDataOutputKhmerCursor_OnlyFirstLevel) => void
  scrollToSubGroup: (key: ProcessDataOutputKhmerCursor_FirstAndSecondLevel) => void
}

const L12SidebarKhmerImpl: React.FC<L12SidebarKhmerProps> = ({ data, activeL1, scrollToLetter, scrollToSubGroup }) => {
  // Modal State
  const [longPressCursor, setLongPressCursor] = useState<
    ProcessDataOutputKhmerCursor_OnlyFirstLevel | ProcessDataOutputKhmerCursor_FirstAndSecondLevel | null
  >(null)

  const handleLongPressL1 = useCallback((cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel) => {
    setLongPressCursor(cursor)
  }, [])

  const handleLongPressL2 = useCallback((cursor: ProcessDataOutputKhmerCursor_FirstAndSecondLevel) => {
    setLongPressCursor(cursor)
  }, [])

  const handleCloseModal = useCallback(() => setLongPressCursor(null), [])

  // --- L1 Items ---
  const l1NavItems = useMemo(() => {
    const items: {
      cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel
      label: string
      color?: string
    }[] = []

    const add = (map: Map<string, any>, t: ProcessDataOutputKhmerCursor_OnlyFirstLevel['t'], color?: string) => {
      // Use map.keys() iterator to avoid creating intermediate arrays if possible,
      // though for sidebar size it's negligible.
      for (const char of map.keys()) {
        // @ts-ignore
        items.push({ cursor: { t, firstChar: char }, label: char, color })
      }
    }

    add(data.words_consonant, 'words_consonant')
    add(data.words_independent_vowel, 'words_independent_vowel', 'text-warning-500')
    add(data.words_vowel, 'words_vowel', 'text-secondary-500')
    add(data.words_diacritic, 'words_diacritic', 'text-success-500')

    if (data.numbers > 0) items.push({ cursor: { t: 'numbers' }, label: 'NUM', color: 'text-blue-500' })
    if (data.punctuation > 0) items.push({ cursor: { t: 'punctuation' }, label: 'PUN', color: 'text-orange-500' })
    if (data.lunarDates > 0) items.push({ cursor: { t: 'lunarDates' }, label: 'LUN', color: 'text-purple-500' })
    if (data.others_known > 0) items.push({ cursor: { t: 'others_known' }, label: 'OTH', color: 'text-slate-500' })

    return items
  }, [data])

  // --- L2 Items ---
  const l2NavItems = useMemo(() => {
    let activeGroup: AlphabetGroupKhmer_Lengths | undefined

    // Switch is fine, but map lookup is faster if we had a unified structure.
    // Keeping switch for type safety.
    switch (activeL1.t) {
      case 'words_consonant':
        activeGroup = data.words_consonant.get(activeL1.firstChar)
        break
      case 'words_vowel':
        activeGroup = data.words_vowel.get(activeL1.firstChar)
        break
      case 'words_independent_vowel':
        activeGroup = data.words_independent_vowel.get(activeL1.firstChar)
        break
      case 'words_diacritic':
        activeGroup = data.words_diacritic.get(activeL1.firstChar)
        break
      default:
        return []
    }

    if (!activeGroup) return []

    const items: {
      label: string
      cursor: ProcessDataOutputKhmerCursor_FirstAndSecondLevel
      color?: string
    }[] = []

    const mkFullCursor = (
      sub: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel,
    ): ProcessDataOutputKhmerCursor_FirstAndSecondLevel | undefined => {
      if (!('firstChar' in activeL1)) return undefined

      return { ...activeL1, secondChar: sub }
    }

    if (activeGroup.subGroups_noSecondChar > 0) {
      const cursor = mkFullCursor({ t: 'noSecondChar' })

      if (cursor) items.push({ label: '∅', cursor, color: 'text-default-300' })
    }

    const addItems = <K extends string>(
      map: Map<K, any>,
      type: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel['t'],
      color?: string,
    ) => {
      for (const key of map.keys()) {
        const cursor = mkFullCursor({ t: type, v: key } as any)

        if (cursor) items.push({ label: key, cursor, color })
      }
    }

    addItems(activeGroup.subGroups_consonant, 'consonant')
    addItems(activeGroup.subGroups_independent_vowel, 'independent_vowel', 'text-warning-500')
    addItems(activeGroup.subGroups_vowel, 'vowel', 'text-secondary-500')
    addItems(activeGroup.subGroups_diacritic, 'diacritic', 'text-success-500')
    addItems(activeGroup.subGroups_extraConsonant, 'extraConsonant', 'text-primary-500')
    addItems(activeGroup.subGroups_vowelCombination, 'vowelCombination', 'text-pink-500')

    return items
  }, [data, activeL1])

  return (
    <>
      <div className={`${sidebarClass} border-r`}>
        <SidebarHeader>ក-អ</SidebarHeader>
        {l1NavItems.map(item => (
          <NavButton
            key={`${item.cursor.t}_${'firstChar' in item.cursor ? item.cursor.firstChar : ''}`}
            active={ProcessDataOutputKhmerCursor_OnlyFirstLevel_eq(item.cursor, activeL1)}
            className={item.color}
            label={item.label}
            onClick={() => scrollToLetter(item.cursor)}
            onLongPress={() => handleLongPressL1(item.cursor)}
          />
        ))}
      </div>

      <div className={`${sidebarClass} border-l`}>
        <SidebarHeader>ជើង</SidebarHeader>
        {l2NavItems.map(item => (
          <NavButton
            key={item.label}
            active={false} // Simplification: we don't track active L2 in props yet
            className={item.color}
            label={item.label}
            onClick={() => scrollToSubGroup(item.cursor)}
            onLongPress={() => handleLongPressL2(item.cursor)}
          />
        ))}
      </div>

      <KhmerInfoModal cursor={longPressCursor} isOpen={!!longPressCursor} onClose={handleCloseModal} />
    </>
  )
}

export const L12SidebarKhmer = React.memo(L12SidebarKhmerImpl)
