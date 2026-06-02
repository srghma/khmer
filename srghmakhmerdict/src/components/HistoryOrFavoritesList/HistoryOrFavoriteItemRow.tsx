import React, { useCallback, useMemo, useRef, useState } from 'react'
import srghma_khmer_dict_content_styles from '../../srghma_khmer_dict_content.module.css'

// Types & Utils
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { type DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { colorizeText } from '../../utils/text-processing/text'

import { tab_title_ru } from '../SidebarHeader'
import { useDictionary } from '../../providers/DictionaryProvider'
import { isWordInKmMap } from '../../utils/isWordInKmMap'
import { useFavorites } from '../../providers/FavoritesProvider'
import { useNotes } from '../../providers/NotesProvider'
import { NoteModal } from '../NoteModal'
import { Button, type PressEvent } from '@heroui/button'
import { FaRegTrashAlt, FaCheckCircle, FaRegCircle, FaRegEdit, FaEdit } from 'react-icons/fa'

const MODES_ICON: Record<DictionaryLanguage, React.ReactNode> = {
  en: '🇬🇧',
  km: '🇰🇭',
  ru: tab_title_ru,
}

const SENTENCE_ICON = '📜'

interface HistoryOrFavoriteItemRowProps {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  onDelete: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => void
  maybeColorMode: MaybeColorizationMode
  renderRightAction: ((word: NonEmptyStringTrimmed, language: DictionaryLanguage) => React.ReactNode) | undefined
  isSelected: boolean
  isBlinking: boolean
  selectionMode: boolean
  onToggleSelection: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => void
}

export const HistoryOrFavoriteItemRow = React.memo<HistoryOrFavoriteItemRowProps>(
  ({
    word,
    language,
    onSelect,
    onDelete,
    maybeColorMode,
    renderRightAction,
    isSelected,
    isBlinking,
    selectionMode,
    onToggleSelection,
  }) => {
    const { km_map, en, ru } = useDictionary()
    const { favoritesMap } = useFavorites()
    const { getNote } = useNotes()
    const rowRef = useRef<HTMLDivElement>(null)
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)

    // Custom touch/pointer handler for long press that ignores scrolls
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isScrolling = useRef(false)
    const longPressFired = useRef(false)
    const startPos = useRef<{ x: number; y: number } | null>(null)

    const startPress = useCallback(
      (e: React.PointerEvent) => {
        isScrolling.current = false
        longPressFired.current = false
        startPos.current = { x: e.clientX, y: e.clientY }

        pressTimer.current = setTimeout(() => {
          if (!isScrolling.current && onToggleSelection) {
            longPressFired.current = true
            onToggleSelection(word, language)
          }
        }, 500)
      },
      [onToggleSelection, word, language],
    )

    const cancelPress = useCallback(() => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current)
        pressTimer.current = null
      }
    }, [])

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!startPos.current) return

        const dx = Math.abs(e.clientX - startPos.current.x)
        const dy = Math.abs(e.clientY - startPos.current.y)

        if (dx > 10 || dy > 10) {
          isScrolling.current = true
          cancelPress()
        }
      },
      [cancelPress],
    )

    const handlePointerUp = useCallback(() => {
      cancelPress()

      if (!isScrolling.current && !longPressFired.current) {
        if (selectionMode && onToggleSelection) {
          onToggleSelection(word, language)
        } else {
          onSelect(word, language)
        }
      }

      startPos.current = null
      isScrolling.current = false
      longPressFired.current = false
    }, [cancelPress, selectionMode, onToggleSelection, word, language, onSelect])

    const hasNote = !!getNote(word, language)

    const isSentence = useMemo(() => {
      switch (language) {
        case 'km': {
          const khmerWord = strToContainsKhmerOrUndefined(word)

          return !khmerWord || !isWordInKmMap(khmerWord, km_map)
        }

        case 'en':
          return !en.has(word)
        case 'ru':
          return !ru.has(word)
        default:
          return false
      }
    }, [language, word, km_map, en, ru])

    const wordColorized = useMemo(() => {
      return {
        __html: colorizeText(word, maybeColorMode, km_map, true, undefined, undefined, 'disabled', favoritesMap),
      }
    }, [word, km_map, maybeColorMode, favoritesMap])

    const handleDelete = useCallback(
      (_e: PressEvent) => {
        onDelete(word, language)
      },
      [onDelete, word, language],
    )

    return (
      <>
        <div className="relative border-b border-divider bg-content1" id={word}>
          <div
            ref={rowRef}
            className={`relative flex items-center px-4 py-1 w-full transition-colors select-none ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-default-100'}`}
            style={
              isBlinking
                ? {
                    backgroundColor: 'var(--heroui-warning-100, rgba(245, 165, 36, 0.4))',
                    transition: 'background-color 0.3s ease',
                  }
                : undefined
            }
          >
            {selectionMode && (
              <Button
                className="m-0 flex-shrink-0 text-primary cursor-pointer"
                onPress={() => onToggleSelection(word, language)}
              >
                {isSelected ? <FaCheckCircle size={20} /> : <FaRegCircle className="text-default-300" size={20} />}
              </Button>
            )}

            {/* Clickable Area for Navigation */}
            <div
              className="flex items-center flex-1 min-w-0 cursor-pointer"
              onPointerCancel={cancelPress}
              onPointerDown={startPress}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm shrink-0 pointer-events-none">
                {isSentence ? SENTENCE_ICON : MODES_ICON[language]}
              </div>
              <div className="flex-1 min-w-0 pointer-events-none pr-2">
                <div
                  dangerouslySetInnerHTML={wordColorized}
                  className={`text-foreground leading-snug truncate ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${language === 'km' ? 'font-khmer' : ''}`}
                />
              </div>
            </div>

            {/* Actions Area */}
            {!selectionMode && (
              <div className="flex items-center gap-1">
                {!isSentence && renderRightAction?.(word, language)}

                {/* Edit Note Button */}
                <Button
                  isIconOnly
                  className="min-w-8 w-8 h-8"
                  color="primary"
                  size="sm"
                  variant="light"
                  onPress={() => setIsNoteModalOpen(true)}
                >
                  {hasNote ? <FaEdit /> : <FaRegEdit />}
                </Button>

                <Button
                  isIconOnly
                  className="min-w-8 w-8 h-8"
                  color="danger"
                  size="sm"
                  variant="light"
                  onPress={handleDelete}
                >
                  <FaRegTrashAlt />
                </Button>
              </div>
            )}
          </div>
        </div>
        <NoteModal isOpen={isNoteModalOpen} language={language} word={word} onClose={() => setIsNoteModalOpen(false)} />
      </>
    )
  },
)

HistoryOrFavoriteItemRow.displayName = 'HistoryOrFavoriteItemRow'
