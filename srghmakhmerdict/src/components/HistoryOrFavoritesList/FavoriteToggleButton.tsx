import React, { memo, type MouseEventHandler } from 'react'
import { Button } from '@heroui/button'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { useToggleFavorite } from '../../hooks/useToggleFavorite'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'

const stopPropagation: MouseEventHandler =
  // | PressEventHandler
  e => e.stopPropagation()

export const FavoriteToggleButton: React.FC<{
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
}> = memo(({ word, mode }) => {
  const { isFav, toggleFav } = useToggleFavorite(word, mode)

  return (
    <Button
      isIconOnly
      aria-label="Toggle Favorite"
      radius="full"
      size="sm"
      variant="light"
      onClick={stopPropagation}
      // onPointerDown={stopPropagation}
      // onPointerUp={stopPropagation}
      onPress={toggleFav}
      // onPressStart={stopPropagation}
    >
      {isFav ? <FaStar className="text-warning text-lg" /> : <FaRegStar className="text-default-400 text-lg" />}
    </Button>
  )
})

FavoriteToggleButton.displayName = 'FavoriteToggleButton'
