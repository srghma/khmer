import React, { useCallback, useMemo, useRef } from 'react'
import { useLongPress } from 'ahooks'
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
import { Button, type PressEvent } from '@heroui/button'
import { FaRegTrashAlt, FaCheckCircle, FaRegCircle } from 'react-icons/fa'

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
    selectionMode,
    onToggleSelection,
  }) => {
    const { km_map, en, ru } = useDictionary()
    const { favoritesMap } = useFavorites()
    const rowRef = useRef<HTMLDivElement>(null)

    useLongPress(
      () => {
        if (onToggleSelection) {
          onToggleSelection(word, language)
        }
      },
      rowRef,
      {
        onClick: (event: MouseEvent | TouchEvent) => {
          event.preventDefault()
          event.stopPropagation()
          if (selectionMode && onToggleSelection) {
            onToggleSelection(word, language)
          } else {
            onSelect(word, language)
          }
        },
      },
    )

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
      <div className="relative border-b border-divider bg-content1">
        <div
          ref={rowRef}
          className={`relative flex items-center px-4 py-1 w-full cursor-pointer hover:bg-default-100 transition-colors select-none ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
        >
          {selectionMode && (
            <div className="mr-3 flex-shrink-0 text-primary">
              {isSelected ? <FaCheckCircle size={20} /> : <FaRegCircle className="text-default-300" size={20} />}
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center mr-3 text-lg shadow-sm shrink-0">
            {isSentence ? SENTENCE_ICON : MODES_ICON[language]}
          </div>
          <div className="flex-1 min-w-0 pointer-events-none">
            <div
              dangerouslySetInnerHTML={wordColorized}
              className={`text-foreground leading-snug truncate ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content} ${language === 'km' ? 'font-khmer' : ''}`}
            />
          </div>

          {!isSentence && renderRightAction?.(word, language)}
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
      </div>
    )
  },
)

HistoryOrFavoriteItemRow.displayName = 'HistoryOrFavoriteItemRow'
