import React, { useCallback, useMemo } from 'react'
import { motion, useAnimation, type PanInfo } from 'framer-motion'
import srghma_khmer_dict_content_styles from '../../srghma_khmer_dict_content.module.css'

// Types & Utils
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict/index'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { colorizeText } from '../../utils/text-processing/text'

// DB

// Components

import { TrashIcon, ChevronIcon } from './SharedComponents'
import { tab_title_ru } from '../SidebarHeader'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

const MODES_ICON: Record<DictionaryLanguage, React.ReactNode> = {
  en: '🇬🇧',
  km: '🇰🇭',
  ru: tab_title_ru,
}

const ANIM_ENTER = { height: 'auto', opacity: 1 } as const
const ANIM_EXIT = { height: 0, opacity: 0, transition: { duration: 0.2 } } as const
const ANIM_INITIAL = { height: 0, opacity: 0 } as const
const ANIM_TRASH_EXIT = { x: -500, transition: { duration: 0.2 } } as const
const ANIM_SNAP_BACK = { x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } as const
const DRAG_CONSTRAINTS = { left: -1000, right: 0 } as const
const TOUCH_STYLE: React.CSSProperties = { touchAction: 'pan-y' } as const

interface HistoryItemRowProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  onDelete: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => void
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
  renderRightAction?: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => React.ReactNode
}

export const HistoryItemRow = React.memo<HistoryItemRowProps>(
  ({ word, language, onSelect, onDelete, km_map, maybeColorMode, renderRightAction }) => {
    const controls = useAnimation()

    const handleDragEnd = useCallback(
      async (_: unknown, info: PanInfo) => {
        const offset = info.offset.x
        const velocity = info.velocity.x

        if (offset < -100 || (offset < -50 && velocity < -500)) {
          await controls.start(ANIM_TRASH_EXIT)
          onDelete(word, language)
        } else {
          controls.start(ANIM_SNAP_BACK)
        }
      },
      [controls, onDelete, word, language],
    )

    const wordColorized = useMemo(() => {
      if (maybeColorMode === 'none' || !isContainsKhmer(word)) return { __html: word }

      return { __html: colorizeText(word, maybeColorMode, km_map) }
    }, [word, km_map, maybeColorMode])

    const onTap = useCallback(() => onSelect(word, language), [onSelect, word, language])

    return (
      <motion.div
        animate={ANIM_ENTER}
        className="relative overflow-hidden border-b border-divider bg-content1"
        exit={ANIM_EXIT}
        initial={ANIM_INITIAL}
        layout="position"
      >
        <TrashIcon />
        <motion.div
          animate={controls}
          className="relative bg-content1 flex items-center px-4 py-3 w-full cursor-pointer hover:bg-default-100 transition-colors"
          drag="x"
          dragConstraints={DRAG_CONSTRAINTS}
          dragElastic={0.1}
          style={TOUCH_STYLE}
          onDragEnd={handleDragEnd}
          onTap={onTap}
        >
          <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm shrink-0">
            {MODES_ICON[language]}
          </div>
          <div className="flex-1 min-w-0 pointer-events-none select-none">
            <div
              dangerouslySetInnerHTML={wordColorized}
              className={`text-foreground text-medium leading-snug truncate ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content}`}
            />
          </div>

          {/* Render the action if provided (e.g., the star button) */}
          {renderRightAction?.(word, language)}

          <ChevronIcon />
        </motion.div>
      </motion.div>
    )
  },
)

HistoryItemRow.displayName = 'HistoryItemRow'
